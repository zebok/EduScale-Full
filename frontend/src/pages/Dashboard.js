import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import WorkflowPipeline from '../components/WorkflowPipeline';
import FeesSection from '../components/FeesSection';
import enrollmentService from '../services/enrollmentService';
import './Dashboard.css';

function Dashboard() {
  const { user, tenantConfig, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user?.tenant_id) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);

      // Debug: verificar que tenemos el token
      const token = localStorage.getItem('token');
      console.log('🔑 Token disponible:', token ? 'Sí' : 'No');
      console.log('👤 User tenant_id:', user?.tenant_id);

      const statsData = await enrollmentService.getStats(user.tenant_id);
      setStats(statsData.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoadingStats(false);
    }
  };

  if (!tenantConfig) {
    return (
      <div className="dashboard-loading">
        <p>Cargando configuración...</p>
      </div>
    );
  }

  const { institution, branding } = tenantConfig;
  const isPrivate = (institution?.type || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('privada');

  return (
    <div className="dashboard-container" style={{
      '--color-primario': branding?.theme?.primary_color || '#667eea',
      '--color-secundario': branding?.theme?.secondary_color || '#764ba2',
      '--color-acento': branding?.theme?.accent_color || '#E63946'
    }}>
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>{institution?.short_name || 'EduScale'}</h1>
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

          {/* Workflow Stats Cards */}
          {!loadingStats && stats?.by_stage && (
            <div className="workflow-stats-cards">
              <h3>Pipeline de Inscripciones - {stats.total} Total</h3>
              <div className="stats-grid">
                {Object.entries(stats.by_stage)
                  .filter(([_, stageData]) => stageData.count > 0) // Solo mostrar etapas con inscripciones
                  .sort((a, b) => a[1].stage_id - b[1].stage_id) // Ordenar por stage_id
                  .map(([statusKey, stageData]) => (
                    <div
                      key={statusKey}
                      className="stat-card"
                      style={{ borderLeftColor: stageData.color }}
                    >
                      <div className="stat-content">
                        <h4>{stageData.name}</h4>
                        <div className="stat-numbers">
                          <span className="stat-count">{stageData.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Aranceles - Solo instituciones privadas */}
        {isPrivate && (
          <div className="fees-wrapper">
            <FeesSection tenantId={user.tenant_id} />
          </div>
        )}

        {/* WorkflowPipeline - siempre visible */}
        <WorkflowPipeline />
      </div>

      <footer className="dashboard-footer">
        <p>TPO - Ingeniería II | Persistencia Políglota</p>
      </footer>
    </div>
  );
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
