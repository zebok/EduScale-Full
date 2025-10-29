const express = require('express');
const router = express.Router();
const redisConfig = require('../config/redis');
const rateLimit = require('express-rate-limit');

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 solicitudes por ventana
  message: { error: 'Demasiadas solicitudes, por favor intenta más tarde.' }
});

// POST: Registrar interés (Fase A - Prospección)
router.post('/', limiter, async (req, res) => {
  try {
    const { email, nombre, apellido, telefono } = req.body;

    if (!email || !nombre || !apellido) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Verificar si el email ya está registrado (validación de duplicados)
    const exists = await redisConfig.redisConfig.redisClient.get(`prospecto:${email}`);

    if (exists) {
      return res.status(409).json({
        error: 'Ya iniciaste tu postulación anteriormente',
        existingData: JSON.parse(exists)
      });
    }

    // Guardar datos del prospecto en Redis
    const prospectoData = {
      email,
      nombre,
      apellido,
      telefono: telefono || '',
      fecha_registro: new Date().toISOString(),
      estado: 'interesado'
    };

    // Guardar en Redis con TTL de 30 días (2592000 segundos)
    await redisConfig.redisClient.setEx(
      `prospecto:${email}`,
      2592000,
      JSON.stringify(prospectoData)
    );

    // Incrementar contador de prospectos
    await redisConfig.redisClient.incr('contador:prospectos');

    res.status(201).json({
      message: 'Interés registrado correctamente',
      data: prospectoData
    });
  } catch (error) {
    console.error('Error en prospection POST:', error);
    res.status(500).json({ error: 'Error al registrar el interés' });
  }
});

// GET: Obtener información de un prospecto
router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const prospectoData = await redisConfig.redisClient.get(`prospecto:${email}`);

    if (!prospectoData) {
      return res.status(404).json({ error: 'Prospecto no encontrado' });
    }

    res.json({
      prospecto: JSON.parse(prospectoData)
    });
  } catch (error) {
    console.error('Error en prospection GET:', error);
    res.status(500).json({ error: 'Error al obtener el prospecto' });
  }
});

// GET: Obtener estadísticas
router.get('/stats/total', async (req, res) => {
  try {
    const total = await redisConfig.redisClient.get('contador:prospectos') || '0';

    res.json({
      total_prospectos: parseInt(total)
    });
  } catch (error) {
    console.error('Error en prospection stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
