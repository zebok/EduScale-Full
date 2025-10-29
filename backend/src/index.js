const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import database configurations
const { connectMongoDB, mongoose } = require('./config/mongodb');
const { connectCassandra, cassandraClient } = require('./config/cassandra');
const { connectRedis, redisClient } = require('./config/redis');
const { connectNeo4j, neo4jDriver } = require('./config/neo4j');

// Import routes
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
    if (mongoose.connection.readyState === 1) {
      status.mongodb = true;
    }
  } catch (error) {
    console.error('MongoDB health check failed:', error);
  }

  try {
    // Check Cassandra
    if (cassandraClient && cassandraClient.getState() && cassandraClient.getState().getConnectedHosts().length > 0) {
      status.cassandra = true;
    }
  } catch (error) {
    console.error('Cassandra health check failed:', error);
  }

  try {
    // Check Redis
    if (redisClient && redisClient.isOpen) {
      status.redis = true;
    }
  } catch (error) {
    console.error('Redis health check failed:', error);
  }

  try {
    // Check Neo4j
    const session = neo4jDriver.session();
    await session.run('RETURN 1');
    await session.close();
    status.neo4j = true;
  } catch (error) {
    console.error('Neo4j health check failed:', error);
  }

  res.json(status);
});

// Routes
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
    await connectMongoDB();
    await connectCassandra();
    await connectRedis();
    await connectNeo4j();

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
    await mongoose.connection.close();
    await cassandraClient.shutdown();
    await redisClient.quit();
    await neo4jDriver.close();
    console.log('✓ Conexiones cerradas correctamente');
    process.exit(0);
  } catch (error) {
    console.error('Error al cerrar conexiones:', error);
    process.exit(1);
  }
});

startServer();

module.exports = app;
