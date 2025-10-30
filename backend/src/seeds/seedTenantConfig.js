const { connectMongoDB, mongoose } = require('../config/mongodb');
const TenantConfig = require('../models/TenantConfig');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

function legacyTabIdToEnglish(id) {
    const map = {
        prospectos: 'prospection',
        solicitudes: 'admission',
        inscritos: 'enrollment',
        relaciones: 'relations'
    };
    return map[id] || id;
}

function mapLegacyDocToEnglish(legacy) {
    const english = {
        institution_id: legacy.institution_id,
        status: legacy.estado?.activo === false ? 'inactive' : 'active',
        institution: {
            name: legacy.institucion?.nombre_completo,
            short_name: legacy.institucion?.nombre_corto,
            type: legacy.institucion?.tipo,
            country: legacy.institucion?.pais,
            city: legacy.institucion?.ciudad,
            founded_year: legacy.institucion?.fundacion
        },
        contact: {
            address: legacy.contacto?.direccion?.calle,
            email: legacy.contacto?.emails?.admisiones,
            phone: legacy.contacto?.telefonos?.principal || legacy.contacto?.telefonos?.admisiones,
            website: legacy.contacto?.sitio_web
        },
        // domain: optional, not present in legacy
        branding: {
            theme: {
                primary_color: legacy.branding?.colores?.primario,
                secondary_color: legacy.branding?.colores?.secundario,
                accent_color: legacy.branding?.colores?.acento,
                font_family: legacy.branding?.fuentes?.principal
            },
            logo_url: legacy.branding?.imagenes?.logo_principal
        },
        texts: {
            welcome: {
                title: legacy.textos?.bienvenida?.titulo,
                subtitle: legacy.textos?.bienvenida?.subtitulo,
                description: legacy.textos?.bienvenida?.descripcion,
                footer_text: legacy.textos?.footer?.texto
            }
        },
        settings: {
            admission_fee: legacy.configuracion_fases?.fase_c?.monto_matricula || 0,
            require_entrance_exam: !!legacy.configuracion_fases?.fase_b?.requiere_entrevista
        },
        careers: (legacy.programas || []).map(p => ({
            career_id: p.id,
            name: p.nombre,
            faculty: p.facultad,
            duration_years: p.duracion_años,
            modality: p.modalidad,
            description: p.descripcion
        })),
        dashboard: {
            tabs_enabled: (legacy.dashboard?.tabs_habilitadas || []).map(t => ({
                id: legacyTabIdToEnglish(t.id),
                name: t.nombre,
                phase: t.fase,
                source: t.fuente,
                enabled: t.habilitada,
                icon: t.icono,
                order: t.orden,
                endpoint: t.endpoint
            }))
        }
    };
    return english;
}

// For English-native schema, we persist raw docs directly (validated by Mongoose)

function deriveAdminFor(raw) {
    const short = (raw.institution?.short_name || raw.institution_id)
        .replace(/\s+/g, '')
        .replace(/[^A-Za-z0-9]/g, '')
        .toLowerCase();
    const shortCode = short.slice(0, 10) || 'admin';
    const suffix = short.toUpperCase().slice(0, 6) || 'ADMIN';
    const email = `admin.${shortCode}@eduscale.com`;
    const password = process.env.SEED_ADMIN_PASSWORD || `Admin${suffix}123`;
    const apellido = suffix;
    return { email, password, apellido };
}

// Derivar credenciales admin a partir de un documento ya mapeado en la BD
function deriveAdminForDoc(doc) {
    const shortName = doc?.institution?.short_name || doc?.institucion?.nombre_corto || doc?.institution_id || 'admin';
    const short = String(shortName)
        .replace(/\s+/g, '')
        .replace(/[^A-Za-z0-9]/g, '')
        .toLowerCase();
    const shortCode = short.slice(0, 10) || 'admin';
    const suffix = short.toUpperCase().slice(0, 6) || 'ADMIN';
    const email = `admin.${shortCode}@eduscale.com`;
    const password = process.env.SEED_ADMIN_PASSWORD || `Admin${suffix}123`;
    const apellido = suffix;
    return { email, password, apellido };
}

async function upsertOne(raw) {
    const doc = raw;

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
    const { email, password, apellido } = deriveAdminFor(doc);
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

        // Load list from tenants.json file
        const filePath = process.env.SEED_TENANTS_FILE || path.join(__dirname, 'tenants.json');

        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  No tenants file found at ${filePath}. Skipping seed.`);
        } else {
            const content = fs.readFileSync(filePath, 'utf8');
            const tenants = JSON.parse(content);

            if (!Array.isArray(tenants)) {
                throw new Error('tenants.json must contain a JSON array');
            }

            console.log(`✓ Seeding ${tenants.length} tenants from ${filePath}`);

            for (const raw of tenants) {
                try {
                    await upsertOne(raw);
                } catch (e) {
                    console.error('Error seeding tenant', raw?.institution_id, e);
                }
            }
        }

        // Migrar documentos legacy (español) a inglés si existen
        const legacyDocs = await TenantConfig.find({ institucion: { $exists: true } });
        if (legacyDocs.length > 0) {
            console.log(`✓ Migrating ${legacyDocs.length} legacy tenant configs to English schema...`);
            for (const legacy of legacyDocs) {
                const english = mapLegacyDocToEnglish(legacy.toObject());
                await TenantConfig.updateOne(
                    { institution_id: english.institution_id },
                    { $set: english }
                );
                console.log(`  • Migrated ${english.institution_id}`);
            }
        }

        // Siempre: asegurar que exista un admin para cada tenant presente en la BD
        console.log('✓ Ensuring admin users exist for all tenants in DB...');
        const allTenants = await TenantConfig.find({}, { institution_id: 1, institution: 1, institucion: 1 });
        for (const t of allTenants) {
            const existingAdmin = await User.findOne({ tenant_id: t.institution_id, rol: 'admin' });
            if (!existingAdmin) {
                const { email, password, apellido } = deriveAdminForDoc(t);
                const hashed = await bcrypt.hash(password, 10);
                const newUser = new User({
                    email,
                    password: hashed,
                    nombre: 'Admin',
                    apellido,
                    tenant_id: t.institution_id,
                    rol: 'admin'
                });
                await newUser.save();
                console.log(`  • Created admin for ${t.institution_id}: ${email} / ${password}`);
            } else {
                console.log(`  • Admin already exists for ${t.institution_id} (${existingAdmin.email})`);
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
