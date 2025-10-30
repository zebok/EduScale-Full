const neo4j = require('neo4j-driver');

let neo4jDriver;

const connectNeo4j = async () => {
  try {
    const uri = process.env.NEO4J_URI || 'bolt://neo4j:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'eduscale123';

    neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 2 * 60 * 1000,
    });

    // Verificar conexión
    await neo4jDriver.verifyConnectivity();

    console.log('✅ Neo4j connected successfully');

    // Create constraints and indexes
    await createConstraints();

  } catch (error) {
    console.error('❌ Error connecting to Neo4j:', error.message);
    throw error;
  }
};

/**
 * Create constraints and indexes for optimal performance
 */
const createConstraints = async () => {
  const session = neo4jDriver.session();

  try {
    console.log('📊 Creating Neo4j constraints and indexes...');

    // Unique constraint on Persona.dni
    await session.run(`
      CREATE CONSTRAINT persona_dni IF NOT EXISTS
      FOR (p:Persona) REQUIRE p.dni IS UNIQUE
    `);

    // Unique constraint on Universidad.institution_id
    await session.run(`
      CREATE CONSTRAINT universidad_id IF NOT EXISTS
      FOR (u:Universidad) REQUIRE u.institution_id IS UNIQUE
    `);

    // Unique constraint on Carrera.career_id
    await session.run(`
      CREATE CONSTRAINT carrera_id IF NOT EXISTS
      FOR (c:Carrera) REQUIRE c.career_id IS UNIQUE
    `);

    console.log('✅ Neo4j constraints created');
  } catch (error) {
    // Ignore errors if constraints already exist
    if (!error.message.includes('already exists') && !error.message.includes('An equivalent constraint already exists')) {
      console.error('⚠️  Error creating constraints:', error.message);
    }
  } finally {
    await session.close();
  }
};

/**
 * Get a new session
 */
const getSession = () => {
  if (!neo4jDriver) {
    throw new Error('Neo4j driver not initialized. Call connectNeo4j() first.');
  }
  return neo4jDriver.session();
};

/**
 * Close connection
 */
const closeNeo4j = async () => {
  if (neo4jDriver) {
    await neo4jDriver.close();
    console.log('🔌 Neo4j connection closed');
  }
};

module.exports = {
  connectNeo4j,
  getSession,
  closeNeo4j,
  get neo4jDriver() {
    return neo4jDriver;
  }
};
