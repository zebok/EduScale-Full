import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

/**
 * Enrollment & Workflow Service
 * Handles all API calls related to enrollments and workflow management
 */
class EnrollmentService {
  /**
   * Get workflow configuration for an institution
   */
  async getWorkflow(institutionId) {
    const response = await axios.get(`${API_URL}/api/enrollment/workflow/${institutionId}`);
    return response.data;
  }

  /**
   * Get enrollment statistics with stage breakdown
   */
  async getStats(institutionId, academicYear = null) {
    const params = academicYear ? { academic_year: academicYear } : {};
    const response = await axios.get(`${API_URL}/api/enrollment/stats/${institutionId}`, { params });
    return response.data;
  }

  /**
   * Get all enrollments for current user (filtered by role)
   */
  async getEnrollments(filters = {}) {
    const response = await axios.get(`${API_URL}/api/enrollment`, { params: filters });
    return response.data;
  }

  /**
   * Get specific enrollment details
   */
  async getEnrollment(institutionId, email, careerId) {
    const response = await axios.get(`${API_URL}/api/enrollment/${institutionId}/${email}/${careerId}`);
    return response.data;
  }

  /**
   * Advance enrollment to next stage
   */
  async advanceStage(institutionId, email, careerId, targetStageId, notes = null) {
    const response = await axios.patch(
      `${API_URL}/api/enrollment/${institutionId}/${email}/${careerId}/advance`,
      { target_stage_id: targetStageId, notes }
    );
    return response.data;
  }

  /**
   * Update enrollment status (legacy method)
   */
  async updateStatus(institutionId, email, careerId, status) {
    const response = await axios.patch(
      `${API_URL}/api/enrollment/${institutionId}/${email}/${careerId}/status`,
      { status }
    );
    return response.data;
  }

  /**
   * Update document status
   */
  async updateDocuments(institutionId, email, careerId, status) {
    const response = await axios.patch(
      `${API_URL}/api/enrollment/${institutionId}/${email}/${careerId}/documents`,
      { status }
    );
    return response.data;
  }

  /**
   * Update payment status
   */
  async updatePayment(institutionId, email, careerId, paymentData) {
    const response = await axios.patch(
      `${API_URL}/api/enrollment/${institutionId}/${email}/${careerId}/payment`,
      paymentData
    );
    return response.data;
  }

  /**
   * Create new enrollment
   */
  async createEnrollment(enrollmentData) {
    const response = await axios.post(`${API_URL}/api/enrollment`, enrollmentData);
    return response.data;
  }
}

export default new EnrollmentService();
