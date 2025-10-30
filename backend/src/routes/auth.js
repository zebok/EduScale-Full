const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const redisConfig = require('../config/redis');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/auth/login - Login de administradores
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        error: 'Campos requeridos',
        message: 'Email y contraseña son obligatorios'
      });
    }

    // Buscar usuario por email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
      return res.status(401).json({
        error: 'Usuario inactivo',
        message: 'Tu cuenta ha sido desactivada'
      });
    }

    // Comparar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Actualizar último login
    user.ultimo_login = new Date();
    await user.save();

    // Generar token JWT
    const token = generateToken({
      userId: user._id.toString(),
      tenant_id: user.tenant_id,
      rol: user.rol
    });

    // Crear sesión en Redis (1 hora de TTL)
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
      await redisClient.setEx(
        sessionKey,
        3600, // 1 hora
        JSON.stringify(sessionData)
      );
      console.log(`✓ Session created in Redis for ${user.email}`);
    } catch (redisError) {
      console.error('⚠️  Failed to create Redis session:', redisError);
      // Continue anyway, JWT still works
    }

    // Responder con token y datos del usuario
    res.json({
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
