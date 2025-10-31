-- ============================================
-- EduScale - Cassandra Initialization Script
-- Core enrollments table for student lifecycle
-- ============================================

-- Create keyspace if not exists
CREATE KEYSPACE IF NOT EXISTS eduscale
WITH replication = {
  'class': 'SimpleStrategy',
  'replication_factor': 1
};

USE eduscale;

-- ============================================
-- ENROLLMENTS TABLE
-- Stores all student enrollments across all phases
-- ============================================

CREATE TABLE IF NOT EXISTS enrollments (
    -- PRIMARY KEY: Partition by institution, cluster by email and career
    institution_id text,
    email text,
    career_id text,

    -- UNIQUE IDENTIFIER
    enrollment_id uuid,

    -- STUDENT IDENTIFICATION
    nombre_completo text,
    documento text,
    tipo_documento text,        -- 'DNI', 'Pasaporte', 'CI'
    telefono text,
    fecha_nacimiento date,

    -- INSTITUTION & CAREER INFO (denormalized for query efficiency)
    institution_name text,
    career_name text,
    career_faculty text,
    academic_year int,
    enrollment_period text,     -- '2025-1', '2025-2'

    -- PHASE A: PROSPECTION (from Redis)
    prospection_date timestamp,
    prospection_source text,    -- 'web', 'presencial', 'phone'

    -- PHASE B: ADMISSION (from MongoDB)
    admission_status text,      -- 'pendiente', 'en_revision', 'aceptado', 'rechazado'
    admission_date timestamp,
    admission_score decimal,    -- puntaje de evaluación
    admission_notes text,       -- observaciones del comité
    interview_date timestamp,
    interview_result text,      -- 'aprobado', 'rechazado', 'pendiente'

    -- PHASE C: ENROLLMENT (Core in Cassandra)
    enrollment_status text,     -- 'pendiente', 'confirmado', 'matriculado', 'cancelado'
    enrollment_date timestamp,
    confirmation_date timestamp,
    matriculation_date timestamp,

    -- DOCUMENTS STATUS
    document_status text,       -- 'pendiente', 'incompleto', 'completo', 'verificado'
    documents_uploaded list<text>, -- ['dni.pdf', 'certificado.pdf']
    documents_verified_date timestamp,
    documents_notes text,

    -- PAYMENT STATUS
    payment_status text,        -- 'pendiente', 'parcial', 'completo', 'exento'
    payment_amount decimal,
    payment_currency text,      -- 'ARS', 'USD'
    payment_date timestamp,
    payment_method text,        -- 'transferencia', 'tarjeta', 'efectivo'

    -- SCHOLARSHIP
    scholarship_requested boolean,
    scholarship_status text,    -- 'pendiente', 'aprobado', 'rechazado'
    scholarship_percentage int,
    scholarship_notes text,

    -- METADATA
    created_at timestamp,
    updated_at timestamp,
    created_by text,            -- user email who created
    updated_by text,            -- user email who last updated


    -- ACADEMIC DATA
    academic_mail text,
    academic_password text,

    -- AUDIT
    status_history list<frozen<map<text, text>>>, -- [{date: '...', status: '...', user: '...'}]

    PRIMARY KEY ((institution_id), email, career_id)
) WITH CLUSTERING ORDER BY (email ASC, career_id ASC)
  AND comment = 'Core enrollments table - stores complete student lifecycle';

-- ============================================
-- CREATE SECONDARY INDEXES
-- ============================================

-- Index by enrollment_id for direct lookups
CREATE INDEX IF NOT EXISTS idx_enrollment_id
ON enrollments (enrollment_id);

-- Index by enrollment_status for filtering
CREATE INDEX IF NOT EXISTS idx_enrollment_status
ON enrollments (enrollment_status);

-- Index by admission_status for phase B queries
CREATE INDEX IF NOT EXISTS idx_admission_status
ON enrollments (admission_status);

-- Index by academic_year for year-based queries
CREATE INDEX IF NOT EXISTS idx_academic_year
ON enrollments (academic_year);

-- Index by documento (DNI) for person-based queries
CREATE INDEX IF NOT EXISTS idx_documento
ON enrollments (documento);

-- ===============================================
-- EJEMPLO DE DATOS INICIALES: 5 inscripciones por universidad (demo)
-- ===============================================

