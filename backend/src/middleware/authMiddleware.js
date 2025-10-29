const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Middleware para verificar autenticación
 * Extrae el token del header Authorization y verifica su validez
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

    // Buscar usuario en la base de datos
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

    // Agregar usuario y tenant_id al request para uso en los endpoints
    req.user = {
      userId: user._id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      tenant_id: user.tenant_id,
      rol: user.rol,
      permisos: user.permisos
    };

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
