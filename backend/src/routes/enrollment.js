const express = require('express');
const router = express.Router();
const EnrollmentRepository = require('../repositories/EnrollmentRepository');
const TenantConfig = require('../models/TenantConfig');
const authMiddleware = require('../middleware/authMiddleware');

// All enrollment endpoints require authentication
router.use(authMiddleware);

/**
 * POST /api/enrollment
 * Create a new enrollment (Phase C)
 */
router.post('/', async (req, res) => {
  try {
    const {
      email,
      nombre_completo,
      documento,
      tipo_documento,
      telefono,
      fecha_nacimiento,
      institution_id,
      career_id,
      prospection_date,
      prospection_source
    } = req.body;

    // Validations
    if (!email || !nombre_completo || !institution_id || !career_id) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        required: ['email', 'nombre_completo', 'institution_id', 'career_id']
      });
    }

    // Check if enrollment already exists
    const exists = await EnrollmentRepository.exists(institution_id, email, career_id);
    if (exists) {
      return res.status(409).json({
        error: 'Inscripción duplicada',
        message: 'Este alumno ya está inscripto en esta carrera'
      });
    }

    // Get institution and career details
    const institution = await TenantConfig.findOne({ institution_id });
    if (!institution) {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }

    const career = institution.careers.find(c => c.career_id === career_id);
    if (!career) {
      return res.status(404).json({ error: 'Carrera no encontrada' });
    }

    // Create enrollment
    const enrollmentData = {
      institution_id,
      email,
      career_id,
      nombre_completo,
      documento,
      tipo_documento: tipo_documento || 'DNI',
      telefono,
      fecha_nacimiento,
      institution_name: institution.institution.name,
      career_name: career.name,
      career_faculty: career.faculty,
      academic_year: new Date().getFullYear(),
      enrollment_period: `${new Date().getFullYear()}-${Math.ceil((new Date().getMonth() + 1) / 6)}`,
      prospection_date: prospection_date || new Date(),
      prospection_source: prospection_source || 'web',
      created_by: req.user.email
    };

    const result = await EnrollmentRepository.create(enrollmentData);

    res.status(201).json({
      message: 'Inscripción creada exitosamente',
      data: result
    });

  } catch (error) {
    console.error('Error creating enrollment:', error);
    res.status(500).json({ error: 'Error al crear inscripción' });
  }
});

/**
 * GET /api/enrollment
 * List enrollments (filtered by user role)
 */
router.get('/', async (req, res) => {
  try {
    const { status, academic_year } = req.query;
    const userRole = req.user.rol;
    const userInstitution = req.user.tenant_id;

    let enrollments = [];

    if (userRole === 'super_admin') {
      // Super admin can see all enrollments (aggregate from all institutions)
      const institutions = await TenantConfig.find({}, { institution_id: 1 });

      const allEnrollmentsPromises = institutions.map(inst =>
        EnrollmentRepository.findByInstitution(inst.institution_id)
      );

      const allEnrollmentsArrays = await Promise.all(allEnrollmentsPromises);
      enrollments = allEnrollmentsArrays.flat();

    } else {
      // Regular admin sees only their institution
      if (status) {
        enrollments = await EnrollmentRepository.findByInstitutionAndStatus(userInstitution, status);
      } else if (academic_year) {
        enrollments = await EnrollmentRepository.findByInstitutionAndYear(userInstitution, parseInt(academic_year));
      } else {
        enrollments = await EnrollmentRepository.findByInstitution(userInstitution);
      }
    }

    res.json({
      total: enrollments.length,
      enrollments: enrollments.map(e => ({
        institution_id: e.institution_id,
        email: e.email,
        career_id: e.career_id,
        enrollment_id: e.enrollment_id?.toString(),
        nombre_completo: e.nombre_completo,
        career_name: e.career_name,
        enrollment_status: e.enrollment_status,
        admission_status: e.admission_status,
        document_status: e.document_status,
        payment_status: e.payment_status,
        created_at: e.created_at,
        updated_at: e.updated_at
      }))
    });

  } catch (error) {
    console.error('Error listing enrollments:', error);
    res.status(500).json({ error: 'Error al listar inscripciones' });
  }
});

/**
 * GET /api/enrollment/:institution_id/:email
 * Get all enrollments for a student in an institution
 */
