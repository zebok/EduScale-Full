const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

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

module.exports = router;
