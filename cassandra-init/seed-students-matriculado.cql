-- Manual seed to (re)create 10 student accounts as 'matriculado'
-- Run in cqlsh:  USE eduscale; then source this file or paste statements.

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
