const { connectMongoDB, mongoose } = require('../config/mongodb');
const TenantConfig = require('../models/TenantConfig');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Deriva credenciales de admin a partir de un tenant en la BD
 */
function deriveAdminForTenant(tenant) {
    const shortName = tenant?.institution?.short_name || tenant?.institution_id || 'admin';
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

async function run() {
    try {
        await connectMongoDB();

        // 1. Crear usuario super-admin del Ministerio
        console.log('✓ Creating super-admin user (Ministerio)...');
        const ministerioEmail = 'ministerio@eduscale.edu.ar';
        const existingSuperAdmin = await User.findOne({ email: ministerioEmail });

        if (!existingSuperAdmin) {
            const ministerioPassword = process.env.SUPER_ADMIN_PASSWORD || 'Ministerio2025!';
            const hashedMinisterio = await bcrypt.hash(ministerioPassword, 10);
            const superAdmin = new User({
                email: ministerioEmail,
                password: hashedMinisterio,
                nombre: 'Ministerio',
                apellido: 'Educación',
                tenant_id: 'ministerio',
                rol: 'super_admin',
                permisos: ['ver_todas_universidades', 'ver_reportes', 'administrar_sistema']
            });
            await superAdmin.save();
            console.log(`  • Created super-admin: ${ministerioEmail} / ${ministerioPassword}`);
        } else {
            console.log(`  • Super-admin already exists: ${ministerioEmail}`);
        }

        // 2. Crear admins para cada universidad
        console.log('✓ Ensuring admin users exist for all tenants in DB...');
        const allTenants = await TenantConfig.find({}, { institution_id: 1, institution: 1 });

        if (allTenants.length === 0) {
            console.log('⚠️  No tenants found in database. Skipping admin creation.');
        }

        for (const tenant of allTenants) {
            const existingAdmin = await User.findOne({ tenant_id: tenant.institution_id, rol: 'admin' });

            if (!existingAdmin) {
                const { email, password, apellido } = deriveAdminForTenant(tenant);
                const hashed = await bcrypt.hash(password, 10);
                const newUser = new User({
                    email,
                    password: hashed,
                    nombre: 'Admin',
                    apellido,
                    tenant_id: tenant.institution_id,
                    rol: 'admin'
                });
                await newUser.save();
                console.log(`  • Created admin for ${tenant.institution_id}: ${email} / ${password}`);
            } else {
                console.log(`  • Admin already exists for ${tenant.institution_id} (${existingAdmin.email})`);
            }
        }

        console.log('✓ Admin seed completed successfully');

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
