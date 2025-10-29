import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ApplicationForm.css';

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    university: '',
    program: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // TODO: Implement API call to submit application
    console.log('Application submitted:', formData);
    
    // Show success message
    alert('¡Tu solicitud ha sido enviada exitosamente! Te contactaremos pronto.');
    
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      university: '',
      program: '',
      message: ''
    });
  };

  return (
    <div className="application-form-container">
      <div className="application-form-card">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Volver al inicio
        </button>
        
        <h1>Solicitud de Inscripción</h1>
        <p className="form-subtitle">
          Completá el siguiente formulario y te ayudaremos a encontrar la universidad ideal para vos.
        </p>

        <form onSubmit={handleSubmit} className="application-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">Nombre *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Apellido *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Teléfono *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="university">Universidad de interés *</label>
            <input
              type="text"
              id="university"
              name="university"
              value={formData.university}
              onChange={handleChange}
              placeholder="Ej: Universidad de Buenos Aires"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="program">Carrera de interés *</label>
            <input
              type="text"
              id="program"
              name="program"
              value={formData.program}
              onChange={handleChange}
              placeholder="Ej: Ingeniería en Sistemas"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Mensaje adicional (opcional)</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="4"
              placeholder="Contanos un poco más sobre tus intereses académicos..."
            />
          </div>

          <button type="submit" className="submit-button">
            Enviar solicitud
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;
