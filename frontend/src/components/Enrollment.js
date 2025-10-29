import React, { useState } from 'react';

function Enrollment() {
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    apellido: '',
    programa: '',
    institucion: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [inscripciones, setInscripciones] = useState([]);

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
      const response = await fetch('/api/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          text: '✓ Inscripción registrada correctamente (inmutable)',
          type: 'success'
        });
        setFormData({ email: '', nombre: '', apellido: '', programa: '', institucion: '' });
      } else {
        setMessage({
          text: data.error || 'Error al registrar la inscripción',
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

  const fetchInscripciones = async () => {
    try {
      const response = await fetch('/api/enrollment');
      const data = await response.json();
      setInscripciones(data.inscripciones || []);
    } catch (error) {
      console.error('Error al obtener inscripciones:', error);
    }
  };

  return (
    <div className="component-container">
      <h2>📊 Fase C: Registro de Inscripción (Cassandra)</h2>
      <p>
        Esta fase utiliza <strong>Cassandra</strong> para almacenar inscripciones de forma inmutable.
        Ideal para alta escritura concurrente y registros que no se modifican (auditoría).
      </p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="institucion">Institución *</label>
          <input
            type="text"
            id="institucion"
            name="institucion"
            value={formData.institucion}
            onChange={handleChange}
            required
            placeholder="Universidad XYZ"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
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
          <label htmlFor="nombre">Nombre *</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            placeholder="Tu nombre"
          />
        </div>

        <div className="form-group">
          <label htmlFor="apellido">Apellido *</label>
          <input
            type="text"
            id="apellido"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
            required
            placeholder="Tu apellido"
          />
        </div>

        <div className="form-group">
          <label htmlFor="programa">Programa *</label>
          <input
            type="text"
            id="programa"
            name="programa"
            value={formData.programa}
            onChange={handleChange}
            required
            placeholder="Ingeniería en Sistemas"
          />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Inscripción'}
        </button>
      </form>

      <button
        onClick={fetchInscripciones}
        className="btn"
        style={{ marginTop: '1rem', backgroundColor: '#28a745' }}
      >
        Ver Inscripciones
      </button>

      {inscripciones.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Inscripciones Registradas</h3>
          {inscripciones.map((insc, index) => (
            <div key={index} style={{
              padding: '1rem',
              marginTop: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              borderLeft: '4px solid #667eea'
            }}>
              <p><strong>Institución:</strong> {insc.institucion}</p>
              <p><strong>Email:</strong> {insc.email}</p>
              <p><strong>Nombre:</strong> {insc.nombre} {insc.apellido}</p>
              <p><strong>Programa:</strong> {insc.programa}</p>
              <p><strong>Fecha:</strong> {new Date(insc.fecha_inscripcion).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <h4>💡 Sobre esta fase:</h4>
        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>Base de datos:</strong> Cassandra (columnar/tabular)</li>
          <li><strong>Función:</strong> Registro inmutable de inscripciones</li>
          <li><strong>Características:</strong> Alta escritura, particionamiento por institución, inmutabilidad</li>
          <li><strong>Ventajas:</strong> Escalabilidad masiva, tolerancia a fallos, ideal para auditoría</li>
        </ul>
      </div>
    </div>
  );
}

export default Enrollment;
