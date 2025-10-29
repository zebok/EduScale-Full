const mongoose = require('mongoose');

const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://mongo:27017/eduscale';

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ MongoDB conectado correctamente');
  } catch (error) {
    console.error('❌ Error al conectar con MongoDB:', error);
    throw error;
  }
};

// Modelo de Expediente de Admisión
const expedienteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  documentos: {
    type: String,
    default: ''
  },
  comentarios: {
    type: String,
    default: ''
  },
  estado: {
    type: String,
    enum: ['pendiente', 'en_revision', 'aprobado', 'rechazado'],
    default: 'pendiente'
  },
  metadata: {
    fechaCreacion: {
      type: Date,
      default: Date.now
    },
    ultimaActualizacion: {
      type: Date,
      default: Date.now
    }
  },
  historial: [{
    accion: String,
    fecha: Date,
    usuario: String,
    detalles: String
  }]
}, { timestamps: true });

const Expediente = mongoose.model('Expediente', expedienteSchema);

module.exports = {
  connectMongoDB,
  mongoose,
  Expediente
};