router.get('/:institution_id/:email', async (req, res) => {
  try {
    const { institution_id, email } = req.params;

    // Authorization check
    if (req.user.rol !== 'super_admin' && req.user.tenant_id !== institution_id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const enrollments = await EnrollmentRepository.findByInstitutionAndEmail(institution_id, email);

    res.json({
      total: enrollments.length,
      enrollments
    });

  } catch (error) {
    console.error('Error getting enrollments:', error);
    res.status(500).json({ error: 'Error al obtener inscripciones' });
  }
});

/**
 * GET /api/enrollment/:institution_id/:email/:career_id
 * Get specific enrollment details
 */
router.get('/:institution_id/:email/:career_id', async (req, res) => {
  try {
    const { institution_id, email, career_id } = req.params;

    // Authorization check
    if (req.user.rol !== 'super_admin' && req.user.tenant_id !== institution_id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const enrollment = await EnrollmentRepository.findOne(institution_id, email, career_id);

    if (!enrollment) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    res.json({ enrollment });

  } catch (error) {
    console.error('Error getting enrollment:', error);
    res.status(500).json({ error: 'Error al obtener inscripción' });
  }
});

/**
 * PATCH /api/enrollment/:institution_id/:email/:career_id/status
 * Update enrollment status
 */
router.patch('/:institution_id/:email/:career_id/status', async (req, res) => {
  try {
    const { institution_id, email, career_id } = req.params;
    const { status } = req.body;

    // Authorization check
    if (req.user.rol !== 'super_admin' && req.user.tenant_id !== institution_id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status es requerido' });
    }

    const validStatuses = ['pendiente', 'confirmado', 'matriculado', 'cancelado', 'rechazado'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Status inválido',
        valid_statuses: validStatuses
      });
    }

    await EnrollmentRepository.updateStatus(institution_id, email, career_id, status, req.user.email);

    res.json({
      message: 'Estado actualizado correctamente',
      new_status: status
    });

  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

/**
 * PATCH /api/enrollment/:institution_id/:email/:career_id/admission
 * Update admission data (Phase B)
 */
router.patch('/:institution_id/:email/:career_id/admission', async (req, res) => {
  try {
    const { institution_id, email, career_id } = req.params;
    const { status, score, notes } = req.body;

    // Authorization check
    if (req.user.rol !== 'super_admin' && req.user.tenant_id !== institution_id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const admissionData = {
      status: status || 'en_revision',
      score,
      notes
    };

    await EnrollmentRepository.updateAdmission(institution_id, email, career_id, admissionData, req.user.email);

    res.json({
      message: 'Datos de admisión actualizados correctamente'
    });

  } catch (error) {
    console.error('Error updating admission:', error);
    res.status(500).json({ error: 'Error al actualizar admisión' });
  }
});

/**
 * PATCH /api/enrollment/:institution_id/:email/:career_id/payment
 * Update payment status
 */
router.patch('/:institution_id/:email/:career_id/payment', async (req, res) => {
  try {
    const { institution_id, email, career_id } = req.params;
    const { status, amount, currency, method } = req.body;

    // Authorization check
    if (req.user.rol !== 'super_admin' && req.user.tenant_id !== institution_id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const paymentData = {
      status: status || 'pendiente',
      amount,
      currency: currency || 'ARS',
      method
    };

    await EnrollmentRepository.updatePaymentStatus(institution_id, email, career_id, paymentData, req.user.email);

    res.json({
      message: 'Estado de pago actualizado correctamente'
    });

  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Error al actualizar pago' });
  }
});

/**
 * PATCH /api/enrollment/:institution_id/:email/:career_id/documents
 * Update document status
 */
router.patch('/:institution_id/:email/:career_id/documents', async (req, res) => {
  try {
    const { institution_id, email, career_id } = req.params;
    const { status } = req.body;

    // Authorization check
    if (req.user.rol !== 'super_admin' && req.user.tenant_id !== institution_id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status es requerido' });
    }

    const validStatuses = ['pendiente', 'incompleto', 'completo', 'verificado'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Status inválido',
        valid_statuses: validStatuses
      });
    }

    await EnrollmentRepository.updateDocumentStatus(institution_id, email, career_id, status, req.user.email);

    res.json({
      message: 'Estado de documentos actualizado correctamente',
      new_status: status
    });

  } catch (error) {
    console.error('Error updating documents:', error);
    res.status(500).json({ error: 'Error al actualizar documentos' });
  }
});

module.exports = router;
