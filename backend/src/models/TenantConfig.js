const mongoose = require('mongoose');

// English-based schema aligned with the requested external format
const tenantConfigSchema = new mongoose.Schema({
  institution_id: { type: String, required: true, unique: true, index: true },
  status: { type: String, default: 'active' },

  institution: {
    name: { type: String, required: true },
    short_name: { type: String, required: true },
    type: { type: String, required: true },
    country: String,
    city: String,
    province: String,
    founded_year: Number
  },

  contact: {
    address: String,
    email: String,
    phone: String,
    website: String
  },

  domain: String,

  branding: {
    theme: {
      primary_color: { type: String, default: '#667eea' },
      secondary_color: { type: String, default: '#764ba2' },
      accent_color: { type: String, default: '#E63946' },
      font_family: { type: String, default: 'Montserrat' }
    },
    logo_url: String
  },

  texts: {
    welcome: {
      title: String,
      subtitle: String,
      description: String,
      footer_text: String
    }
  },

  settings: {
    admission_fee: { type: Number, default: 0 },
    enable_scholarship: { type: Boolean, default: false },
    max_applicants_per_year: Number,
    require_entrance_exam: { type: Boolean, default: false },
    academic_year_start: String,
    enrollment_periods: [{ name: String, start: String, end: String }]
  },

  careers: [{
    career_id: String,
    code: String,
    name: String,
    category: String,
    faculty: String,
    degree_type: String,
    degree_title: String,
    duration_years: Number,
    modality: String,
    shift: [String],
    cupo_anual: Number,
    description: String,
    requirements: {
      cbc_required: Boolean,
      entrance_exam: Boolean,
      min_high_school_avg: Number,
      interview_required: Boolean,
      portfolio_required: Boolean
    },
    scholarship_available: Boolean,
    scholarship_percentage: [Number],
    contact: { email: String, phone: String }
  }],

  enrollment_workflow: {
    stages: [{
      stage_id: { type: Number, required: true },
      name: { type: String, required: true },
      status_key: { type: String, required: true },
      description: String,
      color: String,
      icon: String,
      order: Number,
      is_initial: { type: Boolean, default: false },
      is_final: { type: Boolean, default: false },
      requires_approval: { type: Boolean, default: false },
      requires_documents: { type: Boolean, default: false },
      requires_payment: { type: Boolean, default: false },
      auto_advance: { type: Boolean, default: false },
      next_stages: [Number],
      allowed_roles: [String]
    }],
    default_initial_stage: Number
  },

  dashboard: {
    tabs_enabled: [{
      id: { type: String, enum: ['prospection', 'admission', 'enrollment', 'relations'] },
      name: String,
      phase: String,
      source: { type: String, enum: ['redis', 'mongodb', 'cassandra', 'neo4j'] },
      enabled: { type: Boolean, default: true },
      icon: String,
      order: Number,
      endpoint: String
    }]
  }
}, { timestamps: true });

const TenantConfig = mongoose.model('TenantConfig', tenantConfigSchema);

module.exports = TenantConfig;
