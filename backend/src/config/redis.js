const redis = require('redis');

let redisClient;

const connectRedis = async () => {
  try {
    const redisHost = process.env.REDIS_HOST || 'redis';
    const redisPort = process.env.REDIS_PORT || 6379;

    redisClient = redis.createClient({
      socket: {
        host: redisHost,
        port: redisPort
      }
    });

    redisClient.on('error', (err) => {
      console.error('❌ Error de Redis:', err);
    });

    redisClient.on('connect', () => {
      console.log('✓ Redis conectado correctamente');
    });

    await redisClient.connect();
  } catch (error) {
    console.error('❌ Error al conectar con Redis:', error);
    throw error;
  }
};

module.exports = {
  connectRedis,
  get redisClient() {
    return redisClient;
  }
};
