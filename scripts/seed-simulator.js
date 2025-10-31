/**
 * EduScale Live Simulation Script
 * Simulates real-time student registrations for demo purposes
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5001';
const DELAY_BETWEEN_SUBMISSIONS = 1000; // 1 second
const TOTAL_STUDENTS = 150; // Total students to simulate

// REALISTIC DATA
const NOMBRES = [
  'Juan', 'Maria', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Diego', 'Sofia',
  'Martin', 'Lucia', 'Sebastian', 'Valentina', 'Federico', 'Camila', 'Matias',
  'Florencia', 'Lucas', 'Victoria', 'Nicolas', 'Agustina', 'Francisco', 'Catalina',
  'Tomas', 'Micaela', 'Santiago', 'Julieta', 'Joaquin', 'Milagros', 'Ignacio', 'Paula',
  'Facundo', 'Constanza', 'Manuel', 'Delfina', 'Gonzalo', 'Martina', 'Emilio', 'Jazmin',
  'Bruno', 'Guillermina', 'Agustin', 'Carolina', 'Benjamin', 'Eugenia', 'Lorenzo', 'Clara'
];

const APELLIDOS = [
  'Gonzalez', 'Rodriguez', 'Fernandez', 'Garcia', 'Martinez', 'Lopez', 'Perez', 'Sanchez',
  'Romero', 'Torres', 'Diaz', 'Alvarez', 'Ruiz', 'Moreno', 'Gimenez', 'Castro',
  'Suarez', 'Molina', 'Ortiz', 'Silva', 'Rojas', 'Medina', 'Herrera', 'Gutierrez',
  'Ramirez', 'Vargas', 'Pereyra', 'Dominguez', 'Cabrera', 'Acosta', 'Vega', 'Rios',
  'Benitez', 'Mendoza', 'Navarro', 'Campos', 'Figueroa', 'Ponce', 'Miranda', 'Sosa'
];

// Map of universities with their careers
const UNIVERSIDADES = [
  {
    id: '',
    institution_id: 'universidad-buenos-aires',
    nombre: 'Universidad de Buenos Aires',
    carreras: ['uba_medicina', 'uba_derecho']
  },
  {
    id: '',
    institution_id: 'universidad-catolica-argentina',
    nombre: 'Universidad Catolica Argentina',
    carreras: ['uca_derecho', 'uca_psicologia']
  },
  {
    id: '',
    institution_id: 'instituto-tecnologico-buenos-aires',
    nombre: 'Instituto Tecnologico de Buenos Aires',
    carreras: ['itba_informatica']
  },
  {
    id: '',
    institution_id: 'universidad-tecnologica-nacional',
    nombre: 'Universidad Tecnologica Nacional',
    carreras: ['utn_sistemas']
  },
  {
    id: '',
    institution_id: 'universidad-palermo',
    nombre: 'Universidad de Palermo',
    carreras: ['up_diseno_grafico']
  },
  {
    id: '',
    institution_id: 'universidad-nacional-la-plata',
    nombre: 'Universidad Nacional de La Plata',
    carreras: ['unlp_informatica']
  },
  {
    id: '',
    institution_id: 'universidad-argentina-empresa',
    nombre: 'Universidad Argentina de la Empresa',
    carreras: ['uade_administracion']
  },
  {
    id: '',
    institution_id: 'universidad-austral',
    nombre: 'Universidad Austral',
    carreras: ['austral_medicina']
  },
  {
    id: '',
    institution_id: 'universidad-torcuato-di-tella',
    nombre: 'Universidad Torcuato Di Tella',
    carreras: ['utdt_economia']
  },
  {
    id: '',
    institution_id: 'universidad-nacional-cordoba',
    nombre: 'Universidad Nacional de Cordoba',
    carreras: ['unc_medicina']
  }
];

// HELPER FUNCTIONS
function generateRandomDNI() {
  return Math.floor(Math.random() * (45000000 - 20000000) + 20000000).toString();
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomName() {
  const nombre = getRandomElement(NOMBRES);
  const apellido = getRandomElement(APELLIDOS);
  return `${nombre} ${apellido}`;
}

function generateRandomEmail(nombre) {
  const cleanName = nombre.toLowerCase()
    .replace(/\s+/g, '.')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const randomNum = Math.floor(Math.random() * 999);
  return `${cleanName}${randomNum}@email.com`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// API FUNCTIONS
async function fetchUniversities() {
  try {
    const response = await axios.get(`${API_URL}/api/prospection/instituciones`);
    return response.data.instituciones;
  } catch (error) {
    console.error('[ERROR] Fetching universities:', error.message);
    throw error;
  }
}

async function submitProspection(data) {
  try {
    const response = await axios.post(`${API_URL}/api/prospection`, data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      return null;
    }
    throw error;
  }
}

// SIMULATION LOGIC
async function runSimulation() {
  console.log('============================================');
  console.log('   EDUSCALE LIVE SIMULATION');
  console.log('============================================\n');

  console.log(`Configuration:`);
  console.log(`   - Total students: ${TOTAL_STUDENTS}`);
  console.log(`   - Delay between submissions: ${DELAY_BETWEEN_SUBMISSIONS}ms`);
  console.log(`   - Estimated duration: ${Math.ceil((TOTAL_STUDENTS * DELAY_BETWEEN_SUBMISSIONS) / 1000 / 60)} minutes\n`);

  // Step 1: Fetch universities
  console.log('[STEP 1] Fetching universities from API...');
  const universities = await fetchUniversities();

  // Map IDs
  UNIVERSIDADES.forEach(uni => {
    const found = universities.find(u => u.institution_id === uni.institution_id);
    if (found) {
      uni.id = found.id;
    }
  });

  console.log(`[SUCCESS] Found ${universities.length} universities\n`);

  // Step 2: Start simulation
  console.log('[STEP 2] Starting live simulation...\n');
  console.log('[INFO] Watch your Neo4j Browser to see the graph growing!');
  console.log('[INFO] Open: http://localhost:7475 (bolt://localhost:7688)\n');

  let successCount = 0;
  let errorCount = 0;
  const usedDNIs = new Set();
  const students = []; // Track students for multi-registration

  for (let i = 1; i <= TOTAL_STUDENTS; i++) {
    const progress = Math.floor((i / TOTAL_STUDENTS) * 100);
    const progressBar = '#'.repeat(Math.floor(progress / 2)) + '-'.repeat(50 - Math.floor(progress / 2));

    // Generate unique DNI
    let dni;
    do {
      dni = generateRandomDNI();
    } while (usedDNIs.has(dni));
    usedDNIs.add(dni);

    const nombreCompleto = generateRandomName();
    const email = generateRandomEmail(nombreCompleto);

    // Store student info for potential multi-registration
    students.push({ dni, nombreCompleto, email });

    // Pick random university and career
    const universidad = getRandomElement(UNIVERSIDADES.filter(u => u.id));
    const carreraId = getRandomElement(universidad.carreras);

    const studentData = {
      nombreCompleto,
      dni,
      email,
      institucionId: universidad.id,
      carreraId
    };

    try {
      const result = await submitProspection(studentData);

      if (result) {
        successCount++;
        console.log(`[${i}/${TOTAL_STUDENTS}] [${progressBar}] ${progress}%`);
        console.log(`   OK: ${nombreCompleto} (DNI: ${dni})`);
        console.log(`   -> ${universidad.nombre.substring(0, 40)}...`);
        console.log(`   Stats: ${successCount} success | ${errorCount} errors\n`);
      } else {
        i--;
      }

    } catch (error) {
      errorCount++;
      console.log(`   [ERROR]: ${error.message}\n`);
    }

    await sleep(DELAY_BETWEEN_SUBMISSIONS);
  }

  // PHASE 2: Multi-registration (20% of students register for additional options)
  console.log('\n[PHASE 2] Simulating multi-registration (indecisos)...\n');

  const multiRegCount = Math.floor(TOTAL_STUDENTS * 0.2); // 20% of students
  const selectedStudents = [];

  // Randomly select students for multi-registration
  while (selectedStudents.length < multiRegCount) {
    const randomStudent = getRandomElement(students);
    if (!selectedStudents.find(s => s.dni === randomStudent.dni)) {
      selectedStudents.push(randomStudent);
    }
  }

  for (let i = 0; i < selectedStudents.length; i++) {
    const student = selectedStudents[i];

    // Each selected student registers 1-2 additional times
    const extraRegistrations = Math.random() > 0.5 ? 2 : 1;

    for (let j = 0; j < extraRegistrations; j++) {
      const universidad = getRandomElement(UNIVERSIDADES.filter(u => u.id));
      const carreraId = getRandomElement(universidad.carreras);

      const studentData = {
        nombreCompleto: student.nombreCompleto,
        dni: student.dni,
        email: `${student.email.split('@')[0]}.${j+1}@email.com`, // Different email to avoid duplicate detection
        institucionId: universidad.id,
        carreraId
      };

      try {
        const result = await submitProspection(studentData);

        if (result) {
          successCount++;
          console.log(`[MULTI ${i+1}/${multiRegCount}] ${student.nombreCompleto} (DNI: ${student.dni})`);
          console.log(`   -> ${universidad.nombre.substring(0, 40)}... (${carreraId})`);
          console.log(`   (Exploring options)\n`);
        }
      } catch (error) {
        errorCount++;
      }

      await sleep(DELAY_BETWEEN_SUBMISSIONS);
    }
  }

  console.log(`\n[PHASE 2 COMPLETE] ${multiRegCount} students registered for multiple options\n`);

  console.log('\n============================================');
  console.log('   SIMULATION COMPLETED!');
  console.log('============================================\n');
  console.log(`Final Stats:`);
  console.log(`   [OK] Successfully registered: ${successCount}`);
  console.log(`   [ERROR] Errors: ${errorCount}`);
  console.log(`\nNext steps:`);
  console.log(`   1. Wait 30 seconds for the worker to process`);
  console.log(`   2. Check Neo4j Browser: http://localhost:7475`);
  console.log(`   3. Run this query to see all relationships:`);
  console.log(`\n      MATCH (p:Persona)-[r]->(n)`);
  console.log(`      RETURN p, r, n`);
  console.log(`      LIMIT 100\n`);
}

runSimulation().catch(error => {
  console.error('[FATAL] Simulation failed:', error);
  process.exit(1);
});
