import React, { useState } from 'react';

function Admission() {
  const [formData, setFormData] = useState({
    email: '',
    documentos: '',
    comentarios: '',
    estado: 'pendiente'
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [expedientes, setExpedientes] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/admission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          text: '✓ Expediente de admisión creado correctamente',
          type: 'success'
        });
        setFormData({ email: '', documentos: '', comentarios: '', estado: 'pendiente' });
      } else {
        setMessage({
          text: data.error || 'Error al crear el expediente',
          type: 'error'
        });
      }
    } catch (error) {
      setMessage({
        text: 'Error de conexión con el servidor',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExpedientes = async () => {
    try {
      const response = await fetch('/api/admission');
      const data = await response.json();
      setExpedientes(data.expedientes || []);
    } catch (error) {
      console.error('Error al obtener expedientes:', error);
    }
  };

  return (
    <div className="component-container">
      <h2>🍃 Fase B: Expediente de Admisión (MongoDB)</h2>
      <p>
        Esta fase utiliza <strong>MongoDB</strong> para almacenar expedientes de admisión con estructura flexible.
        Permite guardar documentos jerárquicos con información variable según cada postulante.
      </p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email del Postulante *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="ejemplo@email.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="documentos">Documentos Presentados</label>
          <textarea
            id="documentos"
            name="documentos"
            value={formData.documentos}
            onChange={handleChange}
            rows="3"
            placeholder="DNI, Certificado de estudios, etc."
          />
        </div>

        <div className="form-group">
          <label htmlFor="comentarios">Comentarios del Comité</label>
          <textarea
            id="comentarios"
            name="comentarios"
            value={formData.comentarios}
            onChange={handleChange}
            rows="4"
            placeholder="Observaciones y decisiones del comité de admisión"
          />
        </div>

        <div className="form-group">
          <label htmlFor="estado">Estado</label>
          <select
            id="estado"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_revision">En Revisión</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Expediente'}
        </button>
      </form>

      <button
        onClick={fetchExpedientes}
        className="btn"
        style={{ marginTop: '1rem', backgroundColor: '#28a745' }}
      >
        Ver Expedientes
      </button>

      {expedientes.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Expedientes Registrados</h3>
          {expedientes.map((exp, index) => (
            <div key={index} style={{
              padding: '1rem',
              marginTop: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              borderLeft: '4px solid #667eea'
            }}>
              <p><strong>Email:</strong> {exp.email}</p>
              <p><strong>Estado:</strong> {exp.estado}</p>
              <p><strong>Documentos:</strong> {exp.documentos || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <h4>💡 Sobre esta fase:</h4>
        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>Base de datos:</strong> MongoDB (documental)</li>
          <li><strong>Función:</strong> Gestión de expedientes de admisión</li>
          <li><strong>Características:</strong> Estructura flexible, documentos anidados, metadatos</li>
          <li><strong>Ventajas:</strong> Ideal para datos semi-estructurados y jerárquicos</li>
        </ul>
      </div>
    </div>
  );
}

export default Admission;
