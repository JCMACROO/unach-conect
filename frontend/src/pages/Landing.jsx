import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoNegativo from '../assets/logo negativo-8.png';
import ParticlesBackground from '../components/ParticlesBackground';
import { supabase } from '../supabaseClient';

export default function Landing() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <div className="landing-container">
      <ParticlesBackground />
      
      {/* Header */}
      <header className="landing-header">
        <div className="brand">
          <img src={logoNegativo} alt="UNACH-Connect Logo" className="brand-logo" />
          <span className="brand-title">UNACH-Connect</span>
        </div>
        <nav className="landing-nav">
          {user ? (
            <>
              <Link to="/contributions" className="nav-link" style={{ marginRight: '15px', color: '#FF5E13', fontWeight: 'bold' }}>Foro Académico</Link>
              <Link to="/dashboard" className="nav-link" style={{ marginRight: '15px' }}>Ir al Panel</Link>
              <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Iniciar Sesión</Link>
              <Link to="/register" className="nav-btn">Regístrate</Link>
            </>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="landing-main">
        {/* TOFU: Hero Section */}
        <section className="hero-section">
          <h1 className="hero-title">
            ¿El examen de <span className="highlight">Tipografía</span> es mañana y el tutorial de YouTube no te salvó?
          </h1>
          <p className="hero-subtitle">
            Conéctate con estudiantes de semestres superiores de Diseño Gráfico que ya aprobaron con tus mismos docentes y conocen su metodología exacta.
          </p>
          <div className="cta-group">
            {user ? (
              <>
                <Link to="/dashboard" className="cta-primary">Ir a mi Panel</Link>
                <Link to="/dashboard" className="cta-secondary">Buscar Tutores</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="cta-primary">Empezar Ahora</Link>
                <Link to="/login" className="cta-secondary">Buscar Tutores</Link>
              </>
            )}
          </div>
        </section>

        {/* MOFU: Value Proposition */}
        <section className="value-section">
          <h2 className="section-title">Tu Éxito es Colectivo</h2>
          <div className="grid-cards">
            <div className="value-card">
              <div className="card-icon">🎯</div>
              <h3>Filtros Hiper-Localizados</h3>
              <p>Busca tutores no solo por materia, sino por el docente de la UNACH que dicta la asignatura. Sin rodeos.</p>
            </div>
            <div className="value-card">
              <div className="card-icon">⚡</div>
              <h3>Agendamiento Fricción Cero</h3>
              <p>Agenda tu tutoría instantáneamente a través de WhatsApp Business en menos de 5 minutos.</p>
            </div>
            <div className="value-card">
              <div className="card-icon">💳</div>
              <h3>UNACH-Credits</h3>
              <p>Monetiza tus conocimientos dando tutorías y canjea tus créditos en ploteos, impresiones y librerías técnicas aliadas.</p>
            </div>
          </div>
        </section>

        {/* BOFU: Social Proof */}
        <section className="testimonials-section">
          <h2 className="section-title">Historias de Éxito</h2>
          <div className="grid-testimonials">
            <div className="testimonial-card">
              <p className="comment">"Estaba al borde de perder la gratuidad en Geometría Descriptiva. Conseguí un tutor que la pasó con el mismo inge y subí mi nota de 4 a 9.5."</p>
              <h4 className="author">Mateo S. — 3er Semestre</h4>
            </div>
            <div className="testimonial-card">
              <p className="comment">"Como tutora puedo ayudar a mis compañeros y mis ploteos de fin de ciclo me salen gratis canjeando mis UNACH-Credits."</p>
              <h4 className="author">Sofía G. — 6to Semestre (Tutora)</h4>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} UNACH-Connect. Diseñado para la carrera de Diseño Gráfico.</p>
        <p className="footer-tagline">"Tu éxito es colectivo"</p>
      </footer>
    </div>
  );
}
