import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './MinisterioDashboard.css';

function MinisterioDashboard() {
    const { user, logout } = useAuth();
    const [universidades, setUniversidades] = useState([]);
    const [selectedUniversidad, setSelectedUniversidad] = useState(null);
    const [inscriptos, setInscriptos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [estadisticas, setEstadisticas] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const API_URL = 'http://localhost:5001/api';

    useEffect(() => {
        loadUniversidades();
        loadEstadisticas();
    }, []);

    const loadUniversidades = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/ministerio/universidades`);
            setUniversidades(response.data.universidades);
            setError(null);
        } catch (err) {
            console.error('Error al cargar universidades:', err);
            setError('Error al cargar la lista de universidades');
        } finally {
            setLoading(false);
        }
    };

    const loadEstadisticas = async () => {
        try {
            const response = await axios.get(`${API_URL}/ministerio/estadisticas`);
            setEstadisticas(response.data);
        } catch (err) {
            console.error('Error al cargar estadísticas:', err);
        }
    };

    const loadUniversidadDetails = async (institutionId) => {
        try {
            setLoading(true);
            const [detResp, inscResp] = await Promise.all([
                axios.get(`${API_URL}/ministerio/universidades/${institutionId}`),
                axios.get(`${API_URL}/ministerio/universidades/${institutionId}/inscriptos`)
            ]);
            setSelectedUniversidad(detResp.data);
            setInscriptos(inscResp.data);
            setShowDetails(true);
            setError(null);
        } catch (err) {
            console.error('Error al cargar detalles:', err);
            setError('Error al cargar los detalles de la universidad');
        } finally {
            setLoading(false);
        }
    };

    const closeDetails = () => {
        setShowDetails(false);
        setSelectedUniversidad(null);
        setInscriptos(null);
    };

    const getStatusBadge = (status) => {
        return status === 'active' ? '🟢 Activa' : '🔴 Inactiva';
    };

    const getTypeBadge = (type) => {
        // Normaliza acentos para que "Pública"/"Privada" coincidan correctamente
        const t = (type || '')
            .toString()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
        if (t.includes('publica')) return '🏛️ Pública';
        if (t.includes('privada')) return '🏢 Privada';
        return type;
    };

    if (loading && universidades.length === 0) {
        return (
            <div className="ministerio-loading">
                <div className="spinner"></div>
                <p>Cargando datos del sistema...</p>
            </div>
        );
    }

    return (
        <div className="ministerio-container">
            {/* Header */}
            <header className="ministerio-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1>🏛️ Ministerio de Educación</h1>
                        <p>Panel de Supervisión Nacional - EduScale</p>
                    </div>
                    <div className="header-right">
                        <div className="user-info">
                            <span className="user-name">{user?.nombre} {user?.apellido}</span>
                            <span className="user-role">Super Admin</span>
                        </div>
                        <button onClick={logout} className="logout-button">
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </header>

            {/* Estadísticas Generales */}
            {estadisticas && (
                <div className="stats-section">
                    <h2>📊 Resumen Nacional</h2>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">🎓</div>
                            <div className="stat-content">
                                <h3>{estadisticas.total_universidades}</h3>
                                <p>Universidades Totales</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🏛️</div>
                            <div className="stat-content">
                                <h3>{estadisticas.universidades_publicas}</h3>
                                <p>Públicas</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🏢</div>
                            <div className="stat-content">
                                <h3>{estadisticas.universidades_privadas}</h3>
                                <p>Privadas</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📚</div>
                            <div className="stat-content">
                                <h3>{estadisticas.total_carreras}</h3>
                                <p>Carreras Totales</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">👥</div>
                            <div className="stat-content">
                                <h3>{estadisticas.total_cupos?.toLocaleString('es-AR')}</h3>
                                <p>Cupos Anuales</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabla de Universidades */}
            <div className="universidades-section">
                <div className="section-header">
                    <h2>🏛️ Universidades Registradas</h2>
                    <button onClick={loadUniversidades} className="refresh-button">
                        🔄 Actualizar
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        ⚠️ {error}
                    </div>
                )}

                <div className="table-container">
                    <table className="universidades-table">
                        <thead>
                            <tr>
                                <th>Universidad</th>
                                <th>Tipo</th>
                                <th>Ubicación</th>
                                <th>Estado</th>
                                <th>Carreras</th>
                                <th>Contacto</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {universidades.map((uni) => (
                                <tr key={uni.institution_id} className="table-row">
                                    <td>
                                        <div className="uni-name">
                                            <strong>{uni.institution.name}</strong>
                                            <span className="uni-short">{uni.institution.short_name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge type-badge">
                                            {getTypeBadge(uni.institution.type)}
                                        </span>
                                    </td>
                                    <td>
                                        {uni.institution.city}, {uni.institution.province}
                                    </td>
                                    <td>
                                        <span className={`badge status-badge status-${uni.status}`}>
                                            {getStatusBadge(uni.status)}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <span className="career-count">{uni.career_count}</span>
                                    </td>
                                    <td>
                                        <div className="contact-info">
                                            <div>📧 {uni.contact.email}</div>
                                            <div>📞 {uni.contact.phone}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => loadUniversidadDetails(uni.institution_id)}
                                            className="details-button"
                                        >
                                            Ver Detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalles */}
            {showDetails && selectedUniversidad && (
                <div className="modal-overlay" onClick={closeDetails}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedUniversidad.universidad.institution.name}</h2>
                            <button onClick={closeDetails} className="close-button">✕</button>
                        </div>

                        <div className="modal-body">
                            {/* Información General */}
                            <section className="detail-section">
                                <h3>📋 Información General</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <strong>Nombre Completo:</strong>
                                        <span>{selectedUniversidad.universidad.institution.name}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Nombre Corto:</strong>
                                        <span>{selectedUniversidad.universidad.institution.short_name}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Tipo:</strong>
                                        <span>{getTypeBadge(selectedUniversidad.universidad.institution.type)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Fundada:</strong>
                                        <span>{selectedUniversidad.universidad.institution.founded_year}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Ciudad:</strong>
                                        <span>{selectedUniversidad.universidad.institution.city}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Provincia:</strong>
                                        <span>{selectedUniversidad.universidad.institution.province}</span>
                                    </div>
                                </div>
                            </section>

                            {/* Contacto */}
                            <section className="detail-section">
                                <h3>📞 Contacto</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <strong>Dirección:</strong>
                                        <span>{selectedUniversidad.universidad.contact.address}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Email:</strong>
                                        <span>{selectedUniversidad.universidad.contact.email}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Teléfono:</strong>
                                        <span>{selectedUniversidad.universidad.contact.phone}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Website:</strong>
                                        <a href={selectedUniversidad.universidad.contact.website} target="_blank" rel="noopener noreferrer">
                                            {selectedUniversidad.universidad.contact.website}
                                        </a>
                                    </div>
                                </div>
                            </section>

                            {/* Estadísticas */}
                            <section className="detail-section">
                                <h3>📊 Estadísticas</h3>
                                <div className="stats-mini-grid">
                                    <div className="stat-mini">
                                        <h4>{selectedUniversidad.estadisticas.total_careers}</h4>
                                        <p>Carreras</p>
                                    </div>
                                    <div className="stat-mini">
                                        <h4>{selectedUniversidad.estadisticas.total_cupos?.toLocaleString('es-AR')}</h4>
                                        <p>Cupos Totales</p>
                                    </div>
                                    <div className="stat-mini">
                                        <h4>{selectedUniversidad.estadisticas.careers_with_scholarship}</h4>
                                        <p>Con Becas</p>
                                    </div>
                                </div>
                            </section>

                            {/* Carreras */}
                            <section className="detail-section">
                                <h3>🎓 Carreras Ofrecidas ({selectedUniversidad.universidad.careers.length})</h3>
                                <div className="careers-list">
                                    {selectedUniversidad.universidad.careers.map((career, index) => (
                                        <div key={index} className="career-card">
                                            <div className="career-header">
                                                <h4>{career.name}</h4>
                                                <span className="career-code">{career.code}</span>
                                            </div>
                                            <div className="career-info">
                                                <p><strong>Facultad:</strong> {career.faculty}</p>
                                                <p><strong>Título:</strong> {career.degree_title}</p>
                                                <p><strong>Duración:</strong> {career.duration_years} años</p>
                                                <p><strong>Modalidad:</strong> {career.modality}</p>
                                                <p><strong>Cupo Anual:</strong> {career.cupo_anual?.toLocaleString('es-AR')}</p>
                                                {career.scholarship_available && (
                                                    <p className="scholarship-badge">
                                                        💰 Becas disponibles: {career.scholarship_percentage.join('%, ')}%
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Inscriptos */}
                            {inscriptos && (
                                <section className="detail-section">
                                    <h3>👥 Inscriptos</h3>
                                    <div className="stats-mini-grid">
                                        <div className="stat-mini neutral">
                                            <h4>{inscriptos.total_alumnos}</h4>
                                            <p>Total de alumnos</p>
                                        </div>
                                    </div>
                                    <div className="table-container minimal">
                                        <table className="universidades-table">
                                            <thead>
                                                <tr>
                                                    <th>Carrera</th>
                                                    <th className="text-right">Total</th>
                                                    <th className="text-right">Matriculados</th>
                                                    <th className="text-right">Aceptados</th>
                                                    <th className="text-right">En revisión</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {inscriptos.por_carrera.map((c) => (
                                                    <tr key={c.career_id}>
                                                        <td>{c.career_name || c.career_id}</td>
                                                        <td className="text-right"><strong>{c.count}</strong></td>
                                                        <td className="text-right">{c.por_estado?.matriculado || 0}</td>
                                                        <td className="text-right">{c.por_estado?.aceptado || 0}</td>
                                                        <td className="text-right">{c.por_estado?.en_revision || 0}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {/* Dashboard Config */}
                            <section className="detail-section">
                                <h3>⚙️ Configuración de Etapas</h3>
                                <div className="tabs-list">
                                    {selectedUniversidad.universidad.dashboard.tabs_enabled.map((tab, index) => (
                                        <div key={index} className="tab-item">
                                            <span className="tab-name">{tab.name}</span>
                                            <span className="tab-phase">{tab.phase}</span>
                                            <span className="tab-source">DB: {tab.source.toUpperCase()}</span>
                                            <span className={`tab-status ${tab.enabled ? 'enabled' : 'disabled'}`}>
                                                {tab.enabled ? '✅ Habilitado' : '❌ Deshabilitado'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}

            <footer className="ministerio-footer">
                <p>TPO - Ingeniería de Datos II | Sistema de Supervisión Nacional</p>
            </footer>
        </div>
    );
}

export default MinisterioDashboard;
