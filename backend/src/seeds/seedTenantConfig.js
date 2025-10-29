const { connectMongoDB, mongoose } = require('../config/mongodb');
const TenantConfig = require('../models/TenantConfig');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const rawTenantConfig = {
    institution_id: 'universidad-catolica-argentina',
    status: 'active',

    institution: {
        name: 'Universidad Católica Argentina',
        short_name: 'UCA',
        type: 'universidad_privada',
        country: 'Argentina',
        city: 'Buenos Aires',
        province: 'CABA',
        founded_year: 1958
    },

    contact: {
        address: 'Alicia Moreau de Justo 1300, C1107 CABA',
        email: 'admisiones@uca.edu.ar',
        phone: '+54 11 4338-0600',
        website: 'https://www.uca.edu.ar'
    },

    domain: 'uca.eduscale.com',

    branding: {
        theme: {
            primary_color: '#8B0000',
            secondary_color: '#FFD700',
            accent_color: '#B22222',
            font_family: 'Merriweather'
        },
        logo_url: 'https://via.placeholder.com/200x80?text=UCA'
    },

    texts: {
        welcome: {
            title: 'Bienvenido a la UCA',
            subtitle: 'Admisiones 2025',
            description: 'Formación integral con valores cristianos',
            footer_text: 'UCA - In Conscientia et Veritate'
        }
    },

    settings: {
        admission_fee: 12000,
        enable_scholarship: true,
        max_applicants_per_year: 8000,
        require_entrance_exam: false,
        academic_year_start: '03-01',
        enrollment_periods: [
            { name: 'Primer Cuatrimestre', start: '11-01', end: '02-28' },
            { name: 'Segundo Cuatrimestre', start: '05-01', end: '07-15' }
        ]
    },

    careers: [
        {
            career_id: 'uca_derecho',
            code: 'DER',
            name: 'Abogacía',
            faculty: 'Facultad de Derecho',
            degree_type: 'grado',
            degree_title: 'Abogado/a',
            duration_years: 5,
            modality: 'presencial',
            shift: ['mañana', 'tarde'],
            cupo_anual: 600,
            description: 'Formación jurídica con sólidos valores éticos y cristianos',
            requirements: {
                cbc_required: false,
                entrance_exam: false,
                min_high_school_avg: 6.0,
                interview_required: true
            },
            scholarship_available: true,
            scholarship_percentage: [30, 50, 70, 100],
            contact: {
                email: 'derecho@uca.edu.ar',
                phone: '+54 11 4338-0650'
            }
        },
        {
            career_id: 'uca_administracion',
            code: 'ADM',
            name: 'Licenciatura en Administración de Empresas',
            faculty: 'Facultad de Ciencias Económicas',
            degree_type: 'grado',
            degree_title: 'Licenciado/a en Administración de Empresas',
            duration_years: 4,
            modality: 'presencial',
            shift: ['mañana', 'noche'],
            cupo_anual: 400,
            description: 'Gestión empresarial con visión humanista y responsabilidad social',
            requirements: {
                cbc_required: false,
                entrance_exam: false,
                min_high_school_avg: 6.0,
                interview_required: false
            },
            scholarship_available: true,
            scholarship_percentage: [30, 50, 70, 100],
            contact: {
                email: 'economia@uca.edu.ar',
                phone: '+54 11 4338-0700'
            }
        },
        {
            career_id: 'uca_psicologia',
            code: 'PSI',
            name: 'Licenciatura en Psicología',
            faculty: 'Facultad de Psicología y Psicopedagogía',
            degree_type: 'grado',
            degree_title: 'Licenciado/a en Psicología',
            duration_years: 5,
            modality: 'presencial',
            shift: ['mañana', 'noche'],
            cupo_anual: 500,
            description: 'Formación en psicología con enfoque en la persona integral',
            requirements: {
                cbc_required: false,
                entrance_exam: false,
                min_high_school_avg: 6.0,
                interview_required: true
            },
            scholarship_available: true,
            scholarship_percentage: [30, 50, 70, 100],
            contact: {
                email: 'psicologia@uca.edu.ar',
                phone: '+54 11 4338-0750'
            }
        },
        {
            career_id: 'uca_comunicacion',
            code: 'COM',
            name: 'Licenciatura en Comunicación',
            faculty: 'Facultad de Ciencias Sociales',
            degree_type: 'grado',
            degree_title: 'Licenciado/a en Comunicación',
            duration_years: 4,
            modality: 'presencial',
            shift: ['mañana', 'tarde'],
            cupo_anual: 300,
            description: 'Comunicación integral: periodismo, publicidad y medios digitales',
            requirements: {
                cbc_required: false,
                entrance_exam: false,
                min_high_school_avg: 6.0,
                portfolio_required: true
            },
            scholarship_available: true,
            scholarship_percentage: [30, 50, 70, 100],
            contact: {
                email: 'comunicacion@uca.edu.ar',
                phone: '+54 11 4338-0800'
            }
        }
    ],

    dashboard: {
        tabs_enabled: [
            {
                id: 'prospection',
                name: 'Consultas',
                phase: 'A - Prospección',
                source: 'redis',
                enabled: true,
                icon: 'user-plus',
                order: 1,
                endpoint: '/api/prospection'
            },
            {
                id: 'admission',
                name: 'Solicitudes',
                phase: 'B - Admisión',
                source: 'mongodb',
                enabled: true,
                icon: 'file-text',
                order: 2,
                endpoint: '/api/admission'
            },
            {
                id: 'enrollment',
                name: 'Inscritos',
                phase: 'C - Inscripción',
                source: 'cassandra',
                enabled: true,
                icon: 'check-circle',
                order: 3,
                endpoint: '/api/enrollment'
            }
        ]
    }
};

