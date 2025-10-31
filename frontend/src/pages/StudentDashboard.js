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

    // Profile state
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [profileForm, setProfileForm] = useState({
        nombre: '',
        apellido: '',
        telefono: '',
        fecha_nacimiento: '',
        foto_perfil_url: ''
    });
    const [preferences, setPreferences] = useState({
        tema: 'light',
        idioma: 'es',
        notificaciones: true
    });
    const [saveSuccess, setSaveSuccess] = useState('');

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

    // Fetch profile when switching to perfil tab
    useEffect(() => {
        if (activeTab === 'perfil' && user?.rol === 'viewer' && !profile) {
            fetchProfile();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, user?.rol]);

    const fetchProfile = async () => {
        try {
            setProfileLoading(true);
            const res = await axios.get('http://localhost:5001/api/student/me/profile');
            setProfile(res.data.profile);
            setPreferences(res.data.preferencias || { tema: 'light', idioma: 'es', notificaciones: true });

            // Initialize form
            setProfileForm({
                nombre: res.data.profile.nombre || '',
                apellido: res.data.profile.apellido || '',
                telefono: res.data.profile.telefono || '',
                fecha_nacimiento: res.data.profile.fecha_nacimiento ? res.data.profile.fecha_nacimiento.split('T')[0] : '',
                foto_perfil_url: res.data.profile.foto_perfil_url || ''
            });
        } catch (e) {
            console.error('Error cargando perfil:', e);
        } finally {
            setProfileLoading(false);
        }
    };

    const handleProfileUpdate = async () => {
        try {
            setSaveSuccess('');
            await axios.put('http://localhost:5001/api/student/me/profile', profileForm);
            setSaveSuccess('✅ Perfil actualizado exitosamente');
            setEditMode(false);
            fetchProfile(); // Refresh
            setTimeout(() => setSaveSuccess(''), 3000);
        } catch (e) {
            console.error('Error actualizando perfil:', e);
            alert('Error al actualizar perfil: ' + (e.response?.data?.error || e.message));
        }
    };

    const handlePreferencesUpdate = async (newPrefs) => {
        try {
            await axios.put('http://localhost:5001/api/student/me/preferences', newPrefs);
            setPreferences(newPrefs);
            setSaveSuccess('✅ Preferencias actualizadas');
            setTimeout(() => setSaveSuccess(''), 3000);
        } catch (e) {
            console.error('Error actualizando preferencias:', e);
            alert('Error al actualizar preferencias: ' + (e.response?.data?.error || e.message));
        }
    };

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

    // Apply theme (light/dark) to body
    useEffect(() => {
        if (preferences.tema === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }, [preferences.tema]);

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

                                {saveSuccess && <div style={{ padding: '12px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '16px' }}>{saveSuccess}</div>}

                                {user?.rol === 'viewer' && !profileLoading && profile ? (
                                    <>
                                        <div className="profile-grid">
                                            <Card title="👤 Información Personal">
                                                {/* Avatar/Foto de Perfil */}
                                                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                                    {profileForm.foto_perfil_url ? (
                                                        <img
                                                            src={profileForm.foto_perfil_url}
                                                            alt="Foto de perfil"
                                                            style={{
                                                                width: '100px',
                                                                height: '100px',
                                                                borderRadius: '50%',
                                                                objectFit: 'cover',
                                                                border: '3px solid ' + primary
                                                            }}
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <div style={{
                                                            width: '100px',
                                                            height: '100px',
                                                            borderRadius: '50%',
                                                            background: primary,
                                                            color: 'white',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '36px',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {firstInitial}
                                                        </div>
                                                    )}
                                                </div>

                                                {!editMode ? (
                                                    <>
                                                        <div className="info-list">
                                                            <div className="info-row"><div className="info-key">Nombre:</div><div className="info-val">{profile.nombre || '-'}</div></div>
                                                            <div className="info-row"><div className="info-key">Apellido:</div><div className="info-val">{profile.apellido || '-'}</div></div>
                                                            <div className="info-row"><div className="info-key">Email:</div><div className="info-val">{profile.email || '-'}</div></div>
                                                            <div className="info-row"><div className="info-key">Documento:</div><div className="info-val">{profile.documento || '-'}</div></div>
                                                            <div className="info-row"><div className="info-key">Teléfono:</div><div className="info-val">{profile.telefono || '-'}</div></div>
                                                            <div className="info-row"><div className="info-key">Fecha Nac.:</div><div className="info-val">{profile.fecha_nacimiento ? new Date(profile.fecha_nacimiento).toLocaleDateString('es-AR') : '-'}</div></div>
                                                        </div>
                                                        <button className="btn-primary" style={{ marginTop: '12px', width: '100%' }} onClick={() => setEditMode(true)}>✏️ Editar Perfil</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                            <div>
                                                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '13px' }}>Nombre</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Nombre"
                                                                    value={profileForm.nombre}
                                                                    onChange={(e) => setProfileForm({ ...profileForm, nombre: e.target.value })}
                                                                    style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', fontSize: '14px' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '13px' }}>Apellido</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Apellido"
                                                                    value={profileForm.apellido}
                                                                    onChange={(e) => setProfileForm({ ...profileForm, apellido: e.target.value })}
                                                                    style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', fontSize: '14px' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '13px' }}>Teléfono</label>
                                                                <input
                                                                    type="tel"
                                                                    placeholder="+54 11 1234-5678"
                                                                    value={profileForm.telefono}
                                                                    onChange={(e) => setProfileForm({ ...profileForm, telefono: e.target.value })}
                                                                    style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', fontSize: '14px' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '13px' }}>Fecha de Nacimiento</label>
                                                                <input
                                                                    type="date"
                                                                    value={profileForm.fecha_nacimiento}
                                                                    onChange={(e) => setProfileForm({ ...profileForm, fecha_nacimiento: e.target.value })}
                                                                    style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', fontSize: '14px' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '13px' }}>URL Foto de Perfil</label>
                                                                <input
                                                                    type="url"
                                                                    placeholder="https://ejemplo.com/foto.jpg"
                                                                    value={profileForm.foto_perfil_url}
                                                                    onChange={(e) => setProfileForm({ ...profileForm, foto_perfil_url: e.target.value })}
                                                                    style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', fontSize: '14px' }}
                                                                />
                                                                <small style={{ color: '#6b7280', fontSize: '12px' }}>Pegá la URL de tu imagen de perfil</small>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                                            <button className="btn-primary" style={{ flex: 1 }} onClick={handleProfileUpdate}>💾 Guardar Cambios</button>
                                                            <button className="btn-danger" style={{ flex: 1 }} onClick={() => {
                                                                setEditMode(false);
                                                                // Restore original values
                                                                setProfileForm({
                                                                    nombre: profile.nombre || '',
                                                                    apellido: profile.apellido || '',
                                                                    telefono: profile.telefono || '',
                                                                    fecha_nacimiento: profile.fecha_nacimiento ? profile.fecha_nacimiento.split('T')[0] : '',
                                                                    foto_perfil_url: profile.foto_perfil_url || ''
                                                                });
                                                            }}>❌ Cancelar</button>
                                                        </div>
                                                    </>
                                                )}
                                            </Card>

                                            <Card title="⚙️ Preferencias">
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 600, marginBottom: '6px' }}>Tema</div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                style={{
                                                                    padding: '8px 16px',
                                                                    border: preferences.tema === 'light' ? '2px solid ' + primary : '1px solid #ccc',
                                                                    borderRadius: '6px',
                                                                    background: preferences.tema === 'light' ? '#f0f9ff' : 'white',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={() => handlePreferencesUpdate({ ...preferences, tema: 'light' })}
                                                            >
                                                                ☀️ Claro
                                                            </button>
                                                            <button
                                                                style={{
                                                                    padding: '8px 16px',
                                                                    border: preferences.tema === 'dark' ? '2px solid ' + primary : '1px solid #ccc',
                                                                    borderRadius: '6px',
                                                                    background: preferences.tema === 'dark' ? '#1e293b' : 'white',
                                                                    color: preferences.tema === 'dark' ? 'white' : 'black',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={() => handlePreferencesUpdate({ ...preferences, tema: 'dark' })}
                                                            >
                                                                🌙 Oscuro
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div style={{ fontWeight: 600, marginBottom: '6px' }}>Notificaciones</div>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={preferences.notificaciones}
                                                                onChange={(e) => handlePreferencesUpdate({ ...preferences, notificaciones: e.target.checked })}
                                                            />
                                                            <span>Recibir notificaciones por email</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>

                                        <Card title="🎓 Información Académica">
                                            <div className="info-list">
                                                <div className="info-row"><div className="info-key">Universidad:</div><div className="info-val">{data.institution?.name || instName}</div></div>
                                                <div className="info-row"><div className="info-key">Carrera:</div><div className="info-val">{data.career?.name || '-'}</div></div>
                                                <div className="info-row"><div className="info-key">Facultad:</div><div className="info-val">{data.career?.faculty || '-'}</div></div>
                                                <div className="info-row"><div className="info-key">Duración:</div><div className="info-val">{data.career?.duration_years ? `${data.career.duration_years} años` : '-'}</div></div>
                                                <div className="info-row"><div className="info-key">Años Restantes:</div><div className="info-val" style={{ fontWeight: 700 }}>{data.progress?.years_left ?? '-'}</div></div>
                                            </div>
                                        </Card>
                                    </>
                                ) : user?.rol !== 'viewer' ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                                        <p>⚠️ Los perfiles personalizados solo están disponibles para usuarios en MongoDB.</p>
                                        <p>Tu cuenta actual usa el sistema legacy de Cassandra.</p>
                                    </div>
                                ) : profileLoading ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>Cargando perfil...</div>
                                ) : (
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
                                            </div>
                                        </Card>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
