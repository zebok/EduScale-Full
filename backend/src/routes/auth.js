const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const redisConfig = require('../config/redis');
const authMiddleware = require('../middleware/authMiddleware');
const { executeQuery } = require('../config/cassandra');

// POST /api/auth/login - Login de administradores
router.post('/login', async (req, res) => {
  try {
  const { email, password } = req.body;
  const loginIdentifier = (email || '').toLowerCase().trim();

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        error: 'Campos requeridos',
        message: 'Email y contraseña son obligatorios'
      });
    }

    // Buscar usuario admin por email (Mongo)
  const user = await User.findOne({ email: loginIdentifier });

    // Verificar si el usuario está activo
    if (user) {
      // Flujo de login Admin (Mongo)
      if (!user.activo) {
        return res.status(401).json({
          error: 'Usuario inactivo',
          message: 'Tu cuenta ha sido desactivada'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        // Si la contraseña no coincide para admin, no devolvemos aún, probamos flujo alumno
      } else {
        user.ultimo_login = new Date();
        await user.save();

        const token = generateToken({
          userId: user._id.toString(),
          tenant_id: user.tenant_id,
          rol: user.rol
        });

        const sessionData = {
          userId: user._id.toString(),
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          tenant_id: user.tenant_id,
          rol: user.rol,
          permisos: user.permisos,
          loginAt: new Date().toISOString()
        };

        const redisClient = redisConfig.redisClient;
        const sessionKey = `session:${user._id.toString()}`;

        try {
          await redisClient.setEx(sessionKey, 3600, JSON.stringify(sessionData));
          console.log(`✓ Session created in Redis for ${user.email}`);
        } catch (redisError) {
          console.error('⚠️  Failed to create Redis session:', redisError);
        }

        return res.json({
          token,
          user: {
            id: user._id,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido,
            tenant_id: user.tenant_id,
            rol: user.rol,
            permisos: user.permisos
          }
        });
      }
    }

    // Flujo de login Alumno (Cassandra)
    // Buscar por email académico y contraseña en enrollments
    // 1) Intento por academic_mail
    const cqlByAcademic = `SELECT * FROM enrollments WHERE academic_mail = ? AND academic_password = ? AND enrollment_status = 'matriculado' ALLOW FILTERING`;
    let result = await executeQuery(cqlByAcademic, [loginIdentifier, password], { prepare: true });

    // 2) Si no hay resultados, intento por email personal
    if (!result || result.rowLength === 0) {
      const cqlByPersonal = `SELECT * FROM enrollments WHERE email = ? AND academic_password = ? AND enrollment_status = 'matriculado' ALLOW FILTERING`;
      result = await executeQuery(cqlByPersonal, [loginIdentifier, password], { prepare: true });
    }

    if (!result || result.rowLength === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Tomar la primera coincidencia (un alumno puede tener múltiples carreras; aquí simplificamos)
  const row = result.rows[0];

    // Generar un userId estable para alumnos (usar enrollment_id si existe, sino academic_mail)
    const studentId = (row.enrollment_id && row.enrollment_id.toString()) || `student:${row.academic_mail}`;

    // Generar token JWT para alumno
    const token = generateToken({
      userId: studentId,
      tenant_id: row.institution_id,
      rol: 'alumno'
    });

    // Crear sesión en Redis
    const sessionData = {
      userId: studentId,
      email: row.academic_mail || row.email || loginIdentifier,
      nombre: row.nombre_completo || 'Alumno',
      apellido: '',
      tenant_id: row.institution_id,
      rol: 'alumno',
      permisos: [],
      loginAt: new Date().toISOString()
    };

    const redisClient = redisConfig.redisClient;
    const sessionKey = `session:${studentId}`;

    try {
      await redisClient.setEx(sessionKey, 3600, JSON.stringify(sessionData));
      console.log(`✓ Session created in Redis for student ${sessionData.email}`);
    } catch (redisError) {
      console.error('⚠️  Failed to create Redis session (student):', redisError);
    }

    // Respuesta para alumno
    return res.json({
      token,
      user: {
        id: studentId,
        email: sessionData.email,
        nombre: sessionData.nombre,
        apellido: sessionData.apellido,
        tenant_id: sessionData.tenant_id,
        rol: 'alumno',
        permisos: []
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Error al procesar el login'
    });
  }
});

// POST /api/auth/register - Registrar nuevo usuario admin (solo para testing)
router.post('/register', async (req, res) => {
  try {
    const { email, password, nombre, apellido, tenant_id, rol } = req.body;

    // Validar campos requeridos
    if (!email || !password || !nombre || !apellido || !tenant_id) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        error: 'El usuario ya existe'
      });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      nombre,
      apellido,
      tenant_id,
      rol: rol || 'admin'
    });

    await newUser.save();

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: newUser._id,
        email: newUser.email,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        tenant_id: newUser.tenant_id,
        rol: newUser.rol
      }
    });

  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      error: 'Error al crear usuario'
    });
  }
});

// POST /api/auth/logout - Cerrar sesión e invalidar token
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessionKey = `session:${userId}`;
    const redisClient = redisConfig.redisClient;

    // Eliminar sesión de Redis
    await redisClient.del(sessionKey);

    console.log(`✓ Session invalidated for user ${req.user.email}`);

    res.json({
      message: 'Sesión cerrada exitosamente'
    });

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      error: 'Error al cerrar sesión'
    });
  }
});

// GET /api/auth/active-sessions - Obtener sesiones activas (solo super_admin)
router.get('/active-sessions', authMiddleware, async (req, res) => {
  try {
    // Solo super_admin puede ver sesiones activas
    if (req.user.rol !== 'super_admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const redisClient = redisConfig.redisClient;
    const sessionKeys = await redisClient.keys('session:*');

    const activeSessions = [];

    for (const key of sessionKeys) {
      const sessionData = await redisClient.get(key);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const ttl = await redisClient.ttl(key);

        activeSessions.push({
          userId: session.userId,
          email: session.email,
          nombre: `${session.nombre} ${session.apellido}`,
          tenant_id: session.tenant_id,
          rol: session.rol,
          loginAt: session.loginAt,
          expiresIn: `${Math.floor(ttl / 60)} minutes`
        });
      }
    }

    res.json({
      total: activeSessions.length,
      sessions: activeSessions
    });

  } catch (error) {
    console.error('Error getting active sessions:', error);
    res.status(500).json({
      error: 'Error al obtener sesiones activas'
    });
  }
});

module.exports = router;
