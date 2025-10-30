const { executeQuery } = require('../config/cassandra');
const cassandra = require('cassandra-driver');

/**
 * EnrollmentRepository
 * Handles all Cassandra operations for enrollments table
 */
class EnrollmentRepository {
  /**
   * Create a new enrollment
   */
  async create(enrollmentData) {
    const query = `
      INSERT INTO enrollments (
        institution_id, email, career_id, enrollment_id,
        nombre_completo, documento, tipo_documento, telefono, fecha_nacimiento,
        institution_name, career_name, career_faculty,
        academic_year, enrollment_period,
        prospection_date, prospection_source,
        enrollment_status, enrollment_date,
        document_status, payment_status,
        created_at, updated_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      enrollmentData.institution_id,
      enrollmentData.email,
      enrollmentData.career_id,
      cassandra.types.Uuid.random(),
      enrollmentData.nombre_completo,
      enrollmentData.documento || null,
      enrollmentData.tipo_documento || 'DNI',
      enrollmentData.telefono || null,
      enrollmentData.fecha_nacimiento || null,
      enrollmentData.institution_name,
      enrollmentData.career_name,
      enrollmentData.career_faculty || null,
      enrollmentData.academic_year || new Date().getFullYear(),
      enrollmentData.enrollment_period || `${new Date().getFullYear()}-1`,
      enrollmentData.prospection_date || new Date(),
      enrollmentData.prospection_source || 'web',
      enrollmentData.enrollment_status || 'pendiente',
      new Date(),
      enrollmentData.document_status || 'pendiente',
      enrollmentData.payment_status || 'pendiente',
      new Date(),
      new Date(),
      enrollmentData.created_by || 'system'
    ];

    await executeQuery(query, params, { prepare: true });

    return {
      institution_id: enrollmentData.institution_id,
      email: enrollmentData.email,
      career_id: enrollmentData.career_id
    };
  }

  /**
   * Find all enrollments for an institution
   */
  async findByInstitution(institutionId) {
    const query = 'SELECT * FROM enrollments WHERE institution_id = ?';
    const result = await executeQuery(query, [institutionId], { prepare: true });
    return result.rows;
  }

  /**
   * Find enrollments for an institution with status filter
   */
  async findByInstitutionAndStatus(institutionId, status) {
    const query = 'SELECT * FROM enrollments_by_status WHERE institution_id = ? AND enrollment_status = ?';
    const result = await executeQuery(query, [institutionId, status], { prepare: true });
    return result.rows;
  }

  /**
   * Find enrollments for an institution by year
   */
  async findByInstitutionAndYear(institutionId, academicYear) {
    const query = 'SELECT * FROM enrollments_by_year WHERE institution_id = ? AND academic_year = ?';
    const result = await executeQuery(query, [institutionId, academicYear], { prepare: true });
    return result.rows;
  }

  /**
   * Find enrollments for a specific student in an institution
   */
  async findByInstitutionAndEmail(institutionId, email) {
    const query = 'SELECT * FROM enrollments WHERE institution_id = ? AND email = ?';
    const result = await executeQuery(query, [institutionId, email], { prepare: true });
    return result.rows;
  }

  /**
   * Find a specific enrollment
   */
  async findOne(institutionId, email, careerId) {
    const query = 'SELECT * FROM enrollments WHERE institution_id = ? AND email = ? AND career_id = ?';
    const result = await executeQuery(query, [institutionId, email, careerId], { prepare: true });
    return result.rows[0] || null;
  }

  /**
   * Check if enrollment already exists
   */
  async exists(institutionId, email, careerId) {
    const enrollment = await this.findOne(institutionId, email, careerId);
    return !!enrollment;
  }

  /**
   * Update enrollment status
   */
  async updateStatus(institutionId, email, careerId, newStatus, updatedBy) {
    const query = `
      UPDATE enrollments
      SET enrollment_status = ?,
          updated_at = ?,
          updated_by = ?
      WHERE institution_id = ? AND email = ? AND career_id = ?
    `;

    const params = [newStatus, new Date(), updatedBy, institutionId, email, careerId];
    await executeQuery(query, params, { prepare: true });

    return { institutionId, email, careerId, newStatus };
  }

  /**
   * Update admission status and notes
   */
  async updateAdmission(institutionId, email, careerId, admissionData, updatedBy) {
    const query = `
      UPDATE enrollments
      SET admission_status = ?,
          admission_date = ?,
          admission_score = ?,
          admission_notes = ?,
          updated_at = ?,
          updated_by = ?
      WHERE institution_id = ? AND email = ? AND career_id = ?
    `;

    const params = [
      admissionData.status,
      admissionData.date || new Date(),
      admissionData.score || null,
      admissionData.notes || null,
      new Date(),
      updatedBy,
      institutionId,
      email,
      careerId
    ];

    await executeQuery(query, params, { prepare: true });
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(institutionId, email, careerId, documentStatus, updatedBy) {
    const query = `
      UPDATE enrollments
      SET document_status = ?,
          documents_verified_date = ?,
          updated_at = ?,
          updated_by = ?
      WHERE institution_id = ? AND email = ? AND career_id = ?
    `;

    const params = [
      documentStatus,
      documentStatus === 'verificado' ? new Date() : null,
      new Date(),
      updatedBy,
      institutionId,
      email,
      careerId
    ];

    await executeQuery(query, params, { prepare: true });
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(institutionId, email, careerId, paymentData, updatedBy) {
    const query = `
      UPDATE enrollments
      SET payment_status = ?,
          payment_amount = ?,
          payment_currency = ?,
          payment_date = ?,
          payment_method = ?,
          updated_at = ?,
          updated_by = ?
      WHERE institution_id = ? AND email = ? AND career_id = ?
    `;

    const params = [
      paymentData.status,
      paymentData.amount || null,
      paymentData.currency || 'ARS',
      paymentData.date || new Date(),
      paymentData.method || null,
      new Date(),
      updatedBy,
      institutionId,
      email,
      careerId
    ];

    await executeQuery(query, params, { prepare: true });
  }

  /**
   * Get all institutions with enrollment counts (for super_admin)
   */
  async getEnrollmentStats() {
    const query = 'SELECT institution_id, COUNT(*) as count FROM enrollments GROUP BY institution_id';
    const result = await executeQuery(query);
    return result.rows;
  }

  /**
   * Delete enrollment (soft delete - update status to 'cancelado')
   */
  async cancel(institutionId, email, careerId, updatedBy) {
    return this.updateStatus(institutionId, email, careerId, 'cancelado', updatedBy);
  }
}

module.exports = new EnrollmentRepository();
