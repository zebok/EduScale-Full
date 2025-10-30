const express = require('express');
const router = express.Router();
const TenantConfig = require('../models/TenantConfig');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Middleware para verificar que el usuario sea super_admin
 */
const requireSuperAdmin = (req, res, next) => {
    if (req.user.rol !== 'super_admin') {
        return res.status(403).json({
            error: 'Acceso denegado',
            message: 'Solo el super-admin (Ministerio) puede acceder a este recurso'
        });
    }
    next();
};

/**
 * GET /api/ministerio/universidades
 * Obtener lista de todas las universidades
 */
router.get('/universidades', authMiddleware, requireSuperAdmin, async (req, res) => {
    try {
        const universidades = await TenantConfig.find(
            {},
            {
                institution_id: 1,
                status: 1,
                'institution.name': 1,
                'institution.short_name': 1,
                'institution.type': 1,
                'institution.city': 1,
                'institution.province': 1,
                'institution.founded_year': 1,
                'contact.email': 1,
                'contact.phone': 1,
                'contact.website': 1,
                domain: 1,
                createdAt: 1,
                updatedAt: 1
            }
        ).sort({ 'institution.name': 1 });

        const universidadesConStats = await Promise.all(
            universidades.map(async (uni) => {
                const careerCount = uni.careers?.length || 0;

                return {
                    institution_id: uni.institution_id,
                    status: uni.status,
                    institution: uni.institution,
                    contact: uni.contact,
                    domain: uni.domain,
                    career_count: careerCount,
                    createdAt: uni.createdAt,
                    updatedAt: uni.updatedAt
                };
            })
        );

        res.json({
            total: universidadesConStats.length,
            universidades: universidadesConStats
        });

    } catch (error) {
        console.error('Error al obtener universidades:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: 'Error al obtener la lista de universidades'
        });
    }
});

/**
 * GET /api/ministerio/universidades/:institution_id
 * Obtener detalles completos de una universidad específica
 */
router.get('/universidades/:institution_id', authMiddleware, requireSuperAdmin, async (req, res) => {
    try {
        const { institution_id } = req.params;

        const universidad = await TenantConfig.findOne({ institution_id });

        if (!universidad) {
            return res.status(404).json({
                error: 'Universidad no encontrada',
                message: `No se encontró la universidad con ID: ${institution_id}`
            });
        }

        // Estadísticas adicionales
        const stats = {
            total_careers: universidad.careers?.length || 0,
            total_cupos: universidad.careers?.reduce((sum, c) => sum + (c.cupo_anual || 0), 0) || 0,
            careers_by_faculty: {},
            careers_by_modality: {},
            careers_with_scholarship: universidad.careers?.filter(c => c.scholarship_available).length || 0
        };

        // Agrupar carreras por facultad
        universidad.careers?.forEach(career => {
            const faculty = career.faculty || 'Sin facultad';
            stats.careers_by_faculty[faculty] = (stats.careers_by_faculty[faculty] || 0) + 1;

            const modality = career.modality || 'Sin modalidad';
            stats.careers_by_modality[modality] = (stats.careers_by_modality[modality] || 0) + 1;
        });

        res.json({
            universidad: universidad.toObject(),
            estadisticas: stats
        });

    } catch (error) {
        console.error('Error al obtener detalles de universidad:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: 'Error al obtener los detalles de la universidad'
        });
    }
});

/**
 * GET /api/ministerio/estadisticas
 * Obtener estadísticas globales del sistema
 */
router.get('/estadisticas', authMiddleware, requireSuperAdmin, async (req, res) => {
    try {
        const universidades = await TenantConfig.find({});

        const stats = {
            total_universidades: universidades.length,
            universidades_activas: universidades.filter(u => u.status === 'active').length,
            universidades_publicas: universidades.filter(u => u.institution.type === 'universidad_publica').length,
            universidades_privadas: universidades.filter(u => u.institution.type === 'universidad_privada').length,
            total_carreras: universidades.reduce((sum, u) => sum + (u.careers?.length || 0), 0),
            total_cupos: universidades.reduce((sum, u) =>
                sum + (u.careers?.reduce((s, c) => s + (c.cupo_anual || 0), 0) || 0), 0
            ),
            universidades_por_provincia: {},
            carreras_por_categoria: {}
        };

        // Agrupar por provincia
        universidades.forEach(uni => {
            const province = uni.institution.province || 'Sin provincia';
            stats.universidades_por_provincia[province] = (stats.universidades_por_provincia[province] || 0) + 1;
        });

        // Agrupar carreras por categoría
        universidades.forEach(uni => {
            uni.careers?.forEach(career => {
                const category = career.category || 'Sin categoría';
                stats.carreras_por_categoria[category] = (stats.carreras_por_categoria[category] || 0) + 1;
            });
        });

        res.json(stats);

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: 'Error al obtener las estadísticas'
        });
    }
});

module.exports = router;
