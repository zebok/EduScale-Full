const mongoose = require('mongoose');

const tenantConfigSchema = new mongoose.Schema({
  tenant_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  institucion: {
    nombre_completo: { type: String, required: true },
    nombre_corto: { type: String, required: true },
    tipo: {
      type: String,
      enum: ['universidad_publica', 'universidad_privada', 'instituto', 'otro'],
      required: true
    },
    pais: String,
    ciudad: String,
    fundacion: Number
  },
  branding: {
    colores: {
      primario: { type: String, default: '#667eea' },
      secundario: { type: String, default: '#764ba2' },
      acento: { type: String, default: '#E63946' },
      fondo: { type: String, default: '#FFFFFF' },
      texto: { type: String, default: '#1A1A1A' },
      exito: { type: String, default: '#06D6A0' },
      error: { type: String, default: '#EF476F' },
      advertencia: { type: String, default: '#FFC857' }
    },
    imagenes: {
      logo_principal: String,
      logo_pequeño: String,
      favicon: String,
      banner_principal: String,
      fondo_login: String
    },
    fuentes: {
      principal: { type: String, default: 'Montserrat' },
      secundaria: { type: String, default: 'Open Sans' },
      titulos: { type: String, default: 'Poppins' }
    }
  },
  textos: {
    bienvenida: {
      titulo: String,
      subtitulo: String,
      descripcion: String,
      llamado_accion: String
    },
    fase_prospeccion: {
      titulo: String,
      descripcion: String,
      boton_submit: String,
      mensaje_exito: String,
      mensaje_duplicado: String
    },
    fase_admision: {
      titulo: String,
      descripcion: String,
      boton_submit: String,
      mensaje_exito: String
    },
    fase_inscripcion: {
      titulo: String,
      descripcion: String,
      boton_submit: String,
      mensaje_exito: String
    },
    footer: {
      texto: String,
      enlaces_legales: [{
        texto: String,
        url: String
      }]
    }
  },
  dashboard: {
    tabs_habilitadas: [{
      id: {
        type: String,
        enum: ['prospectos', 'solicitudes', 'inscritos', 'relaciones']
      },
      nombre: String,
      fase: String,
      fuente: {
        type: String,
        enum: ['redis', 'mongodb', 'cassandra', 'neo4j']
      },
      habilitada: { type: Boolean, default: true },
      icono: String,
      orden: Number,
      endpoint: String
    }]
  },
  configuracion_fases: {
    fase_a: {
      habilitada: { type: Boolean, default: true },
      obligatoria: { type: Boolean, default: false },
      campos_requeridos: [String],
      campos_opcionales: [String],
      enviar_email_confirmacion: { type: Boolean, default: true },
      ttl_redis_dias: { type: Number, default: 30 }
    },
    fase_b: {
      habilitada: { type: Boolean, default: true },
      obligatoria: { type: Boolean, default: true },
      campos_requeridos: [String],
      documentos_requeridos: [{
        tipo: String,
        descripcion: String,
        formato: [String],
        tamaño_max_mb: Number
      }],
      requiere_entrevista: { type: Boolean, default: false },
      requiere_aprobacion_comite: { type: Boolean, default: true },
      tiempo_evaluacion_dias: { type: Number, default: 15 }
    },
    fase_c: {
      habilitada: { type: Boolean, default: true },
      requiere_pago: { type: Boolean, default: false },
      monto_matricula: { type: Number, default: 0 },
      moneda: { type: String, default: 'ARS' },
      plazo_confirmacion_dias: { type: Number, default: 7 }
    }
  },
  programas: [{
    id: String,
    nombre: String,
    facultad: String,
    duracion_años: Number,
    modalidad: {
      type: String,
      enum: ['presencial', 'virtual', 'hibrida']
    },
    cupos_disponibles: Number,
    descripcion: String
  }],
  contacto: {
    emails: {
      admisiones: String,
      soporte: String,
      info_general: String
    },
    telefonos: {
      principal: String,
      admisiones: String,
      whatsapp: String
    },
    direccion: {
      calle: String,
      ciudad: String,
      codigo_postal: String,
      pais: String
    },
    redes_sociales: {
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String,
      youtube: String
    },
    sitio_web: String
  },
  estado: {
    activo: { type: Boolean, default: true },
    en_mantenimiento: { type: Boolean, default: false },
    mensaje_mantenimiento: String
  }
}, {
  timestamps: true
});

const TenantConfig = mongoose.model('TenantConfig', tenantConfigSchema);

module.exports = TenantConfig;
