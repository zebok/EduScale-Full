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

  const { institution, branding, dashboard } = tenantConfig;
  const tabs = dashboard?.tabs_enabled || [];
  const enabledTabs = tabs.filter(tab => tab.enabled).sort((a, b) => a.order - b.order);

  return (
    <div className="dashboard-container" style={{
      '--color-primario': branding?.theme?.primary_color || '#667eea',
      '--color-secundario': branding?.theme?.secondary_color || '#764ba2',
      '--color-acento': branding?.theme?.accent_color || '#E63946'
    }}>
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🎓 {institution?.short_name || 'EduScale'}</h1>
            <p>{tenantConfig.texts?.welcome?.title || 'Panel de Administración'}</p>
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
          <p>{tenantConfig.texts?.welcome?.description || 'Gestiona las admisiones de tu institución'}</p>
        </div>

        <div className="tabs-section">
          <h3>Módulos Disponibles</h3>
          <div className="tabs-grid">
            {enabledTabs.map((tab) => (
              <div key={tab.id} className="tab-card">
                <div className="tab-header">
                  <span className="tab-icon">{getTabIcon(tab.id)}</span>
                  <h4>{tab.name}</h4>
                </div>
                <p className="tab-fase">{tab.phase}</p>
                <p className="tab-fuente">Base de datos: <strong>{tab.source.toUpperCase()}</strong></p>
                <Link to={tab.endpoint} className="tab-button">
                  Ver {tab.name}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="info-section">
          <div className="info-card">
            <h4>Información de la Institución</h4>
            <div className="info-details">
              <p><strong>Nombre Completo:</strong> {institution?.name}</p>
              <p><strong>Tipo:</strong> {formatTipo(institution?.type)}</p>
              <p><strong>Ubicación:</strong> {institution?.city}, {institution?.country}</p>
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
    prospection: '👥',
    admission: '📄',
    enrollment: '✅',
    relations: '🔗'
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
