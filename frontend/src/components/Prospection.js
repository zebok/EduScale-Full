import React, { useState } from 'react';

function Prospection() {
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    apellido: '',
    telefono: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

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
      const response = await fetch('/api/prospection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          text: data.message || '✓ Interés registrado correctamente',
          type: 'success'
        });
        setFormData({ email: '', nombre: '', apellido: '', telefono: '' });
      } else {
        setMessage({
          text: data.error || 'Error al registrar el interés',
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

  return (
    <div className="component-container">
      <h2>🔴 Fase A: Prospección e Interés (Redis)</h2>
      <p>
        Esta fase utiliza <strong>Redis</strong> para gestionar el registro inicial de interesados.
        Redis permite validación de duplicados en tiempo real y rate limiting para evitar spam.
      </p>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
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
          <label htmlFor="telefono">Teléfono</label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="+54 11 1234-5678"
          />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Interés'}
        </button>
      </form>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <h4>💡 Sobre esta fase:</h4>
        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>Base de datos:</strong> Redis (clave-valor)</li>
          <li><strong>Función:</strong> Registro rápido de interesados</li>
          <li><strong>Características:</strong> Validación de duplicados, rate limiting, datos temporales</li>
          <li><strong>Ventajas:</strong> Latencia ultra-baja, ideal para alta concurrencia</li>
        </ul>
      </div>
    </div>
  );
}

export default Prospection;
