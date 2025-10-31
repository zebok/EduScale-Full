const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const EnrollmentRepository = require('../repositories/EnrollmentRepository');
const TenantConfig = require('../models/TenantConfig');
const { Expediente } = require('../config/mongodb');

// All student endpoints require auth
router.use(authMiddleware);

// Only allow role 'alumno'
router.use((req, res, next) => {
    if (req.user.rol !== 'alumno') {
        return res.status(403).json({ error: 'Acceso denegado', message: 'Solo alumnos' });
    }
    next();
});

/**
 * GET /api/student/me/enrollments
 * Returns all enrollments for the authenticated student (by academic_mail first, then email)
 */
router.get('/me/enrollments', async (req, res) => {
    try {
        const institutionId = req.user.tenant_id;
        const mail = (req.user.email || '').toLowerCase();

        // Try academic_mail first
        let enrollments = await EnrollmentRepository.findByInstitutionAndAcademicMail(institutionId, mail);

        // Fallback to personal email
        if (!enrollments || enrollments.length === 0) {
            enrollments = await EnrollmentRepository.findByInstitutionAndEmail(institutionId, mail);
        }

        return res.json({ total: enrollments.length, enrollments });
    } catch (error) {
        console.error('Error in student/me/enrollments:', error);
        return res.status(500).json({ error: 'Error al obtener inscripciones' });
    }
});

/**
 * GET /api/student/me/overview
 * Aggregate: primary enrollment, tenant career info and computed metrics
 */
router.get('/me/overview', async (req, res) => {
    try {
        const institutionId = req.user.tenant_id;
        const mail = (req.user.email || '').toLowerCase();

        // Load enrollments
        let enrollments = await EnrollmentRepository.findByInstitutionAndAcademicMail(institutionId, mail);
        if (!enrollments || enrollments.length === 0) {
            enrollments = await EnrollmentRepository.findByInstitutionAndEmail(institutionId, mail);
        }

        if (!enrollments || enrollments.length === 0) {
            return res.status(404).json({ error: 'No se encontraron inscripciones' });
        }

        // Choose a primary enrollment (latest created_at)
        const primary = enrollments.reduce((acc, e) => {
            const ea = new Date(e.created_at || 0).getTime();
            const eb = new Date(acc?.created_at || 0).getTime();
            return ea > eb ? e : acc || e;
        }, null);

        // Load institution careers for duration
        const tenant = await TenantConfig.findOne({ institution_id: institutionId });
        const career = tenant?.careers?.find(c => c.career_id === primary.career_id);

        const currentYear = new Date().getFullYear();
        const startYear = primary.academic_year || currentYear;
        const duration = career?.duration_years || null;
        const elapsed = Math.max(0, currentYear - startYear);
        const years_left = duration != null ? Math.max(0, duration - elapsed) : null;

        // Admission expediente (Mongo) by best email guess
        const expediente = await (async () => {
            const byAcademic = await Expediente.findOne({ email: (primary.academic_mail || '').toLowerCase() });
            if (byAcademic) return byAcademic;
            const byPersonal = await Expediente.findOne({ email: (primary.email || '').toLowerCase() });
            return byPersonal || null;
        })();

        return res.json({
            student: {
                nombre_completo: primary.nombre_completo || req.user.nombre,
                academic_mail: primary.academic_mail,
                email_personal: primary.email
            },
            institution: {
                id: institutionId,
                name: tenant?.institution?.name
            },
            career: {
                id: primary.career_id,
                name: primary.career_name,
                faculty: primary.career_faculty,
                duration_years: duration
            },
            progress: {
                academic_year: primary.academic_year,
                years_elapsed: elapsed,
                years_left
            },
            enrollment: {
                status: primary.enrollment_status,
                document_status: primary.document_status,
                payment_status: primary.payment_status,
                created_at: primary.created_at,
                updated_at: primary.updated_at
            },
            admission: expediente ? {
                estado: expediente.estado,
                documentos: expediente.documentos,
                comentarios: expediente.comentarios,
                historial: expediente.historial
            } : null
        });
    } catch (error) {
        console.error('Error in student/me/overview:', error);
        return res.status(500).json({ error: 'Error al obtener datos' });
    }
});

module.exports = router;
