const cassandra = require('cassandra-driver');

let cassandraClient;

const connectCassandra = async () => {
  try {
    const contactPoints = (process.env.CASSANDRA_CONTACT_POINTS || 'cassandra').split(',');
    const keyspace = process.env.CASSANDRA_KEYSPACE || 'eduscale';

    cassandraClient = new cassandra.Client({
      contactPoints: contactPoints,
      localDataCenter: 'datacenter1',
      keyspace: 'system'
    });

    await cassandraClient.connect();

    // Crear keyspace si no existe
    const createKeyspaceQuery = `
      CREATE KEYSPACE IF NOT EXISTS ${keyspace}
      WITH replication = {
        'class': 'SimpleStrategy',
        'replication_factor': 1
      }
    `;

    await cassandraClient.execute(createKeyspaceQuery);
    console.log(`✓ Keyspace '${keyspace}' creado/verificado`);

    // Cambiar al keyspace
    await cassandraClient.execute(`USE ${keyspace}`);

    // Crear tabla de inscripciones si no existe
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS inscripciones (
        institucion text,
        email text,
        id_inscripcion uuid,
        nombre text,
        apellido text,
        programa text,
        fecha_inscripcion timestamp,
        PRIMARY KEY ((institucion), email, id_inscripcion)
      ) WITH CLUSTERING ORDER BY (email ASC, id_inscripcion DESC)
    `;

    await cassandraClient.execute(createTableQuery);
    console.log('✓ Tabla inscripciones creada/verificada');
    console.log('✓ Cassandra conectado correctamente');
  } catch (error) {
    console.error('❌ Error al conectar con Cassandra:', error);
    throw error;
  }
};

module.exports = {
  connectCassandra,
  get cassandraClient() {
    return cassandraClient;
  }
};