function mapTabId(id) {
    const map = {
        prospection: 'prospectos',
        admission: 'solicitudes',
        enrollment: 'inscritos',
        relations: 'relaciones'
    };
    return map[id] || id;
}

function mapRawToSchema(raw) {
    const mapped = {
        institution_id: raw.institution_id,
        institucion: {
            nombre_completo: raw.institution?.name,
            nombre_corto: raw.institution?.short_name,
            tipo: raw.institution?.type,
            pais: raw.institution?.country,
            ciudad: raw.institution?.city,
            fundacion: raw.institution?.founded_year
        },
        branding: {
            colores: {
                primario: raw.branding?.theme?.primary_color,
                secundario: raw.branding?.theme?.secondary_color,
                acento: raw.branding?.theme?.accent_color
            },
            imagenes: {
                logo_principal: raw.branding?.logo_url
            },
            fuentes: {
                principal: raw.branding?.theme?.font_family
            }
        },
        textos: {
            bienvenida: {
                titulo: raw.texts?.welcome?.title,
                subtitulo: raw.texts?.welcome?.subtitle,
                descripcion: raw.texts?.welcome?.description
            },
            footer: {
                texto: raw.texts?.welcome?.footer_text
            }
        },
        contacto: {
            emails: {
                admisiones: raw.contact?.email
            },
            telefonos: {
                principal: raw.contact?.phone,
                admisiones: raw.contact?.phone
            },
            direccion: {
                calle: raw.contact?.address,
                ciudad: raw.institution?.city,
                pais: raw.institution?.country
            },
            sitio_web: raw.contact?.website
        },
        dashboard: {
            tabs_habilitadas: (raw.dashboard?.tabs_enabled || []).map((t) => ({
                id: mapTabId(t.id),
                nombre: t.name,
                fase: t.phase,
                fuente: t.source,
                habilitada: !!t.enabled,
                icono: t.icon,
                orden: t.order,
                endpoint: t.endpoint
            }))
        },
        configuracion_fases: {
            fase_b: {
                // Mapeamos "require_entrance_exam" como entrevista (aprox.)
                requiere_entrevista: raw.settings?.require_entrance_exam ?? false
            },
            fase_c: {
                requiere_pago: (raw.settings?.admission_fee || 0) > 0,
                monto_matricula: raw.settings?.admission_fee || 0,
                moneda: 'ARS'
            }
        },
        programas: (raw.careers || []).map((c) => ({
            id: c.career_id,
            nombre: c.name,
            facultad: c.faculty,
            duracion_años: c.duration_years,
            modalidad: c.modality,
            cupos_disponibles: c.cupo_anual,
            descripcion: c.description
        })),
        estado: {
            activo: raw.status === 'active',
            en_mantenimiento: false
        }
    };

    return mapped;
}

function deriveAdminFor(raw) {
    const id = raw.institution_id;
    const short = (raw.institution?.short_name || id)
        .replace(/\s+/g, '')
        .replace(/[^A-Za-z0-9]/g, '');
    const suffix = short.toUpperCase().slice(0, 6) || 'ADMIN';
    const email = `admin.${id}@eduscale.com`;
    const password = process.env.SEED_ADMIN_PASSWORD || `Admin${suffix}123`;
    const apellido = suffix;
    return { email, password, apellido };
}

async function upsertOne(raw) {
    const doc = mapRawToSchema(raw);

    const result = await TenantConfig.updateOne(
        { institution_id: doc.institution_id },
        { $set: doc },
        { upsert: true }
    );
    console.log(`Upserted tenant: ${doc.institution_id}`, JSON.stringify(result));

    // Verify
    const saved = await TenantConfig.findOne({ institution_id: doc.institution_id });
    if (!saved) throw new Error(`Failed to save tenant ${doc.institution_id}`);

    // Ensure a default admin user exists for this tenant
    const { email, password, apellido } = deriveAdminFor(raw);
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
        const hashed = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            password: hashed,
            nombre: 'Admin',
            apellido,
            tenant_id: doc.institution_id,
            rol: 'admin'
        });
        await newUser.save();
        console.log(`Created admin user for ${doc.institution_id}: ${email} / ${password}`);
    } else {
        console.log(`Admin user already exists for ${doc.institution_id}: ${email}`);
    }
}

async function run() {
    try {
        await connectMongoDB();

        // Load list from file if present; fallback to single rawTenantConfig
        const filePath = process.env.SEED_TENANTS_FILE || path.join(__dirname, 'tenants.json');
        let tenants = [];
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            tenants = JSON.parse(content);
            if (!Array.isArray(tenants)) {
                throw new Error('tenants.json must contain a JSON array');
            }
            console.log(`Seeding ${tenants.length} tenants from ${filePath}`);
        } else {
            tenants = [rawTenantConfig];
            console.log('Seeding single tenant from built-in config');
        }

        for (const raw of tenants) {
            try {
                await upsertOne(raw);
            } catch (e) {
                console.error('Error seeding tenant', raw?.institution_id, e);
            }
        }

    } catch (err) {
        console.error('Seed error:', err);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
}

if (require.main === module) {
    run();
}

module.exports = { run };
