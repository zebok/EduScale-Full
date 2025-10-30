const express = require('express');
const router = express.Router();
const EnrollmentRepository = require('../repositories/EnrollmentRepository');
const TenantConfig = require('../models/TenantConfig');
const authMiddleware = require('../middleware/authMiddleware');

// All enrollment endpoints require authentication
router.use(authMiddleware);

/**
 * GET /api/enrollment/workflow/:institution_id
 * Get enrollment workflow stages for an institution
 * MUST be before /:institution_id/:email routes
 */
router.get('/workflow/:institution_id', async (req, res) => {
  try {
    const { institution_id } = req.params;

    // Authorization check
    if (req.user.rol !== 'super_admin' && req.user.tenant_id !== institution_id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const institution = await TenantConfig.findOne({ institution_id });
    if (!institution) {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }

    if (!institution.enrollment_workflow || !institution.enrollment_workflow.stages) {
      return res.status(404).json({
        error: 'Esta institución no tiene un workflow configurado'
      });
    }

    res.json({
      institution_id,
      institution_name: institution.institution.name,
      workflow: institution.enrollment_workflow
    });

  } catch (error) {
    console.error('Error getting workflow:', error);
    res.status(500).json({ error: 'Error al obtener workflow' });
  }
});

/**
 * GET /api/enrollment/stats/:institution_id
 * Get enrollment statistics with breakdown by stage
 * MUST be before /:institution_id/:email routes
 */
router.get('/stats/:institution_id', async (req, res) => {
  try {
    const { institution_id } = req.params;
    const { academic_year } = req.query;

    // Authorization check
    if (req.user.rol !== 'super_admin' && req.user.tenant_id !== institution_id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Get institution and workflow
    const institution = await TenantConfig.findOne({ institution_id });
    if (!institution) {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }

    // Get enrollments
    let enrollments;
    if (academic_year) {
      enrollments = await EnrollmentRepository.findByInstitutionAndYear(institution_id, parseInt(academic_year));
    } else {
      enrollments = await EnrollmentRepository.findByInstitution(institution_id);
    }

    // Calculate stats
    const stats = {
      total: enrollments.length,
      by_status: {},
      by_career: {}
    };

    // Count by status
    enrollments.forEach(e => {
      const status = e.enrollment_status || 'desconocido';
      stats.by_status[status] = (stats.by_status[status] || 0) + 1;

      const career = e.career_name || e.career_id;
      stats.by_career[career] = (stats.by_career[career] || 0) + 1;
    });

    // If workflow exists, map statuses to stages
    if (institution.enrollment_workflow && institution.enrollment_workflow.stages) {
      const stages = institution.enrollment_workflow.stages;
      stats.by_stage = {};

      stages.forEach(stage => {
        const count = enrollments.filter(e =>
          e.enrollment_status === stage.status_key
        ).length;

        stats.by_stage[stage.status_key] = {
          stage_id: stage.stage_id,
          name: stage.name,
          count,
          percentage: enrollments.length > 0 ? ((count / enrollments.length) * 100).toFixed(1) : '0.0',
          color: stage.color,
          icon: stage.icon
        };
      });
    }

    res.json({
      institution_id,
      institution_name: institution.institution.name,
      academic_year: academic_year || 'all',
      stats
    });

  } catch (error) {
    console.error('Error getting enrollment stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

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
 * Query params: status, academic_year, stage_id, career_id
 */
router.get('/', async (req, res) => {
  try {
    const { status, academic_year, stage_id, career_id } = req.query;
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

    // Client-side filtering by stage_id (requires loading workflow)
    if (stage_id) {
      const institution = await TenantConfig.findOne({
        institution_id: userRole === 'super_admin' ? enrollments[0]?.institution_id : userInstitution
      });

      if (institution?.enrollment_workflow?.stages) {
        const targetStage = institution.enrollment_workflow.stages.find(
          s => s.stage_id === parseInt(stage_id)
        );

        if (targetStage) {
          enrollments = enrollments.filter(e => e.enrollment_status === targetStage.status_key);
        }
      }
    }

    // Client-side filtering by career_id
    if (career_id) {
      enrollments = enrollments.filter(e => e.career_id === career_id);
    }

    res.json({
      total: enrollments.length,
      filters: { status, academic_year, stage_id, career_id },
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

/**
 * PATCH /api/enrollment/:institution_id/:email/:career_id/advance
 * Advance enrollment to next stage in workflow
 */
router.patch('/:institution_id/:email/:career_id/advance', async (req, res) => {
  try {
    const { institution_id, email, career_id } = req.params;
    const { target_stage_id, notes } = req.body;

    // Authorization check
    if (req.user.rol !== 'super_admin' && req.user.tenant_id !== institution_id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Get institution and workflow
    const institution = await TenantConfig.findOne({ institution_id });
    if (!institution) {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }

    if (!institution.enrollment_workflow || !institution.enrollment_workflow.stages) {
      return res.status(400).json({
        error: 'Esta institución no tiene un workflow configurado'
      });
    }

    // Get current enrollment
    const enrollment = await EnrollmentRepository.findOne(institution_id, email, career_id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    const workflow = institution.enrollment_workflow;
    const currentStatus = enrollment.enrollment_status || 'interesado';

    // Find current stage
    const currentStage = workflow.stages.find(s => s.status_key === currentStatus);
    if (!currentStage) {
      return res.status(400).json({
        error: 'Estado actual no válido en el workflow',
        current_status: currentStatus
      });
    }

    // Find target stage
    const targetStage = workflow.stages.find(s => s.stage_id === target_stage_id);
    if (!targetStage) {
      return res.status(400).json({
        error: 'Etapa objetivo no encontrada',
        target_stage_id
      });
    }

    // Check if transition is allowed
    if (!currentStage.next_stages.includes(target_stage_id)) {
      return res.status(400).json({
        error: 'Transición no permitida',
        current_stage: currentStage.name,
        target_stage: targetStage.name,
        allowed_next_stages: currentStage.next_stages.map(id => {
          const stage = workflow.stages.find(s => s.stage_id === id);
          return { stage_id: id, name: stage?.name };
        })
      });
    }

    // Check role permissions
    if (targetStage.allowed_roles && !targetStage.allowed_roles.includes(req.user.rol)) {
      return res.status(403).json({
        error: 'No tienes permisos para avanzar a esta etapa',
        required_roles: targetStage.allowed_roles,
        your_role: req.user.rol
      });
    }

    // Update enrollment status
    await EnrollmentRepository.updateStatus(
      institution_id,
      email,
      career_id,
      targetStage.status_key,
      req.user.email
    );

    // If there are notes, update admission data
    if (notes) {
      await EnrollmentRepository.updateAdmission(
        institution_id,
        email,
        career_id,
        { notes },
        req.user.email
      );
    }

    res.json({
      message: 'Etapa avanzada correctamente',
      transition: {
        from: {
          stage_id: currentStage.stage_id,
          name: currentStage.name,
          status_key: currentStage.status_key
        },
        to: {
          stage_id: targetStage.stage_id,
          name: targetStage.name,
          status_key: targetStage.status_key
        }
      },
      updated_by: req.user.email
    });

  } catch (error) {
    console.error('Error advancing stage:', error);
    res.status(500).json({ error: 'Error al avanzar etapa' });
  }
});

module.exports = router;
