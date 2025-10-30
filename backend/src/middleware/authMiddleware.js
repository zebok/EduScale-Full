const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const redisConfig = require('../config/redis');

/**
 * Middleware para verificar autenticación
 * Prioriza Redis cache, fallback a MongoDB
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Token no proporcionado'
      });
    }

    // Extraer token (formato: "Bearer TOKEN")
    const token = authHeader.substring(7);

    // Verificar y decodificar token
    const decoded = verifyToken(token);

    // PASO 1: Intentar obtener sesión de Redis (rápido)
    const redisClient = redisConfig.redisClient;
    const sessionKey = `session:${decoded.userId}`;

    let sessionData = null;

    try {
      const cachedSession = await redisClient.get(sessionKey);
      if (cachedSession) {
        sessionData = JSON.parse(cachedSession);
        // Extender TTL en cada request (sliding expiration)
        await redisClient.expire(sessionKey, 3600);
      }
    } catch (redisError) {
      console.error('⚠️  Redis session lookup failed:', redisError);
      // Continue to MongoDB fallback
    }

    // PASO 2: Si no hay session en Redis, buscar en MongoDB
    if (!sessionData) {
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({
          error: 'No autorizado',
          message: 'Usuario no encontrado'
        });
      }

      if (!user.activo) {
        return res.status(401).json({
          error: 'No autorizado',
          message: 'Usuario inactivo'
        });
      }

      // Recrear sesión en Redis si no existía
      sessionData = {
        userId: user._id.toString(),
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        tenant_id: user.tenant_id,
        rol: user.rol,
        permisos: user.permisos
      };

      try {
        await redisClient.setEx(sessionKey, 3600, JSON.stringify(sessionData));
      } catch (redisError) {
        console.error('⚠️  Failed to recreate Redis session:', redisError);
      }
    }

    // Agregar usuario y tenant_id al request para uso en los endpoints
    req.user = {
      userId: sessionData.userId,
      email: sessionData.email,
      nombre: sessionData.nombre,
      apellido: sessionData.apellido,
      tenant_id: sessionData.tenant_id,
      rol: sessionData.rol,
      permisos: sessionData.permisos
    };

    console.log('✅ Auth middleware: User authenticated', {
      email: req.user.email,
      tenant_id: req.user.tenant_id,
      rol: req.user.rol
    });

    next();
  } catch (error) {
    console.error('Error en authMiddleware:', error);
    return res.status(401).json({
      error: 'No autorizado',
      message: error.message || 'Token inválido'
    });
  }
};

module.exports = authMiddleware;
