const express = require('express');
const router = express.Router();
const TenantConfig = require('../models/TenantConfig');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/tenant-config/:tenant_id - Obtener configuración de un tenant
// Protegido: requiere autenticación
router.get('/:tenant_id', authMiddleware, async (req, res) => {
  try {
    const { tenant_id } = req.params;

    // Verificar que el usuario solo pueda acceder a su propio tenant
    if (req.user.tenant_id !== tenant_id) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para acceder a esta institución'
      });
    }

    // Buscar configuración del tenant
    const config = await TenantConfig.findOne({ tenant_id });

    if (!config) {
      return res.status(404).json({
        error: 'No encontrado',
        message: 'Configuración de institución no encontrada'
      });
    }

    res.json(config);

  } catch (error) {
    console.error('Error al obtener tenant config:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: 'Error al obtener configuración'
    });
  }
});

// POST /api/tenant-config - Crear configuración de tenant (solo para testing)
router.post('/', async (req, res) => {
  try {
    const configData = req.body;

    // Verificar que no exista ya un tenant con ese ID
    const existing = await TenantConfig.findOne({ tenant_id: configData.tenant_id });

    if (existing) {
      return res.status(409).json({
        error: 'Ya existe una configuración para este tenant_id'
      });
    }

    // Crear nueva configuración
    const newConfig = new TenantConfig(configData);
    await newConfig.save();

    res.status(201).json({
      message: 'Configuración creada exitosamente',
      config: newConfig
    });

  } catch (error) {
    console.error('Error al crear tenant config:', error);
    res.status(500).json({
      error: 'Error al crear configuración',
      message: error.message
    });
  }
});

module.exports = router;
