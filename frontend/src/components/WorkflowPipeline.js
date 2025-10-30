import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import enrollmentService from '../services/enrollmentService';
import EnrollmentCard from './EnrollmentCard';
import './WorkflowPipeline.css';

const WorkflowPipeline = () => {
  const { user } = useAuth();
  const [workflow, setWorkflow] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [activeStageId, setActiveStageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      setError(null);

      // Load workflow configuration
      const workflowData = await enrollmentService.getWorkflow(user.tenant_id);
      setWorkflow(workflowData.workflow);

      // Load stats
      const statsData = await enrollmentService.getStats(user.tenant_id);
      setStats(statsData.stats);

      // Load all enrollments
      const enrollmentsData = await enrollmentService.getEnrollments();
      setEnrollments(enrollmentsData.enrollments || []);

      // Set first stage as active by default
      if (workflowData.workflow?.stages?.length > 0) {
        setActiveStageId(workflowData.workflow.stages[0].stage_id);
      }

    } catch (err) {
      console.error('Error loading workflow data:', err);
      setError(err.response?.data?.error || 'Error al cargar datos del workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleStageAdvance = async (enrollment, targetStageId, notes) => {
    try {
      await enrollmentService.advanceStage(
        enrollment.institution_id,
        enrollment.email,
        enrollment.career_id,
        targetStageId,
        notes
      );

      // Reload data after successful transition
      await loadData();

      return { success: true };
    } catch (err) {
      console.error('Error advancing stage:', err);
      return {
        success: false,
        error: err.response?.data?.error || 'Error al avanzar etapa'
      };
    }
  };

  const getEnrollmentsByStage = (stageStatusKey) => {
    return enrollments.filter(e => e.enrollment_status === stageStatusKey);
  };

  const getNextStages = (currentStageId) => {
    const currentStage = workflow?.stages.find(s => s.stage_id === currentStageId);
    if (!currentStage) return [];

    return currentStage.next_stages.map(stageId => {
      return workflow.stages.find(s => s.stage_id === stageId);
    }).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="workflow-loading">
        <div className="spinner"></div>
        <p>Cargando workflow...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workflow-error">
        <p>⚠️ {error}</p>
        <button onClick={loadData} className="retry-button">Reintentar</button>
      </div>
    );
  }

  if (!workflow || !workflow.stages || workflow.stages.length === 0) {
    return (
      <div className="workflow-empty">
        <p>No hay workflow configurado para esta institución.</p>
      </div>
    );
  }

  const activeStage = workflow.stages.find(s => s.stage_id === activeStageId);
  const enrollmentsInStage = activeStage ? getEnrollmentsByStage(activeStage.status_key) : [];
  const nextStages = activeStage ? getNextStages(activeStage.stage_id) : [];

  return (
    <div className="workflow-pipeline">
      {/* Header with stats */}
      <div className="workflow-header">
        <h2>Pipeline de Inscripciones</h2>
        <div className="workflow-stats-summary">
          <div className="stat-item">
            <span className="stat-value">{stats?.total || 0}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      </div>

      {/* Stage Tabs */}
      <div className="workflow-tabs">
        {workflow.stages
          .sort((a, b) => a.order - b.order)
          .map(stage => {
            const stageCount = stats?.by_stage?.[stage.status_key]?.count || 0;
            const isActive = stage.stage_id === activeStageId;

            return (
              <button
                key={stage.stage_id}
                className={`workflow-tab ${isActive ? 'active' : ''} ${stage.is_final ? 'final' : ''}`}
                style={{
                  '--stage-color': stage.color || '#666',
                  borderColor: isActive ? stage.color : 'transparent'
                }}
                onClick={() => setActiveStageId(stage.stage_id)}
              >
                <div className="tab-info">
                  <span className="tab-name">{stage.name}</span>
                  <span className="tab-count">{stageCount}</span>
                </div>
              </button>
            );
          })}
      </div>

      {/* Active Stage Content */}
      {activeStage && (
        <div className="workflow-stage-content">
          <div className="stage-header" style={{ backgroundColor: activeStage.color + '20', borderLeft: `4px solid ${activeStage.color}` }}>
            <div className="stage-title">
              <h3>{activeStage.name}</h3>
              <span className="stage-badge">{enrollmentsInStage.length} inscripciones</span>
            </div>
            <p className="stage-description">{activeStage.description}</p>

            {/* Stage requirements */}
            {(activeStage.requires_approval || activeStage.requires_documents || activeStage.requires_payment) && (
              <div className="stage-requirements">
                <strong>Requisitos:</strong>
                {activeStage.requires_approval && <span className="req-badge">✓ Aprobación</span>}
                {activeStage.requires_documents && <span className="req-badge">📄 Documentos</span>}
                {activeStage.requires_payment && <span className="req-badge">💳 Pago</span>}
              </div>
            )}
          </div>

          {/* Enrollments in this stage */}
          <div className="stage-enrollments">
            {enrollmentsInStage.length === 0 ? (
              <div className="empty-stage">
                <p>No hay inscripciones en esta etapa</p>
              </div>
            ) : (
              enrollmentsInStage.map(enrollment => (
                <EnrollmentCard
                  key={`${enrollment.email}-${enrollment.career_id}`}
                  enrollment={enrollment}
                  currentStage={activeStage}
                  nextStages={nextStages}
                  onAdvance={handleStageAdvance}
                  userRole={user?.rol}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowPipeline;
