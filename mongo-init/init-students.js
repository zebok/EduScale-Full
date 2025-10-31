// MongoDB Student Initialization Script
// Creates student users (rol='viewer') for each university
// Password: Estudiante2025! (hashed with bcrypt)

db = db.getSiblingDB('eduscale');

print('👨‍🎓 Initializing Student Users (rol=viewer)...');

// Bcrypt hash for "Estudiante2025!" (salt rounds: 10)
// Generated with: bcrypt.hash("Estudiante2025!", 10)
const defaultPasswordHash = "$2a$10$gsy8BAWqtCrlR5Q5moOMWu5IbPoWQERzq0U7.nG64039ULWqgtq6u";

db.users.insertMany([
    // ============================================
    // 1. UBA - Universidad de Buenos Aires
    // ============================================
    {
        email: "alumno.uba@demo.com",
        password: defaultPasswordHash,
        nombre: "Juan",
        apellido: "Pérez",
        tenant_id: "universidad-buenos-aires",
        rol: "viewer",
        permisos: [],
        activo: true,

        // Student-specific fields
        documento: "40123456",
        tipo_documento: "DNI",
        telefono: "+54 11 1234-5678",
        fecha_nacimiento: new Date("2000-05-15"),
        foto_perfil_url: null,
        preferencias: {
            tema: "light",
            idioma: "es",
            notificaciones: true
        },

        createdAt: new Date(),
        updatedAt: new Date()
    },

    // ============================================
    // 2. UCA - Universidad Católica Argentina
    // ============================================
    {
        email: "alumno.uca@demo.com",
        password: defaultPasswordHash,
        nombre: "María",
        apellido: "González",
        tenant_id: "universidad-catolica-argentina",
        rol: "viewer",
        permisos: [],
        activo: true,

        documento: "41234567",
        tipo_documento: "DNI",
        telefono: "+54 11 2345-6789",
        fecha_nacimiento: new Date("2001-03-20"),
        foto_perfil_url: null,
        preferencias: {
            tema: "light",
            idioma: "es",
            notificaciones: true
        },

        createdAt: new Date(),
        updatedAt: new Date()
    },

    // ============================================
    // 3. ITBA - Instituto Tecnológico de Buenos Aires
    // ============================================
    {
        email: "alumno.itba@demo.com",
        password: defaultPasswordHash,
        nombre: "Carlos",
        apellido: "Rodríguez",
        tenant_id: "instituto-tecnologico-buenos-aires",
        rol: "viewer",
        permisos: [],
        activo: true,

        documento: "42345678",
        tipo_documento: "DNI",
        telefono: "+54 11 3456-7890",
        fecha_nacimiento: new Date("2002-07-10"),
        foto_perfil_url: null,
        preferencias: {
            tema: "dark",
            idioma: "es",
            notificaciones: true
        },

        createdAt: new Date(),
        updatedAt: new Date()
    },

    // ============================================
    // 4. UTN - Universidad Tecnológica Nacional
    // ============================================
    {
        email: "alumno.utn@demo.com",
        password: defaultPasswordHash,
        nombre: "Ana",
        apellido: "Martínez",
        tenant_id: "universidad-tecnologica-nacional",
        rol: "viewer",
        permisos: [],
        activo: true,

        documento: "43456789",
        tipo_documento: "DNI",
        telefono: "+54 11 4567-8901",
        fecha_nacimiento: new Date("2001-11-25"),
        foto_perfil_url: null,
        preferencias: {
            tema: "light",
            idioma: "es",
            notificaciones: false
        },

        createdAt: new Date(),
        updatedAt: new Date()
    },

    // ============================================
    // 5. Universidad de Palermo
    // ============================================
    {
        email: "alumno.up@demo.com",
        password: defaultPasswordHash,
        nombre: "Lucía",
        apellido: "Fernández",
        tenant_id: "universidad-palermo",
        rol: "viewer",
        permisos: [],
        activo: true,

        documento: "44567890",
        tipo_documento: "DNI",
        telefono: "+54 11 5678-9012",
        fecha_nacimiento: new Date("2002-01-30"),
        foto_perfil_url: null,
        preferencias: {
            tema: "dark",
            idioma: "es",
            notificaciones: true
        },

        createdAt: new Date(),
        updatedAt: new Date()
    },

    // ============================================
    // 6. UNLP - Universidad Nacional de La Plata
    // ============================================
    {
        email: "alumno.unlp@demo.com",
        password: defaultPasswordHash,
        nombre: "Diego",
        apellido: "López",
        tenant_id: "universidad-nacional-la-plata",
        rol: "viewer",
        permisos: [],
        activo: true,

        documento: "45678901",
        tipo_documento: "DNI",
        telefono: "+54 221 6789-0123",
        fecha_nacimiento: new Date("2000-09-12"),
        foto_perfil_url: null,
        preferencias: {
            tema: "light",
            idioma: "es",
            notificaciones: true
        },

        createdAt: new Date(),
        updatedAt: new Date()
    },

    // ============================================
    // 7. UADE - Universidad Argentina de la Empresa
    // ============================================
    {
        email: "alumno.uade@demo.com",
        password: defaultPasswordHash,
        nombre: "Sofía",
        apellido: "Ramírez",
        tenant_id: "universidad-argentina-empresa",
        rol: "viewer",
        permisos: [],
        activo: true,

        documento: "46789012",
        tipo_documento: "DNI",
        telefono: "+54 11 7890-1234",
        fecha_nacimiento: new Date("2001-06-18"),
        foto_perfil_url: null,
        preferencias: {
            tema: "light",
            idioma: "es",
            notificaciones: true
        },

        createdAt: new Date(),
        updatedAt: new Date()
    },

    // ============================================
    // 8. Universidad Austral
    // ============================================
    {
        email: "alumno.austral@demo.com",
        password: defaultPasswordHash,
        nombre: "Tomás",
        apellido: "Silva",
        tenant_id: "universidad-austral",
        rol: "viewer",
        permisos: [],
        activo: true,

        documento: "47890123",
        tipo_documento: "DNI",
        telefono: "+54 230 8901-2345",
        fecha_nacimiento: new Date("2002-04-22"),
        foto_perfil_url: null,
        preferencias: {
            tema: "dark",
            idioma: "es",
            notificaciones: false
        },

        createdAt: new Date(),
        updatedAt: new Date()
    },

    // ============================================
    // 9. UTDT - Universidad Torcuato Di Tella
    // ============================================
    {
        email: "alumno.utdt@demo.com",
        password: defaultPasswordHash,
        nombre: "Valentina",
        apellido: "Torres",
        tenant_id: "universidad-torcuato-di-tella",
        rol: "viewer",
        permisos: [],
        activo: true,

        documento: "48901234",
        tipo_documento: "DNI",
        telefono: "+54 11 9012-3456",
        fecha_nacimiento: new Date("2001-12-05"),
        foto_perfil_url: null,
        preferencias: {
            tema: "light",
            idioma: "es",
            notificaciones: true
        },

        createdAt: new Date(),
        updatedAt: new Date()
    },

    // ============================================
    // 10. UNC - Universidad Nacional de Córdoba
    // ============================================
    {
        email: "alumno.unc@demo.com",
        password: defaultPasswordHash,
        nombre: "Martín",
        apellido: "Ruiz",
        tenant_id: "universidad-nacional-cordoba",
        rol: "viewer",
        permisos: [],
        activo: true,

        documento: "49012345",
        tipo_documento: "DNI",
        telefono: "+54 351 0123-4567",
        fecha_nacimiento: new Date("2000-08-28"),
        foto_perfil_url: null,
        preferencias: {
            tema: "light",
            idioma: "es",
            notificaciones: true
        },

        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

print('✅ Successfully inserted 10 student users (rol=viewer) into users collection');
print('');
print('📝 Login credentials for all students:');
print('   Password: Estudiante2025!');
print('');
print('📧 Student emails:');
print('   1. alumno.uba@demo.com         (UBA)');
print('   2. alumno.uca@demo.com         (UCA)');
print('   3. alumno.itba@demo.com        (ITBA)');
print('   4. alumno.utn@demo.com         (UTN)');
print('   5. alumno.up@demo.com          (Universidad de Palermo)');
print('   6. alumno.unlp@demo.com        (UNLP)');
print('   7. alumno.uade@demo.com        (UADE)');
print('   8. alumno.austral@demo.com     (Universidad Austral)');
print('   9. alumno.utdt@demo.com        (UTDT)');
print('   10. alumno.unc@demo.com        (UNC)');
print('');
print('📊 User collection stats:');
printjson(db.users.countDocuments({ rol: "viewer" }));
