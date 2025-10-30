const EnrollmentRepository = require('../repositories/EnrollmentRepository');
const TenantConfig = require('../models/TenantConfig');

/**
 * EnrollmentService
 * Business logic for enrollment operations
 */
class EnrollmentService {
  /**
   * Create enrollment from prospection data (Redis → Cassandra)
   * @param {Object} prospectionData - Data from Redis prospection
   * @returns {Promise<Object>} Created enrollment
   */
  async createEnrollmentFromProspection(prospectionData) {
    const {
      nombreCompleto,
      email,
      institucionId,
      carreraId,
      timestamp,
      source = 'web'
    } = prospectionData;

    // Get institution and career details from MongoDB
    const institution = await TenantConfig.findOne({ institution_id: institucionId });
    if (!institution) {
      throw new Error(`Institution not found: ${institucionId}`);
    }

    const career = institution.careers.find(c => c.career_id === carreraId);
    if (!career) {
      throw new Error(`Career not found: ${carreraId} in ${institucionId}`);
    }

    // Check if enrollment already exists
    const exists = await EnrollmentRepository.exists(institucionId, email, carreraId);
    if (exists) {
      console.log(`⚠️  Enrollment already exists: ${email} - ${carreraId}`);
      return null; // Skip duplicates
    }

    // Prepare enrollment data
    const enrollmentData = {
      institution_id: institucionId,
      email: email,
      career_id: carreraId,
      nombre_completo: nombreCompleto,
      institution_name: institution.institution.name,
      career_name: career.name,
      career_faculty: career.faculty,
      academic_year: new Date().getFullYear(),
      enrollment_period: `${new Date().getFullYear()}-${Math.ceil((new Date().getMonth() + 1) / 6)}`,
      prospection_date: timestamp ? new Date(timestamp) : new Date(),
      prospection_source: source,
      enrollment_status: 'interesado', // Initial state from Redis
      document_status: 'pendiente',
      payment_status: 'pendiente',
      created_by: 'system_worker'
    };

    // Create enrollment in Cassandra
    const result = await EnrollmentRepository.create(enrollmentData);

    console.log(`✓ Enrollment created: ${email} → ${career.name} (${institution.institution.name})`);

    return result;
  }

  /**
   * Batch create enrollments from prospection data
   * @param {Array<Object>} prospectionBatch - Array of prospection data
   * @returns {Promise<Object>} Results summary
   */
  async batchCreateEnrollments(prospectionBatch) {
    const results = {
      total: prospectionBatch.length,
      created: 0,
      skipped: 0,
      errors: 0,
      errorDetails: []
    };

    for (const prospection of prospectionBatch) {
      try {
        const enrollment = await this.createEnrollmentFromProspection(prospection);
        if (enrollment) {
          results.created++;
        } else {
          results.skipped++;
        }
      } catch (error) {
        results.errors++;
        results.errorDetails.push({
          email: prospection.email,
          error: error.message
        });
        console.error(`❌ Error creating enrollment for ${prospection.email}:`, error.message);
      }
    }

    return results;
  }
}

module.exports = new EnrollmentService();