-- UBA (usando workflow stages: interesado, documentacion_pendiente, en_revision, curso_ingreso, aceptado, rechazado)
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-buenos-aires', 'alumno1.uba@demo.com', 'uba_medicina', uuid(), 'Juan Uba', 'Universidad de Buenos Aires', 'Medicina', 2025, 'interesado', toTimestamp(now()));
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-buenos-aires', 'alumna2.uba@demo.com', 'uba_medicina', uuid(), 'Paula Medin', 'Universidad de Buenos Aires', 'Medicina', 2025, 'documentacion_pendiente', toTimestamp(now()));
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-buenos-aires', 'carlos3@uba.ar', 'uba_medicina', uuid(), 'Carlos Tercero', 'Universidad de Buenos Aires', 'Medicina', 2025, 'en_revision', toTimestamp(now()));
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-buenos-aires', 'maria4@uba.ar', 'uba_medicina', uuid(), 'María Cuartas', 'Universidad de Buenos Aires', 'Medicina', 2025, 'curso_ingreso', toTimestamp(now()));
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-buenos-aires', 'diego.quinto@uba.ar', 'uba_medicina', uuid(), 'Diego Quinto', 'Universidad de Buenos Aires', 'Medicina', 2025, 'aceptado', toTimestamp(now()));

-- UCA (usando workflow stages privado: interesado, documentacion_pendiente, en_revision, entrevista_programada, evaluacion_beca, aceptado, rechazado, matriculado)
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-catolica-argentina', 'ana.uca@demo.com', 'uca_derecho', uuid(), 'Ana María', 'Universidad Católica Argentina', 'Abogacía', 2025, 'matriculado', toTimestamp(now()));
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-catolica-argentina', 'beatriz.segunda@uca.edu.ar', 'uca_derecho', uuid(), 'Beatriz Segunda', 'Universidad Católica Argentina', 'Abogacía', 2025, 'interesado', toTimestamp(now()));
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-catolica-argentina', 'carla.uca@demo.com', 'uca_derecho', uuid(), 'Carla Carlos', 'Universidad Católica Argentina', 'Abogacía', 2025, 'entrevista_programada', toTimestamp(now()));
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-catolica-argentina', 'diego.cuarto@uca.edu.ar', 'uca_derecho', uuid(), 'Diego Cuarto', 'Universidad Católica Argentina', 'Abogacía', 2025, 'matriculado', toTimestamp(now()));
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-catolica-argentina', 'ernesto.quinto@uca.edu.ar', 'uca_derecho', uuid(), 'Ernesto Quinto', 'Universidad Católica Argentina', 'Abogacía', 2025, 'aceptado', toTimestamp(now()));

-- ===============================================
-- ALUMNOS PARA LOGIN (1 por universidad)
-- Usuarios base con mail/contraseña académica por defecto
-- academic_mail: alumno@<institution_id>.edu
-- academic_password: Estudiante2025!
-- ===============================================

-- 1) UBA
INSERT INTO enrollments (
  institution_id, email, career_id, enrollment_id, nombre_completo,
  institution_name, career_name, academic_year, enrollment_status,
  academic_mail, academic_password, created_at
) VALUES (
  'universidad-buenos-aires', 'login.uba@demo.com', 'uba_medicina', uuid(), 'Alumno UBA',
  'Universidad de Buenos Aires', 'Medicina', 2025, 'matriculado',
  'alumno@universidad-buenos-aires.edu', 'Estudiante2025!', toTimestamp(now())
);

-- 2) UCA
INSERT INTO enrollments (
  institution_id, email, career_id, enrollment_id, nombre_completo,
  institution_name, career_name, academic_year, enrollment_status,
  academic_mail, academic_password, created_at
) VALUES (
  'universidad-catolica-argentina', 'login.uca@demo.com', 'uca_derecho', uuid(), 'Alumno UCA',
  'Universidad Católica Argentina', 'Abogacía', 2025, 'matriculado',
  'alumno@universidad-catolica-argentina.edu', 'Estudiante2025!', toTimestamp(now())
);

-- 3) ITBA
INSERT INTO enrollments (
  institution_id, email, career_id, enrollment_id, nombre_completo,
  institution_name, career_name, academic_year, enrollment_status,
  academic_mail, academic_password, created_at
) VALUES (
  'instituto-tecnologico-buenos-aires', 'login.itba@demo.com', 'itba_informatica', uuid(), 'Alumno ITBA',
  'Instituto Tecnológico de Buenos Aires', 'Ingeniería Informática', 2025, 'matriculado',
  'alumno@instituto-tecnologico-buenos-aires.edu', 'Estudiante2025!', toTimestamp(now())
);

