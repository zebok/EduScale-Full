const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  tenant_id: {
    type: String,
    required: true,
    index: true
  },
  rol: {
    type: String,
    enum: ['admin', 'super_admin', 'viewer'],
    default: 'admin'
  },
  permisos: {
    type: [String],
    default: ['ver_solicitudes', 'aprobar', 'rechazar']
  },
  activo: {
    type: Boolean,
    default: true
  },
  ultimo_login: {
    type: Date
  }
}, {
  timestamps: true
});

// Índice compuesto para búsquedas eficientes
userSchema.index({ tenant_id: 1, email: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
