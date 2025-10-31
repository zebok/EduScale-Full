const express = require('express');
const router = express.Router();
const TenantConfig = require('../models/TenantConfig');
const authMiddleware = require('../middleware/authMiddleware');
const neo4jService = require('../services/neo4jService');

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
            // Normalizamos el campo `institution.type` para admitir seeds con "Universidad Pública/Privada"
            universidades_publicas: universidades.filter(u => {
                const t = (u.institution?.type || '').toString().toLowerCase();
                return t.includes('publica');
            }).length,
            universidades_privadas: universidades.filter(u => {
                const t = (u.institution?.type || '').toString().toLowerCase();
                return t.includes('privada');
            }).length,
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

/**
 * GET /api/ministerio/universidades/:institution_id/inscriptos
 * Obtener cantidad de alumnos inscriptos por universidad y desglose por carrera
 */
const EnrollmentRepository = require('../repositories/EnrollmentRepository');

router.get('/universidades/:institution_id/inscriptos', authMiddleware, requireSuperAdmin, async (req, res) => {
    try {
        const { institution_id } = req.params;

        // Traemos todas las inscripciones de la universidad y agregamos en memoria
        const rows = await EnrollmentRepository.findByInstitution(institution_id);

        const porEstado = {};
        const porCarreraMap = new Map();

        for (const r of rows) {
            const st = r.enrollment_status || 'desconocido';
            porEstado[st] = (porEstado[st] || 0) + 1;

            const key = r.career_id || 'sin_carrera';
            if (!porCarreraMap.has(key)) {
                porCarreraMap.set(key, {
                    career_id: r.career_id,
                    career_name: r.career_name,
                    count: 0,
                    por_estado: {}
                });
            }
            const agg = porCarreraMap.get(key);
            agg.count += 1;
            agg.por_estado[st] = (agg.por_estado[st] || 0) + 1;
        }

        const porCarrera = Array.from(porCarreraMap.values()).sort((a, b) => b.count - a.count);

        return res.json({
            institution_id,
            total_alumnos: rows.length,
            por_estado: porEstado,
            por_carrera: porCarrera
        });
    } catch (error) {
        console.error('Error al obtener inscriptos por universidad:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: 'Error al obtener inscriptos por universidad'
        });
    }
});

// ============================================
// NEO4J ANALYTICS ENDPOINTS
// ============================================

/**
 * GET /api/ministerio/analytics/carreras-por-edad
 * Obtener carreras más populares por rango etario
 */
router.get('/analytics/carreras-por-edad', authMiddleware, requireSuperAdmin, async (req, res) => {
    try {
        const { minAge = 18, maxAge = 30 } = req.query;

        const results = await neo4jService.getPopularCareersByAge(
            parseInt(minAge),
            parseInt(maxAge)
        );

        res.json({
            rango_edad: { min: parseInt(minAge), max: parseInt(maxAge) },
            total_resultados: results.length,
            carreras: results
        });

    } catch (error) {
        console.error('Error en analytics carreras por edad:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: 'Error al obtener carreras por edad'
        });
    }
});

/**
 * GET /api/ministerio/analytics/tasas-conversion
 * Obtener tasas de aceptación/rechazo por universidad
 */
router.get('/analytics/tasas-conversion', authMiddleware, requireSuperAdmin, async (req, res) => {
    try {
        const results = await neo4jService.getUniversityConversionRates();

        res.json({
            total_universidades: results.length,
            universidades: results
        });

    } catch (error) {
        console.error('Error en analytics tasas de conversión:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: 'Error al obtener tasas de conversión'
        });
    }
});

/**
 * GET /api/ministerio/analytics/abandono-por-etapa
 * Obtener distribución de alumnos por etapa
 */
router.get('/analytics/abandono-por-etapa', authMiddleware, requireSuperAdmin, async (req, res) => {
    try {
        const results = await neo4jService.getDropoutByStage();

        res.json({
            total_etapas: results.length,
            distribucion: results
        });

    } catch (error) {
        console.error('Error en analytics abandono por etapa:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: 'Error al obtener abandono por etapa'
        });
    }
});

/**
 * GET /api/ministerio/analytics/clusters-demograficos
 * Detectar grupos demográficos con intereses similares
 */
