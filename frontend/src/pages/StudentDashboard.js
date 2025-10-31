import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';

const StudentDashboard = () => {
    const { user, tenantConfig, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'perfil'
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const primary = tenantConfig?.branding?.theme?.primary_color || '#0d47a1';
    const secondary = tenantConfig?.branding?.theme?.secondary_color || '#1976d2';
    const accent = tenantConfig?.branding?.theme?.accent_color || '#22c55e';
    const logo = tenantConfig?.branding?.logo_url;
    const instName = tenantConfig?.institution?.name || 'Tu institución';

    useEffect(() => {
        let mounted = true;
        const fetchOverview = async () => {
            try {
                setLoading(true);
                const res = await axios.get('http://localhost:5001/api/student/me/overview');
                if (mounted) {
                    setData(res.data);
                }
            } catch (e) {
                console.error('Error cargando overview alumno:', e);
                if (mounted) setError(e.response?.data?.error || 'Error al cargar tus datos');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchOverview();
        return () => { mounted = false; };
    }, []);

    const Card = ({ title, children }) => (
        <div className="section-card">
            <div className="section-header">{title}</div>
            <div className="section-body">{children}</div>
        </div>
    );

    const openWebmail = () => {
        const domain = tenantConfig?.domain || 'eduscale.com';
        const url = `https://webmail.${domain}`;
        window.open(url, '_blank');
    };

    const onLogout = () => {
        logout();
        navigate('/login');
    };

    // CSS variables sync with tenant theme
    useMemo(() => {
        const root = document.documentElement;
        root.style.setProperty('--sd-bg-start', primary);
        root.style.setProperty('--sd-bg-end', secondary);
        root.style.setProperty('--sd-secondary', secondary);
        root.style.setProperty('--sd-accent', accent);
    }, [primary, secondary, accent]);

    const firstInitial = (data?.student?.nombre_completo || user?.nombre || 'A')
        .trim()
        .charAt(0)
        .toUpperCase();

    return (
        <div className="student-layout">
            <header className="student-topbar">
                <div className="brand">
                    {logo && <img src={logo} alt="logo" />}
                    <h1 style={{ margin: 0, fontSize: 20 }}>{instName} · Portal del Alumno</h1>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className={`btn-primary`} onClick={() => setActiveTab('perfil')}>Mi Perfil</button>
                    <button className={`btn-danger`} onClick={onLogout}>Cerrar Sesión</button>
                </div>
            </header>

            <main className="student-container">
                <div className="student-panel">
                    <div className="student-tabs">
                        <button className={`student-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                        <button className={`student-tab ${activeTab === 'perfil' ? 'active' : ''}`} onClick={() => setActiveTab('perfil')}>Perfil</button>
                    </div>
                    <div className="student-content">
                        {loading && <div className="welcome-subtitle">Cargando datos...</div>}
                        {error && <div style={{ color: '#ef4444' }}>{error}</div>}

                        {!loading && !error && data && activeTab === 'dashboard' && (
                            <>
                                <div className="welcome-card">
                                    <h2 className="welcome-title">¡Bienvenido/a, {data.student?.nombre_completo || user?.nombre || 'Alumno'}!</h2>
                                    <p className="welcome-subtitle">Estás autenticado como {data.student?.academic_mail || user?.email}. Disfrutá tu experiencia académica.</p>
                                </div>

                                <div className="tiles">
                                    <div className="tile">
                                        <div className="tile-title">📚 {data.career?.name || 'Carrera'}</div>
                                        <div className="welcome-subtitle">{data.career?.faculty || 'Facultad'}</div>
                                    </div>
                                    <div className="tile">
                                        <div className="tile-title">📅 Año Académico {data.progress?.academic_year || '-'}
                                        </div>
                                        <div className="welcome-subtitle">Estado: {data.enrollment?.status || '-'}</div>
                                    </div>
                                    <div className="tile">
                                        <div className="tile-title">📄 Documentación</div>
                                        <div className="welcome-subtitle">{data.enrollment?.document_status || 'Sin datos'}</div>
                                    </div>
                                </div>

                                <div className="section-grid">
                                    <div className="section-card">
                                        <div className="section-header">📘 Información de tu Carrera</div>
                                        <div className="section-body">
                                            <div className="info-list">
                                                <div className="info-row">
                                                    <div className="info-key">Carrera:</div>
                                                    <div className="info-val">{data.career?.name || '-'}</div>
                                                </div>
                                                <div className="info-row">
                                                    <div className="info-key">Facultad:</div>
                                                    <div className="info-val">{data.career?.faculty || '-'}</div>
                                                </div>
                                                <div className="info-row">
                                                    <div className="info-key">Título:</div>
                                                    <div className="info-val">{data.career?.name ? `${data.career.name}` : '-'}</div>
                                                </div>
                                                <div className="info-row">
                                                    <div className="info-key">Duración:</div>
                                                    <div className="info-val">{data.career?.duration_years ? `${data.career.duration_years} años` : '-'}</div>
                                                </div>
                                                <div className="info-row">
                                                    <div className="info-key">Años restantes:</div>
                                                    <div className="info-val" style={{ fontWeight: 700 }}>{data.progress?.years_left ?? '-'}</div>
                                                </div>
                                                <div className="info-row">
                                                    <div className="info-key">Modalidad:</div>
                                                    <div className="info-val">Presencial</div>
                                                </div>
                                                <div className="info-row">
                                                    <div className="info-key">Turno:</div>
                                                    <div className="info-val">Tiempo completo</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="section-card">
                                        <div className="section-header">📄 Documentación</div>
                                        <div className="section-body">
                                            <div style={{ marginBottom: 8 }}>
                                                Estado: <span className="badge success">{(data.enrollment?.document_status || 'Completa')}</span>
                                            </div>
                                            <div className="doc-list">
                                                <div className="doc-item">📎 dni.pdf</div>
                                                <div className="doc-item">📎 certificado_secundario.pdf</div>
                                                <div className="doc-item">📎 foto.jpg</div>
                                            </div>
                                            <button className="doc-upload" onClick={() => alert('Función demo: subir documentos')}>Subir Documentos</button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: 16 }}>
                                    <button className="btn-primary" onClick={openWebmail}>Abrir Webmail</button>
                                </div>
                            </>
                        )}

                        {!loading && !error && data && activeTab === 'perfil' && (
                            <>
                                <div className="profile-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div className="avatar">{firstInitial}</div>
                                        <div>
                                            <h2 style={{ margin: '0 0 6px' }}>{data.student?.nombre_completo || '-'}</h2>
                                            <span className="badge success">{data.enrollment?.status || 'Matriculado'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <button className="btn-primary" onClick={() => setActiveTab('dashboard')}>← Volver al Dashboard</button>
                                    </div>
                                </div>

                                <div className="profile-grid">
                                    <Card title="👤 Información Personal">
                                        <div className="info-list">
                                            <div className="info-row"><div className="info-key">Nombre Completo:</div><div className="info-val">{data.student?.nombre_completo || '-'}</div></div>
                                            <div className="info-row"><div className="info-key">Email Personal:</div><div className="info-val">{data.student?.email_personal || '-'}</div></div>
                                            <div className="info-row"><div className="info-key">Email Académico:</div><div className="info-val">{data.student?.academic_mail || '-'}</div></div>
                                        </div>
                                    </Card>
                                    <Card title="🎓 Información Académica">
                                        <div className="info-list">
                                            <div className="info-row"><div className="info-key">Universidad:</div><div className="info-val">{data.institution?.name || instName}</div></div>
                                            <div className="info-row"><div className="info-key">Carrera:</div><div className="info-val">{data.career?.name || '-'}</div></div>
                                            <div className="info-row"><div className="info-key">Facultad:</div><div className="info-val">{data.career?.faculty || '-'}</div></div>
                                            <div className="info-row"><div className="info-key">Duración:</div><div className="info-val">{data.career?.duration_years ? `${data.career.duration_years} años` : '-'}</div></div>
                                            <div className="info-row"><div className="info-key">Años Restantes:</div><div className="info-val" style={{ fontWeight: 700 }}>{data.progress?.years_left ?? '-'}</div></div>
                                            <div className="info-row"><div className="info-key">Modalidad:</div><div className="info-val">Presencial</div></div>
                                            <div className="info-row"><div className="info-key">Turno:</div><div className="info-val">Tiempo completo</div></div>
                                        </div>
                                    </Card>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
