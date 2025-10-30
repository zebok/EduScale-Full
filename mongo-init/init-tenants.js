// MongoDB Initialization Script
// Automatically seeds the database with 10 Argentine universities

db = db.getSiblingDB('eduscale');

print('🎓 Initializing EduScale database with 10 universities...');

db.tenantconfigs.insertMany([
    // ============================================
    // 1. Universidad de Buenos Aires (UBA)
    // ============================================
    {
        institution_id: "universidad-buenos-aires",
        status: "active",
        institution: {
            name: "Universidad de Buenos Aires",
            short_name: "UBA",
            type: "universidad_publica",
            country: "Argentina",
            city: "Buenos Aires",
            province: "CABA",
            founded_year: 1821
        },
        contact: {
            address: "Viamonte 430, C1053 CABA",
            email: "admisiones@uba.ar",
            phone: "+54 11 5287-2400",
            website: "https://www.uba.ar"
        },
        domain: "uba.eduscale.com",
        branding: {
            theme: {
                primary_color: "#002C5F",
                secondary_color: "#FFD700",
                accent_color: "#004080",
                font_family: "Roboto"
            },
            logo_url: "https://upload.wikimedia.org/wikipedia/commons/a/a3/UBA.png"
        },
        texts: {
            welcome: {
                title: "Bienvenido a la UBA",
                subtitle: "Sistema de Gestión de Admisiones",
                description: "La universidad pública más grande de Argentina",
                footer_text: "UBA - Excelencia Académica desde 1821"
            }
        },
        settings: {
            admission_fee: 0,
            enable_scholarship: false,
            max_applicants_per_year: 50000,
            require_entrance_exam: true,
            academic_year_start: "03-01",
            enrollment_periods: [
                { name: "Primer Cuatrimestre", start: "02-01", end: "02-28" },
                { name: "Segundo Cuatrimestre", start: "07-01", end: "07-31" }
            ]
        },
        careers: [
            {
                career_id: "uba_medicina",
                code: "MED",
                name: "Medicina",
                category: "Ciencias de la Salud",
                faculty: "Facultad de Medicina",
                degree_type: "grado",
                degree_title: "Médico/a",
                duration_years: 6,
                modality: "presencial",
                shift: ["tiempo_completo"],
                cupo_anual: 2500,
                description: "Formación médica integral con práctica hospitalaria",
                requirements: {
                    cbc_required: true,
                    entrance_exam: true,
                    min_high_school_avg: null,
                    interview_required: false,
                    portfolio_required: false
                },
                scholarship_available: false,
                scholarship_percentage: [],
                contact: { email: "ingreso@fmed.uba.ar", phone: "+54 11 5287-3800" }
            },
            {
                career_id: "uba_derecho",
                code: "DER",
                name: "Abogacía",
                category: "Ciencias Jurídicas y Políticas",
                faculty: "Facultad de Derecho",
                degree_type: "grado",
                degree_title: "Abogado/a",
                duration_years: 5,
                modality: "presencial",
                shift: ["mañana", "tarde", "noche"],
                cupo_anual: 5000,
                description: "Formación jurídica completa",
                requirements: {
                    cbc_required: true,
                    entrance_exam: true,
                    min_high_school_avg: null,
                    interview_required: false,
                    portfolio_required: false
                },
                scholarship_available: false,
                scholarship_percentage: [],
                contact: { email: "ingreso@derecho.uba.ar", phone: "+54 11 4809-5600" }
            }
        ],
        dashboard: {
            tabs_enabled: [
                { id: "prospection", name: "Declaración de Interés", phase: "A - Prospección", source: "redis", enabled: true, icon: "user-plus", order: 1, endpoint: "/api/prospection" },
                { id: "admission", name: "Expedientes", phase: "B - Admisión", source: "mongodb", enabled: true, icon: "file-text", order: 2, endpoint: "/api/admission" },
                { id: "enrollment", name: "Inscripciones", phase: "C - Inscripción", source: "cassandra", enabled: true, icon: "check-circle", order: 3, endpoint: "/api/enrollment" }
            ]
        }
    },

    // ============================================
    // 2. Universidad Católica Argentina (UCA)
    // ============================================
    {
        institution_id: "universidad-catolica-argentina",
        status: "active",
        institution: {
            name: "Universidad Católica Argentina",
            short_name: "UCA",
            type: "universidad_privada",
            country: "Argentina",
            city: "Buenos Aires",
            province: "CABA",
            founded_year: 1958
        },
        contact: {
            address: "Alicia Moreau de Justo 1300, C1107 CABA",
            email: "admisiones@uca.edu.ar",
            phone: "+54 11 4338-0600",
            website: "https://www.uca.edu.ar"
        },
        domain: "uca.eduscale.com",
        branding: {
            theme: {
                primary_color: "#8B0000",
                secondary_color: "#FFD700",
                accent_color: "#B22222",
                font_family: "Merriweather"
            },
            logo_url: "https://upload.wikimedia.org/wikipedia/commons/c/cb/Universidad_Cat%C3%B3lica_Argentina.png"
        },
        texts: {
            welcome: {
                title: "Bienvenido a la UCA",
                subtitle: "Admisiones 2025",
                description: "Formación integral con valores cristianos",
                footer_text: "UCA - In Conscientia et Veritate"
            }
        },
        settings: {
            admission_fee: 12000,
            enable_scholarship: true,
            max_applicants_per_year: 8000,
            require_entrance_exam: false,
            academic_year_start: "03-01",
            enrollment_periods: [
                { name: "Primer Cuatrimestre", start: "11-01", end: "02-28" },
                { name: "Segundo Cuatrimestre", start: "05-01", end: "07-15" }
            ]
        },
        careers: [
            {
                career_id: "uca_derecho",
                code: "DER",
                name: "Abogacía",
                category: "Ciencias Jurídicas y Políticas",
                faculty: "Facultad de Derecho",
                degree_type: "grado",
                degree_title: "Abogado/a",
                duration_years: 5,
                modality: "presencial",
                shift: ["mañana", "tarde"],
                cupo_anual: 600,
                description: "Formación jurídica con valores éticos",
                requirements: {
                    cbc_required: false,
                    entrance_exam: false,
                    min_high_school_avg: 6.0,
                    interview_required: true,
                    portfolio_required: false
                },
                scholarship_available: true,
                scholarship_percentage: [30, 50, 70, 100],
                contact: { email: "derecho@uca.edu.ar", phone: "+54 11 4338-0650" }
            },
            {
                career_id: "uca_psicologia",
                code: "PSI",
                name: "Licenciatura en Psicología",
                category: "Ciencias Sociales y Humanas",
                faculty: "Facultad de Psicología y Psicopedagogía",
                degree_type: "grado",
                degree_title: "Licenciado/a en Psicología",
                duration_years: 5,
                modality: "presencial",
                shift: ["mañana", "noche"],
                cupo_anual: 500,
                description: "Psicología con enfoque integral",
                requirements: {
                    cbc_required: false,
                    entrance_exam: false,
                    min_high_school_avg: 6.0,
                    interview_required: true,
                    portfolio_required: false
                },
                scholarship_available: true,
                scholarship_percentage: [30, 50, 70, 100],
                contact: { email: "psicologia@uca.edu.ar", phone: "+54 11 4338-0750" }
            }
        ],
        dashboard: {
            tabs_enabled: [
                { id: "prospection", name: "Consultas", phase: "A - Prospección", source: "redis", enabled: true, icon: "user-plus", order: 1, endpoint: "/api/prospection" },
                { id: "admission", name: "Solicitudes", phase: "B - Admisión", source: "mongodb", enabled: true, icon: "file-text", order: 2, endpoint: "/api/admission" },
                { id: "enrollment", name: "Inscritos", phase: "C - Inscripción", source: "cassandra", enabled: true, icon: "check-circle", order: 3, endpoint: "/api/enrollment" }
            ]
        }
    },

    // ============================================
    // 3. ITBA
    // ============================================
    {
        institution_id: "instituto-tecnologico-buenos-aires",
        status: "active",
        institution: {
            name: "Instituto Tecnológico de Buenos Aires",
            short_name: "ITBA",
            type: "universidad_privada",
            country: "Argentina",
            city: "Buenos Aires",
            province: "CABA",
            founded_year: 1959
        },
        contact: {
            address: "Av. Eduardo Madero 399, C1106 CABA",
            email: "admisiones@itba.edu.ar",
            phone: "+54 11 3754-4800",
            website: "https://www.itba.edu.ar"
        },
        domain: "itba.eduscale.com",
        branding: {
            theme: {
                primary_color: "#003366",
                secondary_color: "#0066CC",
                accent_color: "#FF6600",
                font_family: "Open Sans"
            },
            logo_url: "https://centros-investigacion.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/14/2020/11/logo-itba-site.png"
        },
        texts: {
            welcome: {
                title: "Bienvenido al ITBA",
                subtitle: "Sistema de Admisiones",
                description: "Líderes tecnológicos e innovadores",
                footer_text: "ITBA - Excelencia en Tecnología"
            }
        },
        settings: {
            admission_fee: 15000,
            enable_scholarship: true,
            max_applicants_per_year: 2500,
            require_entrance_exam: true,
            academic_year_start: "03-01",
            enrollment_periods: [
                { name: "Ingreso Anual", start: "11-01", end: "02-15" }
            ]
        },
        careers: [
            {
                career_id: "itba_informatica",
                code: "ING-INF",
                name: "Ingeniería Informática",
                category: "Tecnología y Computación",
                faculty: "Escuela de Ingeniería",
                degree_type: "grado",
                degree_title: "Ingeniero/a Informático/a",
                duration_years: 5,
                modality: "presencial",
                shift: ["mañana"],
                cupo_anual: 180,
                description: "Desarrollo de software, IA y sistemas",
                requirements: {
                    cbc_required: false,
                    entrance_exam: true,
                    min_high_school_avg: 7.0,
                    interview_required: false,
                    portfolio_required: false
                },
                scholarship_available: true,
                scholarship_percentage: [25, 50, 75, 100],
                contact: { email: "informatica@itba.edu.ar", phone: "+54 11 3754-4800" }
            }
        ],
        dashboard: {
            tabs_enabled: [
                { id: "prospection", name: "Interesados", phase: "A - Prospección", source: "redis", enabled: true, icon: "user-plus", order: 1, endpoint: "/api/prospection" },
                { id: "admission", name: "Postulaciones", phase: "B - Admisión", source: "mongodb", enabled: true, icon: "file-text", order: 2, endpoint: "/api/admission" },
                { id: "enrollment", name: "Matriculados", phase: "C - Inscripción", source: "cassandra", enabled: true, icon: "check-circle", order: 3, endpoint: "/api/enrollment" }
            ]
        }
    },

    // ============================================
    // 4. UTN
    // ============================================
    {
        institution_id: "universidad-tecnologica-nacional",
        status: "active",
        institution: {
            name: "Universidad Tecnológica Nacional",
            short_name: "UTN",
            type: "universidad_publica",
            country: "Argentina",
            city: "Buenos Aires",
            province: "CABA",
            founded_year: 1959
        },
        contact: {
            address: "Av. Medrano 951, C1179 CABA",
            email: "admisiones@frba.utn.edu.ar",
            phone: "+54 11 4867-7500",
            website: "https://www.frba.utn.edu.ar"
        },
        domain: "utn.eduscale.com",
        branding: {
            theme: {
                primary_color: "#0052A3",
                secondary_color: "#00A3E0",
                accent_color: "#FF6B35",
                font_family: "Lato"
            },
            logo_url: "https://images.seeklogo.com/logo-png/14/2/universidad-tecnologica-nacional-logo-png_seeklogo-145804.png"
        },
        texts: {
            welcome: {
                title: "UTN - Facultad Regional Buenos Aires",
                subtitle: "Ingreso 2025",
                description: "Universidad tecnológica más grande del país",
                footer_text: "UTN - Ciencia, Técnica y Trabajo"
            }
        },
        settings: {
            admission_fee: 0,
            enable_scholarship: false,
            max_applicants_per_year: 15000,
            require_entrance_exam: true,
            academic_year_start: "03-01",
            enrollment_periods: [
                { name: "Ingreso Anual", start: "12-01", end: "03-15" }
            ]
        },
        careers: [
            {
                career_id: "utn_sistemas",
                code: "ISI",
                name: "Ingeniería en Sistemas de Información",
                category: "Tecnología y Computación",
                faculty: "Facultad Regional Buenos Aires",
                degree_type: "grado",
                degree_title: "Ingeniero/a en Sistemas",
                duration_years: 5,
                modality: "presencial",
                shift: ["mañana", "noche"],
                cupo_anual: 1200,
                description: "Desarrollo de sistemas y software",
                requirements: {
                    cbc_required: false,
                    entrance_exam: true,
                    min_high_school_avg: null,
                    interview_required: false,
                    portfolio_required: false
                },
                scholarship_available: false,
                scholarship_percentage: [],
                contact: { email: "isi@frba.utn.edu.ar", phone: "+54 11 4867-7500" }
            }
        ],
        dashboard: {
            tabs_enabled: [
                { id: "prospection", name: "Pre-inscripción", phase: "A - Prospección", source: "redis", enabled: true, icon: "user-plus", order: 1, endpoint: "/api/prospection" },
                { id: "admission", name: "Curso de Ingreso", phase: "B - Admisión", source: "mongodb", enabled: true, icon: "file-text", order: 2, endpoint: "/api/admission" },
                { id: "enrollment", name: "Alumnos Regulares", phase: "C - Inscripción", source: "cassandra", enabled: true, icon: "check-circle", order: 3, endpoint: "/api/enrollment" }
            ]
        }
    },

    // ============================================
    // 5. Universidad de Palermo
    // ============================================
    {
        institution_id: "universidad-palermo",
        status: "active",
        institution: {
            name: "Universidad de Palermo",
            short_name: "UP",
            type: "universidad_privada",
            country: "Argentina",
            city: "Buenos Aires",
            province: "CABA",
            founded_year: 1986
        },
        contact: {
            address: "Av. Córdoba 3501, C1188 CABA",
            email: "informes@palermo.edu",
            phone: "+54 11 5199-4500",
            website: "https://www.palermo.edu"
        },
        domain: "palermo.eduscale.com",
        branding: {
            theme: {
                primary_color: "#E31E24",
                secondary_color: "#2C2E35",
                accent_color: "#F7941D",
                font_family: "Montserrat"
            },
            logo_url: "https://images.seeklogo.com/logo-png/14/2/universidad-de-palermo-logo-png_seeklogo-145717.png"
        },
        texts: {
            welcome: {
                title: "Universidad de Palermo",
                subtitle: "Portal de Admisiones",
                description: "Innovación, creatividad y liderazgo",
                footer_text: "UP - Tu futuro comienza aquí"
            }
        },
        settings: {
            admission_fee: 8500,
            enable_scholarship: true,
            max_applicants_per_year: 12000,
            require_entrance_exam: false,
            academic_year_start: "03-01",
            enrollment_periods: [
                { name: "Primer Cuatrimestre", start: "11-01", end: "02-28" },
                { name: "Segundo Cuatrimestre", start: "05-01", end: "07-31" }
            ]
        },
        careers: [
            {
                career_id: "up_diseno_grafico",
                code: "DG",
                name: "Diseño Gráfico",
                category: "Artes, Diseño y Comunicación",
                faculty: "Facultad de Diseño y Comunicación",
                degree_type: "grado",
                degree_title: "Diseñador/a Gráfico/a",
                duration_years: 4,
                modality: "presencial",
                shift: ["mañana", "noche"],
                cupo_anual: 800,
                description: "Diseño visual y comunicación",
                requirements: {
                    cbc_required: false,
                    entrance_exam: false,
                    min_high_school_avg: 6.0,
                    interview_required: false,
                    portfolio_required: true
                },
                scholarship_available: true,
                scholarship_percentage: [25, 50],
                contact: { email: "diseno@palermo.edu", phone: "+54 11 5199-4520" }
            }
        ],
        dashboard: {
            tabs_enabled: [
                { id: "prospection", name: "Futuros Estudiantes", phase: "A - Prospección", source: "redis", enabled: true, icon: "user-plus", order: 1, endpoint: "/api/prospection" },
                { id: "admission", name: "Admisión", phase: "B - Admisión", source: "mongodb", enabled: true, icon: "file-text", order: 2, endpoint: "/api/admission" },
                { id: "enrollment", name: "Estudiantes Activos", phase: "C - Inscripción", source: "cassandra", enabled: true, icon: "check-circle", order: 3, endpoint: "/api/enrollment" }
            ]
        }
    },

    // ============================================
    // 6. UNLP
    // ============================================
    {
        institution_id: "universidad-nacional-la-plata",
        status: "active",
        institution: {
            name: "Universidad Nacional de La Plata",
            short_name: "UNLP",
            type: "universidad_publica",
            country: "Argentina",
            city: "La Plata",
            province: "Buenos Aires",
            founded_year: 1905
        },
        contact: {
            address: "Calle 7 nro. 776, B1900 La Plata",
            email: "info@unlp.edu.ar",
            phone: "+54 221 423-6000",
            website: "https://www.unlp.edu.ar"
        },
        domain: "unlp.eduscale.com",
        branding: {
            theme: {
                primary_color: "#8B1A1A",
                secondary_color: "#FFD700",
                accent_color: "#CD853F",
                font_family: "Source Sans Pro"
            },
            logo_url: "https://upload.wikimedia.org/wikipedia/commons/7/74/UNLP_Logo_%28cropped%29.svg"
        },
        texts: {
            welcome: {
                title: "UNLP",
                subtitle: "Sistema de Ingreso",
                description: "Universidad pública de excelencia",
                footer_text: "UNLP - Pro Scientia et Patria"
            }
        },
        settings: {
            admission_fee: 0,
            enable_scholarship: false,
            max_applicants_per_year: 35000,
            require_entrance_exam: true,
            academic_year_start: "03-01",
            enrollment_periods: [
                { name: "Ingreso Anual", start: "12-01", end: "02-28" }
            ]
        },
        careers: [
            {
                career_id: "unlp_informatica",
                code: "LINF",
                name: "Licenciatura en Informática",
                category: "Tecnología y Computación",
                faculty: "Facultad de Informática",
                degree_type: "grado",
                degree_title: "Licenciado/a en Informática",
                duration_years: 5,
                modality: "presencial",
                shift: ["mañana", "noche"],
                cupo_anual: 600,
                description: "Informática y computación",
                requirements: {
                    cbc_required: false,
                    entrance_exam: true,
                    min_high_school_avg: null,
                    interview_required: false,
                    portfolio_required: false
                },
                scholarship_available: false,
                scholarship_percentage: [],
                contact: { email: "info@info.unlp.edu.ar", phone: "+54 221 422-8252" }
            }
        ],
        dashboard: {
            tabs_enabled: [
                { id: "prospection", name: "Aspirantes", phase: "A - Prospección", source: "redis", enabled: true, icon: "user-plus", order: 1, endpoint: "/api/prospection" },
                { id: "admission", name: "Ingresantes", phase: "B - Admisión", source: "mongodb", enabled: true, icon: "file-text", order: 2, endpoint: "/api/admission" },
                { id: "enrollment", name: "Estudiantes", phase: "C - Inscripción", source: "cassandra", enabled: true, icon: "check-circle", order: 3, endpoint: "/api/enrollment" }
            ]
        }
    },

    // ============================================
    // 7. UADE
    // ============================================
    {
        institution_id: "universidad-argentina-empresa",
        status: "active",
        institution: {
            name: "Universidad Argentina de la Empresa",
            short_name: "UADE",
            type: "universidad_privada",
            country: "Argentina",
            city: "Buenos Aires",
            province: "CABA",
            founded_year: 1957
        },
        contact: {
            address: "Lima 717, C1073 CABA",
            email: "admisiones@uade.edu.ar",
            phone: "+54 11 4000-7600",
            website: "https://www.uade.edu.ar"
        },
        domain: "uade.eduscale.com",
        branding: {
            theme: {
                primary_color: "#003DA5",
                secondary_color: "#00AEEF",
                accent_color: "#F7931E",
                font_family: "Raleway"
            },
            logo_url: "https://www.institucionulloa.com.ar/wp-content/uploads/2020/05/logo_mesa-de-trabajo-1-copia.png"
        },
        texts: {
            welcome: {
                title: "UADE",
                subtitle: "Admisiones Online",
                description: "Líderes empresariales con visión global",
                footer_text: "UADE - Educación para el Mundo Real"
            }
        },
        settings: {
            admission_fee: 10000,
            enable_scholarship: true,
            max_applicants_per_year: 9000,
            require_entrance_exam: false,
            academic_year_start: "03-01",
            enrollment_periods: [
                { name: "Primer Cuatrimestre", start: "11-01", end: "03-15" },
                { name: "Segundo Cuatrimestre", start: "06-01", end: "08-15" }
            ]
        },
        careers: [
            {
                career_id: "uade_administracion",
                code: "ADM",
                name: "Administración de Empresas",
                category: "Ciencias Económicas y Empresariales",
                faculty: "Facultad de Ciencias Empresariales",
                degree_type: "grado",
                degree_title: "Licenciado/a en Administración",
                duration_years: 4,
                modality: "presencial",
                shift: ["mañana", "noche"],
                cupo_anual: 800,
                description: "Gestión empresarial e innovación",
                requirements: {
                    cbc_required: false,
                    entrance_exam: false,
                    min_high_school_avg: 6.0,
                    interview_required: false,
                    portfolio_required: false
                },
                scholarship_available: true,
                scholarship_percentage: [25, 50, 75, 100],
                contact: { email: "administracion@uade.edu.ar", phone: "+54 11 4000-7620" }
            }
        ],
        dashboard: {
            tabs_enabled: [
                { id: "prospection", name: "Interesados", phase: "A - Prospección", source: "redis", enabled: true, icon: "user-plus", order: 1, endpoint: "/api/prospection" },
                { id: "admission", name: "Postulantes", phase: "B - Admisión", source: "mongodb", enabled: true, icon: "file-text", order: 2, endpoint: "/api/admission" },
                { id: "enrollment", name: "Matriculados", phase: "C - Inscripción", source: "cassandra", enabled: true, icon: "check-circle", order: 3, endpoint: "/api/enrollment" }
            ]
        }
    },

    // ============================================
    // 8. Universidad Austral
    // ============================================
    {
        institution_id: "universidad-austral",
        status: "active",
        institution: {
            name: "Universidad Austral",
            short_name: "AUSTRAL",
            type: "universidad_privada",
            country: "Argentina",
            city: "Pilar",
            province: "Buenos Aires",
            founded_year: 1991
        },
        contact: {
            address: "Mariano Acosta s/n, B1629 Pilar",
            email: "admision@austral.edu.ar",
            phone: "+54 230 448-2000",
            website: "https://www.austral.edu.ar"
        },
        domain: "austral.eduscale.com",
        branding: {
            theme: {
                primary_color: "#003B71",
                secondary_color: "#0066B3",
                accent_color: "#E84E0F",
                font_family: "Nunito"
            },
            logo_url: "https://www.austral.edu.ar/wp-content/uploads/2022/09/logo-footer.png?x65960&x65960"
        },
        texts: {
            welcome: {
                title: "Universidad Austral",
                subtitle: "Portal de Ingreso",
                description: "Formación integral con valores",
                footer_text: "Austral - Verdad, Bien y Belleza"
            }
        },
        settings: {
            admission_fee: 14000,
            enable_scholarship: true,
            max_applicants_per_year: 3500,
            require_entrance_exam: true,
            academic_year_start: "03-01",
            enrollment_periods: [
                { name: "Ingreso Anual", start: "10-01", end: "02-15" }
            ]
        },
        careers: [
            {
                career_id: "austral_medicina",
                code: "MED",
                name: "Medicina",
                category: "Ciencias de la Salud",
                faculty: "Facultad de Ciencias Biomédicas",
                degree_type: "grado",
                degree_title: "Médico/a",
                duration_years: 6,
                modality: "presencial",
                shift: ["tiempo_completo"],
                cupo_anual: 120,
                description: "Formación médica de excelencia",
                requirements: {
                    cbc_required: false,
                    entrance_exam: true,
                    min_high_school_avg: 7.0,
                    interview_required: true,
                    portfolio_required: false
                },
                scholarship_available: true,
                scholarship_percentage: [25, 50, 100],
                contact: { email: "medicina@austral.edu.ar", phone: "+54 230 448-2100" }
            }
        ],
        dashboard: {
            tabs_enabled: [
                { id: "prospection", name: "Consultas", phase: "A - Prospección", source: "redis", enabled: true, icon: "user-plus", order: 1, endpoint: "/api/prospection" },
                { id: "admission", name: "Evaluación", phase: "B - Admisión", source: "mongodb", enabled: true, icon: "file-text", order: 2, endpoint: "/api/admission" },
                { id: "enrollment", name: "Inscriptos", phase: "C - Inscripción", source: "cassandra", enabled: true, icon: "check-circle", order: 3, endpoint: "/api/enrollment" }
            ]
        }
    },

    // ============================================
    // 9. UTDT
    // ============================================
    {
        institution_id: "universidad-torcuato-di-tella",
        status: "active",
        institution: {
            name: "Universidad Torcuato Di Tella",
            short_name: "UTDT",
            type: "universidad_privada",
            country: "Argentina",
            city: "Buenos Aires",
            province: "CABA",
            founded_year: 1991
        },
        contact: {
            address: "Av. Figueroa Alcorta 7350, C1428 CABA",
            email: "admisiones@utdt.edu",
            phone: "+54 11 5169-7000",
            website: "https://www.utdt.edu"
        },
        domain: "utdt.eduscale.com",
        branding: {
            theme: {
                primary_color: "#8B0000",
                secondary_color: "#4B0000",
                accent_color: "#C0C0C0",
                font_family: "Georgia"
            },
            logo_url: "https://www.helpargentina.org/images/default/ong/cuadrado_utdt-0155.png"
        },
        texts: {
            welcome: {
                title: "Universidad Torcuato Di Tella",
                subtitle: "Admisiones de Grado",
                description: "Excelencia académica e investigación",
                footer_text: "UTDT - Libertad de Pensamiento"
            }
        },
        settings: {
            admission_fee: 18000,
            enable_scholarship: true,
            max_applicants_per_year: 1800,
            require_entrance_exam: true,
            academic_year_start: "03-01",
            enrollment_periods: [
                { name: "Ingreso Anual", start: "09-01", end: "01-31" }
            ]
        },
        careers: [
            {
                career_id: "utdt_economia",
                code: "ECON",
                name: "Licenciatura en Economía",
                category: "Ciencias Económicas y Empresariales",
                faculty: "Departamento de Economía",
                degree_type: "grado",
                degree_title: "Licenciado/a en Economía",
                duration_years: 4,
                modality: "presencial",
                shift: ["mañana"],
                cupo_anual: 80,
                description: "Economía con rigor académico",
                requirements: {
                    cbc_required: false,
                    entrance_exam: true,
                    min_high_school_avg: 7.5,
                    interview_required: true,
                    portfolio_required: false
                },
                scholarship_available: true,
                scholarship_percentage: [50, 100],
                contact: { email: "economia@utdt.edu", phone: "+54 11 5169-7100" }
            }
        ],
        dashboard: {
            tabs_enabled: [
                { id: "prospection", name: "Prospectos", phase: "A - Prospección", source: "redis", enabled: true, icon: "user-plus", order: 1, endpoint: "/api/prospection" },
                { id: "admission", name: "Proceso Selectivo", phase: "B - Admisión", source: "mongodb", enabled: true, icon: "file-text", order: 2, endpoint: "/api/admission" },
                { id: "enrollment", name: "Admitidos", phase: "C - Inscripción", source: "cassandra", enabled: true, icon: "check-circle", order: 3, endpoint: "/api/enrollment" }
            ]
        }
    },

    // ============================================
    // 10. UNC
    // ============================================
    {
        institution_id: "universidad-nacional-cordoba",
        status: "active",
        institution: {
            name: "Universidad Nacional de Córdoba",
            short_name: "UNC",
            type: "universidad_publica",
            country: "Argentina",
            city: "Córdoba",
            province: "Córdoba",
            founded_year: 1613
        },
        contact: {
            address: "Haya de la Torre s/n, X5000 Córdoba",
            email: "admisiones@unc.edu.ar",
            phone: "+54 351 433-4000",
            website: "https://www.unc.edu.ar"
        },
        domain: "unc.eduscale.com",
        branding: {
            theme: {
                primary_color: "#003C71",
                secondary_color: "#FFB81C",
                accent_color: "#9E1B32",
                font_family: "Arial"
            },
            logo_url: "https://upload.wikimedia.org/wikipedia/commons/c/c4/Escudo_UNC.png"
        },
        texts: {
            welcome: {
                title: "Bienvenido a la UNC",
                subtitle: "Admisiones 2025",
                description: "La universidad más antigua de Argentina",
                footer_text: "UNC - 400 años de historia"
            }
        },
        settings: {
            admission_fee: 0,
            enable_scholarship: false,
            max_applicants_per_year: 40000,
            require_entrance_exam: true,
            academic_year_start: "03-01",
            enrollment_periods: [
                { name: "Ingreso Anual", start: "02-01", end: "03-15" }
            ]
        },
        careers: [
            {
                career_id: "unc_medicina",
                code: "MED",
                name: "Medicina",
                category: "Ciencias de la Salud",
                faculty: "Facultad de Ciencias Médicas",
                degree_type: "grado",
                degree_title: "Médico/a",
                duration_years: 6,
                modality: "presencial",
                shift: ["tiempo_completo"],
                cupo_anual: 1500,
                description: "Formación médica integral",
                requirements: {
                    cbc_required: false,
                    entrance_exam: true,
                    min_high_school_avg: null,
                    interview_required: false,
                    portfolio_required: false
                },
                scholarship_available: false,
                scholarship_percentage: [],
                contact: { email: "info@fcm.unc.edu.ar", phone: "+54 351 433-4042" }
            }
        ],
        dashboard: {
            tabs_enabled: [
                { id: "prospection", name: "Aspirantes", phase: "A - Prospección", source: "redis", enabled: true, icon: "user-plus", order: 1, endpoint: "/api/prospection" },
                { id: "admission", name: "Ingresantes", phase: "B - Admisión", source: "mongodb", enabled: true, icon: "file-text", order: 2, endpoint: "/api/admission" },
                { id: "enrollment", name: "Alumnos", phase: "C - Inscripción", source: "cassandra", enabled: true, icon: "check-circle", order: 3, endpoint: "/api/enrollment" }
            ]
        }
    }
]);

print('✅ Successfully inserted 10 universities into tenantconfigs collection');
print('📊 Collection stats:');
printjson(db.tenantconfigs.countDocuments());
