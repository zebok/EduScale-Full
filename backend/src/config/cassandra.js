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

    // Switch to eduscale keyspace (assumes it was created by docker-entrypoint-initdb.d)
    await client.execute(`USE ${keyspace}`);

    console.log('✓ Cassandra keyspace initialized');
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
