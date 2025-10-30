const cassandra = require('cassandra-driver');
const fs = require('fs');
const path = require('path');

// Cassandra connection config
const contactPoints = [process.env.CASSANDRA_HOST || 'cassandra'];
const localDataCenter = process.env.CASSANDRA_DC || 'datacenter1';
const keyspace = 'eduscale';

// Create Cassandra client
const client = new cassandra.Client({
  contactPoints,
  localDataCenter,
  keyspace: 'system', // Connect to system keyspace first
  protocolOptions: { port: 9042 }
});

let cassandraReady = false;

/**
 * Initialize Cassandra keyspace and tables
 */
async function initializeCassandra() {
  try {
    console.log('🔌 Connecting to Cassandra...');
    await client.connect();
    console.log('✓ Connected to Cassandra');

    // Read initialization script
    const initScriptPath = path.join(__dirname, '../../../cassandra-init/init-keyspace.cql');

    if (!fs.existsSync(initScriptPath)) {
      console.warn('⚠️  Cassandra init script not found. Skipping table creation.');
      return;
    }

    const initScript = fs.readFileSync(initScriptPath, 'utf8');

    // Split script by semicolons and filter out comments and empty lines
    const statements = initScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log('🚀 Initializing Cassandra keyspace and tables...');

    // Execute each statement
    for (const statement of statements) {
      if (statement.toLowerCase().includes('describe')) {
        continue; // Skip DESCRIBE statements
      }

      try {
        await client.execute(statement);
      } catch (err) {
        // Ignore errors for already existing objects
        if (!err.message.includes('already exists') && !err.message.includes('Cannot add existing')) {
          console.error(`Error executing statement: ${statement.substring(0, 100)}...`);
          console.error(err.message);
        }
      }
    }

    // Switch to eduscale keyspace
    await client.execute(`USE ${keyspace}`);

    console.log('✓ Cassandra keyspace and tables initialized');
    cassandraReady = true;

  } catch (error) {
    console.error('❌ Error initializing Cassandra:', error);
    throw error;
  }
}

/**
 * Get Cassandra client (ensures it's initialized)
 */
async function getCassandraClient() {
  if (!cassandraReady) {
    await initializeCassandra();
  }
  return client;
}

/**
 * Execute a CQL query
 */
async function executeQuery(query, params = [], options = {}) {
  const cassandraClient = await getCassandraClient();
  return cassandraClient.execute(query, params, options);
}

/**
 * Shutdown Cassandra connection
 */
async function shutdown() {
  if (client) {
    await client.shutdown();
    console.log('✓ Cassandra connection closed');
  }
}

// Initialize on module load
initializeCassandra().catch(err => {
  console.error('Failed to initialize Cassandra:', err);
});

module.exports = {
  client,
  cassandraClient: client, // Alias for compatibility
  getCassandraClient,
  executeQuery,
  initializeCassandra,
  connectCassandra: initializeCassandra, // Alias for compatibility
  shutdown
};
