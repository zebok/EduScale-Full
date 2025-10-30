import React from "react";

export default function EnrollmentHistoryModal({ visible, onClose, email, institucion, historyData = [] }) {
  if (!visible) return null;

  const modalStyle = {
    position: 'fixed',
    top: '10%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: 8,
    padding: 16,
    maxWidth: 400,
    width: '90%',
    boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
    zIndex: 1000,
  };

  const titleStyle = {
    margin: 0,
    marginBottom: 12,
    fontSize: 16,
  };

  const listStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    maxHeight: 300,
    overflowY: 'auto'
  };

  const liStyle = {
    border: '1px solid #eee',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    background: '#fafafa'
  };

  const footerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 12
  };

  return (
    <div style={modalStyle} role="dialog" aria-modal="true">
      <h3 style={titleStyle}>Historial de {email} ({institucion})</h3>

      {Array.isArray(historyData) && historyData.length === 0 ? (
        <div style={{ padding: 8, color: '#666' }}>No hay historial todavía</div>
      ) : (
        <ul style={listStyle}>
          {historyData.map((h, idx) => (
            <li key={idx} style={liStyle}>
              <div><strong>Estado:</strong> {h.estado ?? (h.estado_actual ?? '-')}</div>
              <div><strong>Nota:</strong> {h.audit_note ? h.audit_note : '(sin nota)'}</div>
              <div><strong>Matrícula:</strong> {h.matricula_nro ?? '-'}</div>
              <div><strong>Fecha:</strong> {h.timestamp ? new Date(h.timestamp).toLocaleString() : '-'}</div>
            </li>
          ))}
        </ul>
      )}

      <div style={footerStyle}>
        <button onClick={onClose} style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', background: '#fff' }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
