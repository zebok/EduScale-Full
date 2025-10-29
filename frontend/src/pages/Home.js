import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <main className="home">
      <section className="home-hero">
        <h1>Bienvenido a 🎓 EduScale</h1>
        <p>Impulsamos la experiencia universitaria con procesos simples y una plataforma que escala contigo.</p>
      </section>
      <section className="home-options">
        <article className="home-card">
          <h2>Quiero inscribirme en una universidad</h2>
          <p>Creá tu solicitud y encontrá la institución que mejor se adapta a tus objetivos académicos.</p>
          <Link className="home-button" to="/application-form">Completar formulario</Link>
        </article>
        <article className="home-card">
          <h2>Ya soy parte de una universidad</h2>
          <p>Accedé al panel administrativo para gestionar admisiones, matrículas y relaciones institucionales.</p>
          <Link className="home-button home-button--secondary" to="/login">Ir al inicio de sesión</Link>
        </article>
      </section>
    </main>
  );
};

export default Home;
