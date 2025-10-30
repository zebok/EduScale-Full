import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" className="brand">
            <span className="brand-logo">🎓</span>
            <span className="brand-name">EduScale</span>
          </Link>
          <nav className="site-nav">
            <Link to="/application-form" className="nav-link">Inscripción</Link>
            <Link to="/login" className="nav-link nav-link--cta">Iniciar sesión</Link>
          </nav>
        </div>
      </header>

      <main className="home-main">
        <section className="home-hero">
          <h1>Bienvenido a EduScale</h1>
          <p>Impulsamos la experiencia universitaria con procesos simples y una plataforma que escala contigo.</p>
          <div className="hero-actions">
            <Link className="home-button" to="/more-info">Ver Universidades</Link>
            <Link className="home-button home-button--secondary" to="/application-form">Completar formulario</Link>
          </div>
        </section>

        <section className="home-features">
          <article className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Admisión</h3>
            <p>Centralizá solicitudes, evaluaciones y decisiones en un flujo claro y auditable.</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Prospección</h3>
            <p>Analizá el funnel completo con tableros para marketing y captación.</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Matrícula</h3>
            <p>Automatizá la inscripción y el alta de estudiantes con validaciones inteligentes.</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>Relaciones</h3>
            <p>Gestioná convenios, derivaciones y vínculos institucionales con transparencia.</p>
          </article>
        </section>
      </main>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} EduScale · Hecho con foco en la experiencia</p>
      </footer>
    </div>
  );
};

export default Home;
