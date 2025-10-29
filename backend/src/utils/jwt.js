const jwt = require('jsonwebtoken');

// Secret key - En producción debe estar en variable de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'eduscale_secret_key_change_in_production';
const JWT_EXPIRES_IN = '7d'; // Token expira en 7 días

/**
 * Genera un token JWT
 * @param {Object} payload - Datos a incluir en el token
 * @returns {String} Token JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * Verifica y decodifica un token JWT
 * @param {String} token - Token a verificar
 * @returns {Object} Payload decodificado
 * @throws {Error} Si el token es inválido
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET
};
