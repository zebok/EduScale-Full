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

-- ===============================================
-- EJEMPLO DE DATOS INICIALES: 5 inscripciones por universidad (demo)
-- ===============================================

-- UBA
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-buenos-aires', 'alumno1.uba@demo.com', 'uba_medicina', uuid(), 'Juan Uba', 'Universidad de Buenos Aires', 'Medicina', 2025, 'matriculado', toTimestamp(now()));
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-buenos-aires', 'alumna2.uba@demo.com', 'uba_medicina', uuid(), 'Paula Medin', 'Universidad de Buenos Aires', 'Medicina', 2025, 'pendiente', toTimestamp(now()));
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-buenos-aires', 'carlos3@uba.ar', 'uba_medicina', uuid(), 'Carlos Tercero', 'Universidad de Buenos Aires', 'Medicina', 2025, 'confirmado', toTimestamp(now()));
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-buenos-aires', 'maria4@uba.ar', 'uba_medicina', uuid(), 'María Cuartas', 'Universidad de Buenos Aires', 'Medicina', 2025, 'matriculado', toTimestamp(now()));
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-buenos-aires', 'diego.quinto@uba.ar', 'uba_medicina', uuid(), 'Diego Quinto', 'Universidad de Buenos Aires', 'Medicina', 2025, 'matriculado', toTimestamp(now()));

-- UCA
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-catolica-argentina', 'ana.uca@demo.com', 'uca_derecho', uuid(), 'Ana María', 'Universidad Católica Argentina', 'Abogacía', 2025, 'matriculado', toTimestamp(now()));
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-catolica-argentina', 'beatriz.segunda@uca.edu.ar', 'uca_derecho', uuid(), 'Beatriz Segunda', 'Universidad Católica Argentina', 'Abogacía', 2025, 'pendiente', toTimestamp(now()));
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-catolica-argentina', 'carla.uca@demo.com', 'uca_derecho', uuid(), 'Carla Carlos', 'Universidad Católica Argentina', 'Abogacía', 2025, 'confirmado', toTimestamp(now()));
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-catolica-argentina', 'diego.cuarto@uca.edu.ar', 'uca_derecho', uuid(), 'Diego Cuarto', 'Universidad Católica Argentina', 'Abogacía', 2025, 'matriculado', toTimestamp(now()));
INSERT INTO enrollments (institution_id, email, career_id, enrollment_id, nombre_completo, institution_name, career_name, academic_year, enrollment_status, created_at)
VALUES ('universidad-catolica-argentina', 'ernesto.quinto@uca.edu.ar', 'uca_derecho', uuid(), 'Ernesto Quinto', 'Universidad Católica Argentina', 'Abogacía', 2025, 'matriculado', toTimestamp(now()));
