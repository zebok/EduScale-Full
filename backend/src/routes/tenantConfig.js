const express = require('express');
const router = express.Router();
const TenantConfig = require('../models/TenantConfig');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/tenant-config/:tenant_id - Obtener configuración de un tenant (tenant_id == institution_id)
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

    // Buscar configuración del tenant usando institution_id en la colección
    const config = await TenantConfig.findOne({ institution_id: tenant_id });

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

    // Permitir ambos nombres de campo por compatibilidad
    const institution_id = configData.institution_id || configData.tenant_id;
    if (!institution_id) {
      return res.status(400).json({
        error: 'Falta institution_id'
      });
    }

    // Verificar que no exista ya un tenant con ese ID
    const existing = await TenantConfig.findOne({ institution_id });

    if (existing) {
      return res.status(409).json({
        error: 'Ya existe una configuración para esta institution_id'
      });
    }

    // Crear nueva configuración
    const newConfig = new TenantConfig({ ...configData, institution_id });
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
 
// -------------------------------
// Fees endpoint (private only)
// GET /api/tenant-config/:tenant_id/fees
// -------------------------------
router.get('/:tenant_id/fees', authMiddleware, async (req, res) => {
  try {
    const { tenant_id } = req.params;

    // Authorization: same tenant
    if (req.user.tenant_id !== tenant_id) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para acceder a esta institución'
      });
    }

    const config = await TenantConfig.findOne({ institution_id: tenant_id });
    if (!config) {
      return res.status(404).json({ error: 'No encontrado', message: 'Institución inexistente' });
    }

    const typeNorm = (config.institution?.type || '')
      .toString()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const isPrivate = typeNorm.includes('privada');
    if (!isPrivate) {
      return res.status(404).json({
        error: 'No disponible',
        message: 'La sección de aranceles solo aplica a instituciones privadas'
      });
    }

    // If in future we persist payments in config.settings.payments, return that; else defaults
    const payments = config.settings?.payments;
    const fees = payments || {
      institution_id: tenant_id,
      currency: 'ARS',
      inscription_fee: 150000,
      monthly_fee: { amount: 120000, installments: 10 },
      payment_methods: ['Tarjeta de crédito', 'Transferencia bancaria', 'Débito automático'],
      due_dates: ['10', '20'],
      discounts: [
        { type: 'pronto_pago', label: 'Pronto pago', percent: 10, until_day: 10 },
        { type: 'alumno_regular', label: 'Alumno regular', percent: 5 }
      ],
      late_fee: { percent: 5, after_days: 5 }
    };

    return res.json({ fees });
  } catch (error) {
    console.error('Error al obtener aranceles:', error);
    res.status(500).json({ error: 'Error en el servidor', message: 'No se pudieron obtener los aranceles' });
  }
});
