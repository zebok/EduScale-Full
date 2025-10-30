import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ApplicationForm.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    institucionId: '',
    carreraId: ''
  });

  const [instituciones, setInstituciones] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCarreras, setLoadingCarreras] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);

  // Cargar instituciones al montar el componente
  useEffect(() => {
    fetchInstituciones();
  }, []);

  const fetchInstituciones = async () => {
    try {
      const response = await fetch(`${API_URL}/api/prospection/instituciones`);
      const data = await response.json();
      setInstituciones(data.instituciones || []);
    } catch (error) {
      console.error('Error al cargar instituciones:', error);
      setError('Error al cargar las instituciones');
    }
  };

  const fetchCarreras = async (institucionId) => {
    if (!institucionId) {
      setCarreras([]);
      return;
    }

    setLoadingCarreras(true);
    try {
      const response = await fetch(`${API_URL}/api/prospection/instituciones/${institucionId}/carreras`);
      const data = await response.json();
      setCarreras(data.carreras || []);
    } catch (error) {
      console.error('Error al cargar carreras:', error);
      setError('Error al cargar las carreras');
    } finally {
      setLoadingCarreras(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Si cambió la institución, cargar sus carreras
    if (name === 'institucionId') {
      setFormData(prev => ({ ...prev, carreraId: '' })); // Resetear carrera
      fetchCarreras(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/prospection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar la solicitud');
      }

      // Obtener nombre de la institución seleccionada
      const institucionSeleccionada = instituciones.find(inst => inst.id === formData.institucionId);
      const carreraSeleccionada = carreras.find(car => car.id === formData.carreraId);

      // Mostrar mensaje de éxito
      setSuccessMessage({
        institucion: institucionSeleccionada?.nombre || 'la institución',
        carrera: carreraSeleccionada?.nombre || 'la carrera',
        email: formData.email,
        ttl_horas: data.ttl_horas
      });

      // Resetear formulario
      setFormData({
        nombreCompleto: '',
        email: '',
        institucionId: '',
        carreraId: ''
      });
      setCarreras([]);
      setError('');

    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="application-form-container">
      <div className="application-form-card">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Volver al inicio
        </button>
        
        <h1>Solicitud de Inscripción</h1>

        {error && <div className="error-message">{error}</div>}

        {successMessage && (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>¡Registro Exitoso!</h2>
            <p className="success-main-text">
              Tu interés en <strong>{successMessage.carrera}</strong> ha sido registrado correctamente.
            </p>
            <p className="success-detail">
              El comité de admisiones de <strong>{successMessage.institucion}</strong> evaluará tu solicitud
              y se pondrá en contacto contigo a <strong>{successMessage.email}</strong>.
            </p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="success-button"
            >
              Registrar otro interés
            </button>
          </div>
        )}

        {!successMessage && (
          <form onSubmit={handleSubmit} className="application-form">
          <div className="form-group">
            <label htmlFor="nombreCompleto">Nombre Completo *</label>
            <input
              type="text"
              id="nombreCompleto"
              name="nombreCompleto"
              value={formData.nombreCompleto}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              required
              disabled={loading}
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
              placeholder="tu.email@ejemplo.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="institucionId">Institución de interés *</label>
            <select
              id="institucionId"
              name="institucionId"
              value={formData.institucionId}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">-- Seleccioná una institución --</option>
              {instituciones.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.nombre} ({inst.nombre_corto}) - {inst.total_carreras} carreras
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="carreraId">Carrera de interés *</label>
            <select
              id="carreraId"
              name="carreraId"
              value={formData.carreraId}
              onChange={handleChange}
              required
              disabled={loading || !formData.institucionId || loadingCarreras}
            >
              <option value="">
                {!formData.institucionId
                  ? '-- Primero seleccioná una institución --'
                  : loadingCarreras
                  ? 'Cargando carreras...'
                  : '-- Seleccioná una carrera --'
                }
              </option>
              {carreras.map(carrera => (
                <option key={carrera.id} value={carrera.id}>
                  {carrera.nombre} ({carrera.codigo}) - {carrera.duracion_años} años
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </form>
        )}
      </div>
    </div>
  );
};

export default ApplicationForm;
