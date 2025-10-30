import React, { useState } from 'react';
import './EnrollmentCard.css';

const EnrollmentCard = ({ enrollment, currentStage, nextStages, onAdvance, userRole }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [selectedNextStage, setSelectedNextStage] = useState(null);
  const [notes, setNotes] = useState('');
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState(null);

  const canAdvance = nextStages.length > 0 && !currentStage.is_final;

  const handleAdvanceClick = () => {
    if (nextStages.length === 1) {
      // If only one next stage, select it automatically
      setSelectedNextStage(nextStages[0]);
    }
    setShowAdvanceModal(true);
  };

  const handleConfirmAdvance = async () => {
    if (!selectedNextStage) {
      setAdvanceError('Selecciona una etapa de destino');
      return;
    }

    setIsAdvancing(true);
    setAdvanceError(null);

    const result = await onAdvance(enrollment, selectedNextStage.stage_id, notes || null);

    if (result.success) {
      // Reset and close modal
      setShowAdvanceModal(false);
      setSelectedNextStage(null);
      setNotes('');
    } else {
      setAdvanceError(result.error || 'Error al avanzar etapa');
    }

    setIsAdvancing(false);
  };

  const handleCancelAdvance = () => {
    setShowAdvanceModal(false);
    setSelectedNextStage(null);
    setNotes('');
    setAdvanceError(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="enrollment-card">
        <div className="card-main" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="card-header">
            <div className="student-info">
              <h4>{enrollment.nombre_completo}</h4>
              <p className="student-email">{enrollment.email}</p>
            </div>
            <button className="expand-button">
              {isExpanded ? '▼' : '▶'}
            </button>
          </div>

          <div className="card-info">
            <div className="info-item">
              <span className="info-label">Carrera:</span>
              <span className="info-value">{enrollment.career_name || enrollment.career_id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Fecha:</span>
              <span className="info-value">{formatDate(enrollment.created_at)}</span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="card-details">
            <div className="details-grid">
              <div className="detail-item">
                <strong>ID Inscripción:</strong>
                <span>{enrollment.enrollment_id || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <strong>Institución:</strong>
                <span>{enrollment.institution_id}</span>
              </div>
              <div className="detail-item">
                <strong>Estado Admisión:</strong>
                <span className={`status-badge ${enrollment.admission_status || 'pendiente'}`}>
                  {enrollment.admission_status || 'pendiente'}
                </span>
              </div>
              <div className="detail-item">
                <strong>Documentos:</strong>
                <span className={`status-badge ${enrollment.document_status || 'pendiente'}`}>
                  {enrollment.document_status || 'pendiente'}
                </span>
              </div>
              <div className="detail-item">
                <strong>Pago:</strong>
                <span className={`status-badge ${enrollment.payment_status || 'pendiente'}`}>
                  {enrollment.payment_status || 'pendiente'}
                </span>
              </div>
              <div className="detail-item">
                <strong>Última actualización:</strong>
                <span>{formatDate(enrollment.updated_at)}</span>
              </div>
            </div>

            {canAdvance && (
              <div className="card-actions">
                <button
                  className="advance-button"
                  onClick={handleAdvanceClick}
                  style={{ backgroundColor: currentStage.color }}
                >
                  Avanzar a siguiente etapa →
                </button>
              </div>
            )}

            {currentStage.is_final && (
              <div className="final-stage-notice">
                ✓ Esta inscripción está en una etapa final
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advance Modal */}
      {showAdvanceModal && (
        <div className="modal-overlay" onClick={handleCancelAdvance}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Avanzar Inscripción</h3>
              <button className="modal-close" onClick={handleCancelAdvance}>×</button>
            </div>

            <div className="modal-body">
              <div className="student-summary">
                <p><strong>{enrollment.nombre_completo}</strong></p>
                <p>{enrollment.email} - {enrollment.career_name}</p>
              </div>

              <div className="stage-transition">
                <div className="transition-from">
                  <span style={{ color: currentStage.color }}>
                    {currentStage.icon} {currentStage.name}
                  </span>
                </div>
                <div className="transition-arrow">→</div>
                <div className="transition-to">
                  {nextStages.length === 1 ? (
                    <span style={{ color: nextStages[0].color }}>
                      {nextStages[0].icon} {nextStages[0].name}
                    </span>
                  ) : (
                    <div className="next-stages-selector">
                      <label>Selecciona la etapa destino:</label>
                      {nextStages.map(stage => (
                        <button
                          key={stage.stage_id}
                          className={`stage-option ${selectedNextStage?.stage_id === stage.stage_id ? 'selected' : ''}`}
                          style={{
                            borderColor: selectedNextStage?.stage_id === stage.stage_id ? stage.color : '#ddd',
                            backgroundColor: selectedNextStage?.stage_id === stage.stage_id ? stage.color + '20' : 'white'
                          }}
                          onClick={() => setSelectedNextStage(stage)}
                        >
                          <span>{stage.icon} {stage.name}</span>
                          <p>{stage.description}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="notes-section">
                <label>Notas (opcional):</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agrega comentarios sobre esta transición..."
                  rows="3"
                />
              </div>

              {advanceError && (
                <div className="modal-error">
                  ⚠️ {advanceError}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="button-secondary"
                onClick={handleCancelAdvance}
                disabled={isAdvancing}
              >
                Cancelar
              </button>
              <button
                className="button-primary"
                onClick={handleConfirmAdvance}
                disabled={isAdvancing || !selectedNextStage}
              >
                {isAdvancing ? 'Avanzando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnrollmentCard;
