import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const { user, tenantConfig, logout } = useAuth();

  if (!tenantConfig) {
    return (
      <div className="dashboard-loading">
        <p>Cargando configuración...</p>
      </div>
    );
  }

  const { institucion, branding, dashboard } = tenantConfig;
  const tabs = dashboard?.tabs_habilitadas || [];
  const enabledTabs = tabs.filter(tab => tab.habilitada).sort((a, b) => a.orden - b.orden);

  return (
    <div className="dashboard-container" style={{
      '--color-primario': branding?.colores?.primario || '#667eea',
      '--color-secundario': branding?.colores?.secundario || '#764ba2',
      '--color-acento': branding?.colores?.acento || '#E63946'
    }}>
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🎓 {institucion?.nombre_corto || 'EduScale'}</h1>
            <p>{tenantConfig.textos?.bienvenida?.titulo || 'Panel de Administración'}</p>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user?.nombre} {user?.apellido}</span>
              <span className="user-role">{user?.rol}</span>
            </div>
            <button onClick={logout} className="logout-button">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Bienvenido, {user?.nombre}!</h2>
          <p>{tenantConfig.textos?.bienvenida?.descripcion || 'Gestiona las admisiones de tu institución'}</p>
        </div>

        <div className="tabs-section">
          <h3>Módulos Disponibles</h3>
          <div className="tabs-grid">
            {enabledTabs.map((tab) => (
              <div key={tab.id} className="tab-card">
                <div className="tab-header">
                  <span className="tab-icon">{getTabIcon(tab.id)}</span>
                  <h4>{tab.nombre}</h4>
                </div>
                <p className="tab-fase">{tab.fase}</p>
                <p className="tab-fuente">Base de datos: <strong>{tab.fuente.toUpperCase()}</strong></p>
                <Link to={tab.endpoint} className="tab-button">
                  Ver {tab.nombre}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="info-section">
          <div className="info-card">
            <h4>Información de la Institución</h4>
            <div className="info-details">
              <p><strong>Nombre Completo:</strong> {institucion?.nombre_completo}</p>
              <p><strong>Tipo:</strong> {formatTipo(institucion?.tipo)}</p>
              <p><strong>Ubicación:</strong> {institucion?.ciudad}, {institucion?.pais}</p>
            </div>
          </div>

          <div className="info-card">
            <h4>Tu Cuenta</h4>
            <div className="info-details">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Tenant ID:</strong> {user?.tenant_id}</p>
              <p><strong>Permisos:</strong> {user?.permisos?.join(', ')}</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="dashboard-footer">
        <p>TPO - Ingeniería II | Persistencia Políglota</p>
      </footer>
    </div>
  );
}

function getTabIcon(tabId) {
  const icons = {
    prospectos: '👥',
    solicitudes: '📄',
    inscritos: '✅',
    relaciones: '🔗'
  };
  return icons[tabId] || '📊';
}

function formatTipo(tipo) {
  const tipos = {
    universidad_publica: 'Universidad Pública',
    universidad_privada: 'Universidad Privada',
    instituto: 'Instituto',
    otro: 'Otro'
  };
  return tipos[tipo] || tipo;
}

export default Dashboard;
