import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const StudentDashboard = () => {
    const { user, tenantConfig } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'perfil'
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const primary = tenantConfig?.branding?.theme?.primary_color || '#1f2937';
    const secondary = tenantConfig?.branding?.theme?.secondary_color || '#3b82f6';
    const accent = tenantConfig?.branding?.theme?.accent_color || '#10b981';
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
        <div style={{
            background: 'white',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 20,
            flex: 1,
            minWidth: 280,
            boxShadow: '0 6px 10px -4px rgba(0,0,0,0.08)'
        }}>
            <h3 style={{ marginTop: 0, color: '#111827', fontSize: 16 }}>{title}</h3>
            <div>{children}</div>
        </div>
    );

    const openWebmail = () => {
        const domain = tenantConfig?.domain || 'eduscale.com';
        const url = `https://webmail.${domain}`;
        window.open(url, '_blank');
    };

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
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', gap: 8, padding: 12, borderBottom: '1px solid #e5e7eb' }}>
                        <button onClick={() => setActiveTab('dashboard')} style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid #e5e7eb',
                            background: activeTab === 'dashboard' ? `${secondary}22` : 'white',
                            color: activeTab === 'dashboard' ? '#111827' : '#374151',
                            cursor: 'pointer'
                        }}>Dashboard</button>
                        <button onClick={() => setActiveTab('perfil')} style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid #e5e7eb',
                            background: activeTab === 'perfil' ? `${secondary}22` : 'white',
                            color: activeTab === 'perfil' ? '#111827' : '#374151',
                            cursor: 'pointer'
                        }}>Perfil</button>
                    </div>

                    <div style={{ padding: 20 }}>
                        {loading && <div style={{ color: '#64748b' }}>Cargando datos...</div>}
                        {error && <div style={{ color: '#ef4444' }}>{error}</div>}

                        {!loading && !error && data && activeTab === 'dashboard' && (
                            <>
                                <h2 style={{ marginTop: 0, color: '#111827' }}>
                                    Bienvenido {data.student?.nombre_completo || user?.nombre || 'Alumno'}!
                                </h2>
                                <p style={{ color: '#374151', marginBottom: 24 }}>
                                    Estás autenticado como <strong style={{ color: secondary }}>{data.student?.academic_mail || user?.email}</strong>.
                                </p>
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                    <Card title="Carrera">
                                        <div style={{ color: '#334155' }}>
                                            <div><strong>Nombre:</strong> {data.career?.name || '-'}</div>
                                            <div><strong>Facultad:</strong> {data.career?.faculty || '-'}</div>
                                            <div><strong>Duración:</strong> {data.career?.duration_years ? `${data.career.duration_years} años` : '-'}</div>
                                            <div><strong>Año de ingreso:</strong> {data.progress?.academic_year || '-'}</div>
                                        </div>
                                    </Card>
                                    <Card title="Progreso">
                                        <div style={{ color: '#334155' }}>
                                            <div><strong>Años cursados:</strong> {data.progress?.years_elapsed ?? '-'}</div>
                                            <div><strong>Años restantes:</strong> {data.progress?.years_left ?? '-'}</div>
                                        </div>
                                    </Card>
                                    <Card title="Estados">
                                        <div style={{ color: '#334155' }}>
                                            <div><strong>Inscripción:</strong> {data.enrollment?.status || '-'}</div>
                                            <div><strong>Documentación:</strong> {data.enrollment?.document_status || '-'}</div>
                                            <div><strong>Pago:</strong> {data.enrollment?.payment_status || '-'}</div>
                                        </div>
                                    </Card>
                                    <Card title="Admisión (Mongo)">
                                        {data.admission ? (
                                            <div style={{ color: '#334155' }}>
                                                <div><strong>Estado:</strong> {data.admission.estado}</div>
                                                <div><strong>Documentos:</strong> {data.admission.documentos || '-'}</div>
                                                <div><strong>Comentarios:</strong> {data.admission.comentarios || '-'}</div>
                                            </div>
                                        ) : (
                                            <div style={{ color: '#64748b' }}>Sin expediente de admisión</div>
                                        )}
                                    </Card>
                                    <Card title="Accesos rápidos">
                                        <button onClick={openWebmail} style={{
                                            background: accent,
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 8,
                                            padding: '10px 14px',
                                            cursor: 'pointer'
                                        }}>Abrir Webmail</button>
                                    </Card>
                                </div>
                            </>
                        )}

                        {!loading && !error && data && activeTab === 'perfil' && (
                            <>
                                <h2 style={{ marginTop: 0, color: '#111827' }}>Perfil</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <Card title="Datos personales">
                                        <div style={{ color: '#334155' }}>
                                            <div><strong>Nombre:</strong> {data.student?.nombre_completo || '-'}</div>
                                            <div><strong>Email académico:</strong> {data.student?.academic_mail || '-'}</div>
                                            <div><strong>Email personal:</strong> {data.student?.email_personal || '-'}</div>
                                        </div>
                                    </Card>
                                    <Card title="Institución">
                                        <div style={{ color: '#334155' }}>
                                            <div><strong>Nombre:</strong> {data.institution?.name || instName}</div>
                                            <div><strong>ID:</strong> {data.institution?.id || '-'}</div>
                                        </div>
                                    </Card>
                                    <Card title="Carrera">
                                        <div style={{ color: '#334155' }}>
                                            <div><strong>Carrera:</strong> {data.career?.name || '-'}</div>
                                            <div><strong>Facultad:</strong> {data.career?.faculty || '-'}</div>
                                            <div><strong>Duración:</strong> {data.career?.duration_years ? `${data.career.duration_years} años` : '-'}</div>
                                        </div>
                                    </Card>
                                    <Card title="Estados">
                                        <div style={{ color: '#334155' }}>
                                            <div><strong>Inscripción:</strong> {data.enrollment?.status || '-'}</div>
                                            <div><strong>Documentos:</strong> {data.enrollment?.document_status || '-'}</div>
                                            <div><strong>Pago:</strong> {data.enrollment?.payment_status || '-'}</div>
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
