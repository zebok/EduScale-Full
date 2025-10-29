import React, { useState } from 'react';

function Relations() {
  const [relationData, setRelationData] = useState({
    email_estudiante: '',
    institucion: '',
    programa: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [relaciones, setRelaciones] = useState([]);

  const handleChange = (e) => {
    setRelationData({
      ...relationData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/relations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(relationData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          text: '✓ Relación creada correctamente',
          type: 'success'
        });
        setRelationData({ email_estudiante: '', institucion: '', programa: '' });
      } else {
        setMessage({
          text: data.error || 'Error al crear la relación',
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

  const fetchRelaciones = async () => {
    if (!relationData.email_estudiante) {
      setMessage({
        text: 'Por favor ingresa un email para buscar relaciones',
        type: 'info'
      });
      return;
    }

    try {
      const response = await fetch(`/api/relations/${relationData.email_estudiante}`);
      const data = await response.json();
      setRelaciones(data.relaciones || []);
    } catch (error) {
      console.error('Error al obtener relaciones:', error);
    }
  };

  return (
    <div className="component-container">
      <h2>🔗 Relaciones Complejas (Neo4j)</h2>
      <p>
        Esta sección utiliza <strong>Neo4j</strong> para modelar relaciones entre estudiantes, instituciones y programas.
        Ideal para análisis de redes y consultas sobre relaciones complejas.
      </p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email_estudiante">Email del Estudiante *</label>
          <input
            type="email"
            id="email_estudiante"
            name="email_estudiante"
            value={relationData.email_estudiante}
            onChange={handleChange}
            required
            placeholder="ejemplo@email.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="institucion">Institución *</label>
          <input
            type="text"
            id="institucion"
            name="institucion"
            value={relationData.institucion}
            onChange={handleChange}
            required
            placeholder="Universidad XYZ"
          />
        </div>

        <div className="form-group">
          <label htmlFor="programa">Programa *</label>
          <input
            type="text"
            id="programa"
            name="programa"
            value={relationData.programa}
            onChange={handleChange}
            required
            placeholder="Ingeniería en Sistemas"
          />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Relación'}
        </button>
      </form>

      <button
        onClick={fetchRelaciones}
        className="btn"
        style={{ marginTop: '1rem', backgroundColor: '#28a745' }}
      >
        Buscar Relaciones
      </button>

      {relaciones.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Relaciones Encontradas</h3>
          {relaciones.map((rel, index) => (
            <div key={index} style={{
              padding: '1rem',
              marginTop: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              borderLeft: '4px solid #667eea'
            }}>
              <p><strong>Estudiante:</strong> {rel.estudiante}</p>
              <p><strong>Institución:</strong> {rel.institucion}</p>
              <p><strong>Programa:</strong> {rel.programa}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <h4>💡 Sobre esta fase:</h4>
        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>Base de datos:</strong> Neo4j (grafos)</li>
          <li><strong>Función:</strong> Modelado de relaciones complejas</li>
          <li><strong>Características:</strong> Nodos, relaciones, propiedades, consultas de grafos</li>
          <li><strong>Ventajas:</strong> Excelente para análisis de redes y relaciones n-dimensionales</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e8f4f8', borderRadius: '6px' }}>
        <h4>🎯 Casos de uso en Neo4j:</h4>
        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Encontrar todos los estudiantes de una institución</li>
          <li>Identificar programas más populares</li>
          <li>Analizar la red de relaciones entre entidades</li>
          <li>Descubrir patrones en las inscripciones</li>
        </ul>
      </div>
    </div>
  );
}

export default Relations;
