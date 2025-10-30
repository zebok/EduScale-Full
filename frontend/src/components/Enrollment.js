import React, { useState, useEffect } from "react";
import useEnrollmentAPI from "../hooks/useEnrollmentAPI";
import EnrollmentHistoryModal from "./EnrollmentHistoryModal";
import useTenantTheme from "../hooks/useTenantTheme";

function Enrollment() {
  const [formData, setFormData] = useState({
    institucion: '',
    email: '',
    nombre: '',
    apellido: '',
    programa: ''
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [inscripciones, setInscripciones] = useState([]);

  // modal / historial
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const { createEnrollment, getEnrollmentsByInstitution, getEnrollmentHistory } = useEnrollmentAPI();
  const { loading: themeLoading, theme } = useTenantTheme(formData.institucion);

  useEffect(() => {
    // If institution changes, clear current results and modal
    setInscripciones([]);
    setShowHistory(false);
    setSelectedEmail('');
    setSelectedHistory([]);
  }, [formData.institucion]);

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
      const res = await createEnrollment(formData);
      if (res.ok) {
        setMessage({ text: 'Inscripción registrada en Cassandra', type: 'success' });
        // Optionally clear form (keep institucion to allow quick lists)
        setFormData({ ...formData, email: '', nombre: '', apellido: '', programa: '' });
      } else {
        setMessage({ text: res.error || 'Error al registrar inscripción', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: String(err), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchByInstitution = async () => {
    if (!formData.institucion) {
      setMessage({ text: 'Por favor ingrese la institución antes de buscar', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const data = await getEnrollmentsByInstitution(formData.institucion);
      setInscripciones(Array.isArray(data) ? data : []);
    } catch (err) {
      setInscripciones([]);
      setMessage({ text: 'Error al obtener inscripciones', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onVerHistorial = async (email) => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const detalle = await getEnrollmentHistory(formData.institucion, email);
      setSelectedEmail(email);
      setSelectedHistory(detalle?.historial || []);
      setShowHistory(true);
    } catch (err) {
      setMessage({ text: 'Error al obtener historial', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // helpers to render values safely
  const formatDate = (v) => {
    try {
      return v ? new Date(v).toLocaleString() : '-';
    } catch (e) {
      return '-';
    }
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    padding: 8,
    borderRadius: 6,
    background: theme.secondaryColor || '#f4f4f4'
  };

  const logoStyle = { height: 48, objectFit: 'contain' };

  return (
    <div className="component-container">
      <div style={headerStyle}>
        {theme.logoUrl ? (
          <img src={theme.logoUrl} alt="logo" style={logoStyle} />
        ) : (
          <div style={{ width: 48, height: 48, background: '#eee', borderRadius: 6 }} />
        )}
        <div>
          <h2 style={{ margin: 0, color: theme.primaryColor || '#000' }}>📊 Fase C: Registro de Inscripción (Cassandra)</h2>
          <div style={{ color: '#666' }}>{theme.heroText || 'Bienvenido'}</div>
        </div>
      </div>

      {message.text && (
        <div style={{ border: `1px solid ${message.type === 'success' ? 'green' : 'red'}`, padding: 8, borderRadius: 6, marginBottom: 12 }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: 12, borderRadius: 6 }}>
        <div style={{ marginBottom: 8 }}>
          <label htmlFor="institucion">Institución *</label><br />
          <input
            type="text"
            id="institucion"
            name="institucion"
            value={formData.institucion}
            onChange={handleChange}
            required
            placeholder="Universidad XYZ"
            style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="ejemplo@email.com"
              style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="programa">Programa *</label>
            <input
              type="text"
              id="programa"
              name="programa"
              value={formData.programa}
              onChange={handleChange}
              required
              placeholder="Ingeniería en Sistemas"
              style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          <div>
            <label htmlFor="nombre">Nombre *</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              placeholder="Tu nombre"
              style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="apellido">Apellido *</label>
            <input
              type="text"
              id="apellido"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              required
              placeholder="Tu apellido"
              style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button type="submit" className="btn" disabled={loading || themeLoading} style={{ padding: '8px 12px' }}>
            {loading ? 'Registrando...' : 'Registrar Inscripción'}
          </button>

          <button type="button" onClick={handleFetchByInstitution} disabled={loading || themeLoading} style={{ padding: '8px 12px' }}>
            {loading ? 'Procesando...' : 'Listar Inscripciones de la Institución'}
          </button>
        </div>
      </form>

      {inscripciones.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Inscripciones</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
            <thead>
              <tr style={{ background: '#f6f6f6' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Nombre completo</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Email</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Programa</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Estado</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Última actualización</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Matrícula</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inscripciones.map((item, idx) => (
                <tr key={idx} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{`${item.nombre || ''} ${item.apellido || ''}`.trim()}</td>
                  <td style={{ padding: 8 }}>{item.email || '-'}</td>
                  <td style={{ padding: 8 }}>{item.programa || '-'}</td>
                  <td style={{ padding: 8 }}>{item.estado_actual || item.estado || '-'}</td>
                  <td style={{ padding: 8 }}>{formatDate(item.ultima_actualizacion || item.timestamp || item.fecha_inscripcion)}</td>
                  <td style={{ padding: 8 }}>{item.matricula_nro ?? '-'}</td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => onVerHistorial(item.email)} style={{ padding: '6px 10px' }}>
                      Ver historial
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EnrollmentHistoryModal
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        email={selectedEmail}
        institucion={formData.institucion}
        historyData={selectedHistory}
      />

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