router.get('/analytics/clusters-demograficos', authMiddleware, requireSuperAdmin, async (req, res) => {
    try {
        const { demographic = 'provincia' } = req.query;

        // Validate demographic parameter
        const allowedDemographics = ['provincia', 'edad', 'region'];
        if (!allowedDemographics.includes(demographic)) {
            return res.status(400).json({
                error: 'Parámetro inválido',
                message: `El parámetro 'demographic' debe ser uno de: ${allowedDemographics.join(', ')}`
            });
        }

        const results = await neo4jService.getCareerClustersByDemographic(demographic);

        res.json({
            demographic,
            total_clusters: results.length,
            clusters: results
        });

    } catch (error) {
        console.error('Error en analytics clusters demográficos:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: 'Error al obtener clusters demográficos'
        });
    }
});

/**
 * GET /api/ministerio/analytics/persona/:dni
 * Obtener el journey completo de una persona por DNI
 */
router.get('/analytics/persona/:dni', authMiddleware, requireSuperAdmin, async (req, res) => {
    try {
        const { dni } = req.params;

        if (!/^\d{7,8}$/.test(dni)) {
            return res.status(400).json({
                error: 'DNI inválido',
                message: 'El DNI debe contener 7 u 8 dígitos'
            });
        }

        const journey = await neo4jService.getStudentJourney(dni);

        if (!journey) {
            return res.status(404).json({
                error: 'Persona no encontrada',
                message: `No se encontró información para el DNI ${dni}`
            });
        }

        res.json({
            dni,
            journey
        });

    } catch (error) {
        console.error('Error en analytics persona:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: 'Error al obtener journey de la persona'
        });
    }
});

/**
 * POST /api/ministerio/analytics/enriquecer-persona
 * Enriquecer datos demográficos de una persona
 */
router.post('/analytics/enriquecer-persona', authMiddleware, requireSuperAdmin, async (req, res) => {
    try {
        const { dni, ...additionalData } = req.body;

        if (!dni || !/^\d{7,8}$/.test(dni)) {
            return res.status(400).json({
                error: 'DNI inválido',
                message: 'Se requiere un DNI válido de 7 u 8 dígitos'
            });
        }

        await neo4jService.enrichPersonaData(dni, additionalData);

        res.json({
            message: 'Datos de la persona enriquecidos exitosamente',
            dni,
            datos_agregados: Object.keys(additionalData)
        });

    } catch (error) {
        console.error('Error al enriquecer persona:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: 'Error al enriquecer datos de la persona'
        });
    }
});

/**
 * GET /api/ministerio/analytics/resumen
 * Obtener un resumen ejecutivo de todas las métricas
 */
router.get('/analytics/resumen', authMiddleware, requireSuperAdmin, async (req, res) => {
    try {
        // Execute multiple analytics queries in parallel
        const [
            conversionRates,
            dropoutStats,
            popularCareers
        ] = await Promise.all([
            neo4jService.getUniversityConversionRates(),
            neo4jService.getDropoutByStage(),
            neo4jService.getPopularCareersByAge(18, 30)
        ]);

        // Calculate totals
        const totalInteresados = conversionRates.reduce((sum, u) => sum + u.total_interesados, 0);
        const totalAceptados = conversionRates.reduce((sum, u) => sum + u.aceptados, 0);
        const totalRechazados = conversionRates.reduce((sum, u) => sum + u.rechazados, 0);
        const totalEnProceso = conversionRates.reduce((sum, u) => sum + u.en_proceso, 0);

        res.json({
            resumen_general: {
                total_interesados: totalInteresados,
                total_aceptados: totalAceptados,
                total_rechazados: totalRechazados,
                total_en_proceso: totalEnProceso,
                tasa_aceptacion_global: totalInteresados > 0
                    ? ((totalAceptados / totalInteresados) * 100).toFixed(2)
                    : 0
            },
            universidades_top: conversionRates.slice(0, 5),
            carreras_mas_demandadas: popularCareers.slice(0, 10),
            distribucion_por_etapa: dropoutStats
        });

    } catch (error) {
        console.error('Error en resumen analytics:', error);
        res.status(500).json({
            error: 'Error en el servidor',
            message: 'Error al obtener resumen de analytics'
        });
    }
});

module.exports = router;
