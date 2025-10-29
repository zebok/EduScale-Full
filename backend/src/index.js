const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import database configurations
const mongoConfig = require('./config/mongodb');
const cassandraConfig = require('./config/cassandra');
const redisConfig = require('./config/redis');
const neo4jConfig = require('./config/neo4j');

// Import routes
const authRoutes = require('./routes/auth');
const tenantConfigRoutes = require('./routes/tenantConfig');
const prospectionRoutes = require('./routes/prospection');
const admissionRoutes = require('./routes/admission');
const enrollmentRoutes = require('./routes/enrollment');
const relationsRoutes = require('./routes/relations');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const status = {
    mongodb: false,
    cassandra: false,
    redis: false,
    neo4j: false
  };

  try {
    // Check MongoDB
    if (mongoConfig.mongoose.connection.readyState === 1) {
      status.mongodb = true;
    }
  } catch (error) {
    console.error('MongoDB health check failed:', error);
  }

  try {
    // Check Cassandra
    const client = cassandraConfig.cassandraClient;
    if (client && client.getState && client.getState().getConnectedHosts().length > 0) {
      status.cassandra = true;
    }
  } catch (error) {
    console.error('Cassandra health check failed:', error);
  }

  try {
    // Check Redis
    const client = redisConfig.redisClient;
    if (client && client.isOpen) {
      status.redis = true;
    }
  } catch (error) {
    console.error('Redis health check failed:', error);
  }

  try {
    // Check Neo4j
    const driver = neo4jConfig.neo4jDriver;
    if (driver) {
      const session = driver.session();
      await session.run('RETURN 1');
      await session.close();
      status.neo4j = true;
    }
  } catch (error) {
    console.error('Neo4j health check failed:', error);
  }

  res.json(status);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenant-config', tenantConfigRoutes);
app.use('/api/prospection', prospectionRoutes);
app.use('/api/admission', admissionRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/relations', relationsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'EduScale API - TPO Ingeniería II',
    version: '1.0.0',
    databases: ['MongoDB', 'Cassandra', 'Redis', 'Neo4j']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Algo salió mal!',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Start server and connect to databases
async function startServer() {
  try {
    console.log('🚀 Iniciando EduScale Backend...');

    // Connect to databases
    await mongoConfig.connectMongoDB();
    await cassandraConfig.connectCassandra();
    await redisConfig.connectRedis();
    await neo4jConfig.connectNeo4j();

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Servidor corriendo en puerto ${PORT}`);
      console.log(`✓ Health check disponible en http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Cerrando conexiones...');

  try {
    await mongoConfig.mongoose.connection.close();
    await cassandraConfig.cassandraClient.shutdown();
    await redisConfig.redisClient.quit();
    await neo4jConfig.neo4jDriver.close();
    console.log('✓ Conexiones cerradas correctamente');
    process.exit(0);
  } catch (error) {
    console.error('Error al cerrar conexiones:', error);
    process.exit(1);
  }
});

startServer();

module.exports = app;
