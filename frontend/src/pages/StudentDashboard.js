import React from 'react';
import { useAuth } from '../context/AuthContext';

const StudentDashboard = () => {
  const { user, tenantConfig } = useAuth();

  const primary = tenantConfig?.branding?.theme?.primary_color || '#1f2937';
  const secondary = tenantConfig?.branding?.theme?.secondary_color || '#3b82f6';
  const accent = tenantConfig?.branding?.theme?.accent_color || '#10b981';
  const logo = tenantConfig?.branding?.logo_url;
  const instName = tenantConfig?.institution?.name || 'Tu institución';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header
        style={{
          background: `linear-gradient(90deg, ${primary}, ${secondary})`,
          color: 'white',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}
      >
        {logo && (
          <img src={logo} alt="logo" style={{ height: 40, background: 'white', borderRadius: 6, padding: 6 }} />
        )}
        <h1 style={{ margin: 0, fontSize: 20 }}>{instName} · Portal del Alumno</h1>
      </header>

      <main style={{ maxWidth: 960, margin: '32px auto', padding: '0 16px' }}>
        <div
          style={{
            background: 'white',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 24,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)'
          }}
        >
          <h2 style={{ marginTop: 0, color: '#111827' }}>
            Bienvenido {user?.nombre || 'Alumno'}!
          </h2>
          <p style={{ color: '#374151', marginBottom: 24 }}>
            Estás autenticado como <strong style={{ color: secondary }}>{user?.email}</strong>.
          </p>

          <div style={{
            background: '#f1f5f9',
            borderRadius: 12,
            padding: 16,
            border: '1px dashed #cbd5e1'
          }}>
            <p style={{ margin: 0, color: '#334155' }}>
              Próximamente verás tu estado de inscripción, documentos y pagos.
            </p>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#475569' }}>Rol:</span>
            <span style={{
              fontSize: 12,
              color: '#0f172a',
              background: `${accent}22`,
              border: `1px solid ${accent}66`,
              padding: '4px 8px',
              borderRadius: 999
            }}>alumno</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
