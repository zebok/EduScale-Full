const neo4j = require('neo4j-driver');

let neo4jDriver;

const connectNeo4j = async () => {
  try {
    const uri = process.env.NEO4J_URI || 'bolt://neo4j:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'eduscale123';

    neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(user, password));

    // Verificar conexión
    const session = neo4jDriver.session();
    await session.run('RETURN 1');
    await session.close();

    console.log('✓ Neo4j conectado correctamente');
  } catch (error) {
    console.error('❌ Error al conectar con Neo4j:', error);
    throw error;
  }
};

module.exports = {
  connectNeo4j,
  get neo4jDriver() {
    return neo4jDriver;
  }
};