-- 4) UTN
INSERT INTO enrollments (
  institution_id, email, career_id, enrollment_id, nombre_completo,
  institution_name, career_name, academic_year, enrollment_status,
  academic_mail, academic_password, created_at
) VALUES (
  'universidad-tecnologica-nacional', 'login.utn@demo.com', 'utn_sistemas', uuid(), 'Alumno UTN',
  'Universidad Tecnológica Nacional', 'Ingeniería en Sistemas de Información', 2025, 'matriculado',
  'alumno@universidad-tecnologica-nacional.edu', 'Estudiante2025!', toTimestamp(now())
);

-- 5) Universidad de Palermo
INSERT INTO enrollments (
  institution_id, email, career_id, enrollment_id, nombre_completo,
  institution_name, career_name, academic_year, enrollment_status,
  academic_mail, academic_password, created_at
) VALUES (
  'universidad-palermo', 'login.up@demo.com', 'up_diseno_grafico', uuid(), 'Alumno UP',
  'Universidad de Palermo', 'Diseño Gráfico', 2025, 'matriculado',
  'alumno@universidad-palermo.edu', 'Estudiante2025!', toTimestamp(now())
);

-- 6) UNLP
INSERT INTO enrollments (
  institution_id, email, career_id, enrollment_id, nombre_completo,
  institution_name, career_name, academic_year, enrollment_status,
  academic_mail, academic_password, created_at
) VALUES (
  'universidad-nacional-la-plata', 'login.unlp@demo.com', 'unlp_informatica', uuid(), 'Alumno UNLP',
  'Universidad Nacional de La Plata', 'Licenciatura en Informática', 2025, 'matriculado',
  'alumno@universidad-nacional-la-plata.edu', 'Estudiante2025!', toTimestamp(now())
);

-- 7) UADE
INSERT INTO enrollments (
  institution_id, email, career_id, enrollment_id, nombre_completo,
  institution_name, career_name, academic_year, enrollment_status,
  academic_mail, academic_password, created_at
) VALUES (
  'universidad-argentina-empresa', 'login.uade@demo.com', 'uade_administracion', uuid(), 'Alumno UADE',
  'Universidad Argentina de la Empresa', 'Administración de Empresas', 2025, 'matriculado',
  'alumno@universidad-argentina-empresa.edu', 'Estudiante2025!', toTimestamp(now())
);

-- 8) Universidad Austral
INSERT INTO enrollments (
  institution_id, email, career_id, enrollment_id, nombre_completo,
  institution_name, career_name, academic_year, enrollment_status,
  academic_mail, academic_password, created_at
) VALUES (
  'universidad-austral', 'login.austral@demo.com', 'austral_medicina', uuid(), 'Alumno Austral',
  'Universidad Austral', 'Medicina', 2025, 'matriculado',
  'alumno@universidad-austral.edu', 'Estudiante2025!', toTimestamp(now())
);

-- 9) UTDT
INSERT INTO enrollments (
  institution_id, email, career_id, enrollment_id, nombre_completo,
  institution_name, career_name, academic_year, enrollment_status,
  academic_mail, academic_password, created_at
) VALUES (
  'universidad-torcuato-di-tella', 'login.utdt@demo.com', 'utdt_economia', uuid(), 'Alumno UTDT',
  'Universidad Torcuato Di Tella', 'Licenciatura en Economía', 2025, 'matriculado',
  'alumno@universidad-torcuato-di-tella.edu', 'Estudiante2025!', toTimestamp(now())
);

-- 10) UNC
INSERT INTO enrollments (
  institution_id, email, career_id, enrollment_id, nombre_completo,
  institution_name, career_name, academic_year, enrollment_status,
  academic_mail, academic_password, created_at
) VALUES (
  'universidad-nacional-cordoba', 'login.unc@demo.com', 'unc_medicina', uuid(), 'Alumno UNC',
  'Universidad Nacional de Córdoba', 'Medicina', 2025, 'matriculado',
  'alumno@universidad-nacional-cordoba.edu', 'Estudiante2025!', toTimestamp(now())
);
