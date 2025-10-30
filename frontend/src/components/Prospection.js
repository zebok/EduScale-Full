import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Prospection() {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.get(`${API_URL}/api/enrollment`);
      setItems(data.enrollments || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al obtener inscripciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="component-container">
      <h2>🔴 Fase A: Prospección - Interesados por institución</h2>
      <p>Listado de interesados (enrollments) de tu institución.</p>

      {loading && <div>Cargando inscripciones...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && (
        <>
          <div style={{ marginBottom: '0.75rem' }}>
            Total: <strong>{total}</strong>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Nombre</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Carrera</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Estado</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Creado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <tr key={`${e.institution_id}-${e.email}-${e.career_id}`}>
                    <td style={{ padding: '8px' }}>{e.nombre_completo || '-'}</td>
                    <td style={{ padding: '8px' }}>{e.email}</td>
                    <td style={{ padding: '8px' }}>{e.career_name || e.career_id}</td>
                    <td style={{ padding: '8px' }}>{e.enrollment_status || '-'}</td>
                    <td style={{ padding: '8px' }}>{e.created_at ? new Date(e.created_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '12px' }}>Sin inscripciones registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Prospection;
