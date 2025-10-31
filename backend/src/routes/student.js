const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const EnrollmentRepository = require('../repositories/EnrollmentRepository');
const TenantConfig = require('../models/TenantConfig');
const User = require('../models/User');
const { Expediente } = require('../config/mongodb');

// All student endpoints require auth
router.use(authMiddleware);

// Allow both 'alumno' (legacy Cassandra) and 'viewer' (MongoDB)
router.use((req, res, next) => {
    if (req.user.rol !== 'alumno' && req.user.rol !== 'viewer') {
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

/**
 * GET /api/student/me/profile
 * Get student profile from MongoDB (User model)
 */
router.get('/me/profile', async (req, res) => {
    try {
        const userId = req.user.userId;

        // Only works for users in MongoDB (rol='viewer')
        if (req.user.rol !== 'viewer') {
            return res.status(400).json({
                error: 'Perfil no disponible',
                message: 'Los perfiles personalizados solo están disponibles para usuarios en MongoDB'
            });
        }

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        return res.json({
            profile: {
                id: user._id,
                email: user.email,
                nombre: user.nombre,
                apellido: user.apellido,
                documento: user.documento,
                tipo_documento: user.tipo_documento,
                telefono: user.telefono,
                fecha_nacimiento: user.fecha_nacimiento,
                foto_perfil_url: user.foto_perfil_url,
                tenant_id: user.tenant_id,
                activo: user.activo,
                ultimo_login: user.ultimo_login
            },
            preferencias: user.preferencias || {
                tema: 'light',
                idioma: 'es',
                notificaciones: true
            }
        });
    } catch (error) {
        console.error('Error in student/me/profile:', error);
        return res.status(500).json({ error: 'Error al obtener perfil' });
    }
});

/**
 * PUT /api/student/me/profile
 * Update student profile (personal data)
 */
router.put('/me/profile', async (req, res) => {
    try {
        const userId = req.user.userId;

        if (req.user.rol !== 'viewer') {
            return res.status(400).json({
                error: 'Perfil no disponible',
                message: 'Los perfiles personalizados solo están disponibles para usuarios en MongoDB'
            });
        }

        const { nombre, apellido, telefono, fecha_nacimiento, foto_perfil_url } = req.body;

        const updateData = {};
        if (nombre !== undefined) updateData.nombre = nombre;
        if (apellido !== undefined) updateData.apellido = apellido;
        if (telefono !== undefined) updateData.telefono = telefono;
        if (fecha_nacimiento !== undefined) updateData.fecha_nacimiento = fecha_nacimiento;
        if (foto_perfil_url !== undefined) updateData.foto_perfil_url = foto_perfil_url;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        return res.json({
            message: 'Perfil actualizado exitosamente',
            profile: {
                id: user._id,
                email: user.email,
                nombre: user.nombre,
                apellido: user.apellido,
                documento: user.documento,
                tipo_documento: user.tipo_documento,
                telefono: user.telefono,
                fecha_nacimiento: user.fecha_nacimiento,
                foto_perfil_url: user.foto_perfil_url
            }
        });
    } catch (error) {
        console.error('Error in student/me/profile PUT:', error);
        return res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});

/**
 * PUT /api/student/me/preferences
 * Update student preferences (tema, idioma, notificaciones)
 */
router.put('/me/preferences', async (req, res) => {
    try {
        const userId = req.user.userId;

        if (req.user.rol !== 'viewer') {
            return res.status(400).json({
                error: 'Preferencias no disponibles',
                message: 'Las preferencias solo están disponibles para usuarios en MongoDB'
            });
        }

        const { tema, idioma, notificaciones } = req.body;

        const updateData = {};
        if (tema !== undefined) updateData['preferencias.tema'] = tema;
        if (idioma !== undefined) updateData['preferencias.idioma'] = idioma;
        if (notificaciones !== undefined) updateData['preferencias.notificaciones'] = notificaciones;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('preferencias');

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        return res.json({
            message: 'Preferencias actualizadas exitosamente',
            preferencias: user.preferencias
        });
    } catch (error) {
        console.error('Error in student/me/preferences PUT:', error);
        return res.status(500).json({ error: 'Error al actualizar preferencias' });
    }
});

module.exports = router;
