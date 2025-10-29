import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Prospection from './components/Prospection';
import Admission from './components/Admission';
import Enrollment from './components/Enrollment';
import Relations from './components/Relations';

function App() {
  const [dbStatus, setDbStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setDbStatus(data);
    } catch (error) {
      console.error('Error checking database status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>🎓 EduScale</h1>
          <p>Plataforma SaaS White-Label para Gestión de Admisiones</p>
        </header>

        <nav className="App-nav">
          <Link to="/">Fase A: Prospección</Link>
          <Link to="/admission">Fase B: Admisión</Link>
          <Link to="/enrollment">Fase C: Inscripción</Link>
          <Link to="/relations">Relaciones</Link>
        </nav>

        <div className="database-status">
          <h3>Estado de Bases de Datos</h3>
          {loading ? (
            <p>Verificando conexiones...</p>
          ) : (
            <div className="status-grid">
              <div className={`status-card ${dbStatus.redis ? 'connected' : 'disconnected'}`}>
                <span className="db-icon">🔴</span>
                <span>Redis</span>
                <span className="status-indicator">{dbStatus.redis ? '✓' : '✗'}</span>
              </div>
              <div className={`status-card ${dbStatus.mongodb ? 'connected' : 'disconnected'}`}>
                <span className="db-icon">🍃</span>
                <span>MongoDB</span>
                <span className="status-indicator">{dbStatus.mongodb ? '✓' : '✗'}</span>
              </div>
              <div className={`status-card ${dbStatus.cassandra ? 'connected' : 'disconnected'}`}>
                <span className="db-icon">📊</span>
                <span>Cassandra</span>
                <span className="status-indicator">{dbStatus.cassandra ? '✓' : '✗'}</span>
              </div>
              <div className={`status-card ${dbStatus.neo4j ? 'connected' : 'disconnected'}`}>
                <span className="db-icon">🔗</span>
                <span>Neo4j</span>
                <span className="status-indicator">{dbStatus.neo4j ? '✓' : '✗'}</span>
              </div>
            </div>
          )}
        </div>

        <main className="App-main">
          <Routes>
            <Route path="/" element={<Prospection />} />
            <Route path="/admission" element={<Admission />} />
            <Route path="/enrollment" element={<Enrollment />} />
            <Route path="/relations" element={<Relations />} />
          </Routes>
        </main>

        <footer className="App-footer">
          <p>TPO - Ingeniería II | Persistencia Políglota</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
