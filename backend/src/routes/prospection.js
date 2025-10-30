const express = require('express');
const router = express.Router();
const redisConfig = require('../config/redis');
const TenantConfig = require('../models/TenantConfig');
const rateLimit = require('express-rate-limit');

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 solicitudes por ventana
  message: { error: 'Demasiadas solicitudes, por favor intenta más tarde.' }
});

// GET: Obtener todas las instituciones activas
router.get('/instituciones', async (req, res) => {
  try {
    // Include city and province so frontend can filter by location
    const instituciones = await TenantConfig.find({ status: 'active' })
      .select('institution_id institution.name institution.short_name institution.type institution.city institution.province careers domain branding.logo_url')
      .sort('institution.name');

    res.json({
      instituciones: instituciones.map(inst => ({
        id: inst._id,
        institution_id: inst.institution_id,
        nombre: inst.institution.name,
        nombre_corto: inst.institution.short_name,
        tipo: inst.institution.type,
        city: inst.institution?.city || null,
        province: inst.institution?.province || null,
        domain: inst.domain,
        logo_url: inst.branding?.logo_url,
        total_carreras: inst.careers.length
      }))
    });
  } catch (error) {
    console.error('Error al obtener instituciones:', error);
    res.status(500).json({ error: 'Error al obtener instituciones' });
  }
});

// GET: Obtener carreras de una institución específica
router.get('/instituciones/:institucionId/carreras', async (req, res) => {
  try {
    const { institucionId } = req.params;

    const institucion = await TenantConfig.findById(institucionId).select('institution careers');

    if (!institucion) {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }

    res.json({
      institucion: institucion.institution.name,
      carreras: institucion.careers.map(carrera => ({
        id: carrera.career_id,
        career_id: carrera.career_id,
        nombre: carrera.name,
        codigo: carrera.code,
        facultad: carrera.faculty,
        duracion_años: carrera.duration_years,
        modalidad: carrera.modality,
        turnos: carrera.shift,
        cupo_anual: carrera.cupo_anual,
        descripcion: carrera.description
      }))
    });
  } catch (error) {
    console.error('Error al obtener carreras:', error);
    res.status(500).json({ error: 'Error al obtener carreras' });
  }
});

// POST: Registrar interés (Fase A - Prospección)
router.post('/', limiter, async (req, res) => {
  try {
    const { email, nombreCompleto, institucionId, carreraId } = req.body;

    if (!email || !nombreCompleto || !institucionId || !carreraId) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Verificar si el email ya está registrado (validación de duplicados)
    const exists = await redisConfig.redisClient.get(`prospecto:${email}`);

    if (exists) {
      return res.status(409).json({
        error: 'Ya iniciaste tu postulación anteriormente',
        existingData: JSON.parse(exists)
      });
    }

    // Obtener datos de institución y carrera
    const institucion = await TenantConfig.findById(institucionId);
    if (!institucion) {
      return res.status(400).json({ error: 'Institución no válida' });
    }

    const carrera = institucion.careers.find(c => c.career_id === carreraId);
    if (!carrera) {
      return res.status(400).json({ error: 'Carrera no válida' });
    }

    // Guardar datos del prospecto en Redis (Fase A)
    const prospectoData = {
      email,
      nombreCompleto,
      institucion: {
        id: institucion._id,
        institution_id: institucion.institution_id,
        nombre: institucion.institution.name,
        nombre_corto: institucion.institution.short_name,
        tipo: institucion.institution.type
      },
      carrera: {
        career_id: carrera.career_id,
        nombre: carrera.name,
        codigo: carrera.code,
        facultad: carrera.faculty
      },
      fecha_registro: new Date().toISOString(),
      estado: 'interesado',
      fase: 'A - Prospección'
    };

    // Guardar en Redis con TTL de 2 horas (7200 segundos)
    await redisConfig.redisClient.setEx(
      `prospecto:${email}`,
      7200,
      JSON.stringify(prospectoData)
    );

    // Incrementar contador global de prospectos
    await redisConfig.redisClient.incr('contador:prospectos');

    // Incrementar contador por institución (para analytics)
    await redisConfig.redisClient.incr(`contador:institucion:${institucion.institution_id}`);

    res.status(201).json({
      message: 'Interés registrado correctamente en Redis (Fase A)',
      data: prospectoData,
      ttl_horas: 2
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
