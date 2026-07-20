import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoNegativo from '../assets/logo negativo-8.png';
import ParticlesBackground from '../components/ParticlesBackground';
import { supabase } from '../supabaseClient';

export default function Landing() {
  const [user, setUser] = useState(null);
  const [approvedTutors, setApprovedTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    const fetchApprovedTutors = async () => {
      setLoadingTutors(true);
      try {
        const { data, error } = await supabase
          .from('tutors')
          .select(`
            id,
            bio,
            portfolio_url,
            status,
            users ( full_name, email, avatar_url, phone_number ),
            tutor_subjects (
              price_per_hour,
              subjects ( name ),
              professors ( name )
            )
          `)
          .eq('status', 'approved');

        if (!error && data) {
          setApprovedTutors(data);
        }
      } catch (err) {
        console.error('Error fetching approved tutors:', err);
      } finally {
        setLoadingTutors(false);
      }
    };

    checkUser();
    fetchApprovedTutors();

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

  const getWhatsAppUrl = (phone, tutorName, subjectName) => {
    let cleanPhone = phone || '593999999999';
    if (cleanPhone.startsWith('0')) cleanPhone = '593' + cleanPhone.substring(1);
    if (!cleanPhone.startsWith('593')) cleanPhone = '593' + cleanPhone;
    const msg = `Hola ${tutorName}, vi tu perfil en UNACH-Connect y me gustaría agendar una tutoría para la materia ${subjectName || 'Diseño Gráfico'}.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="landing-container">
      <ParticlesBackground />
      
      {/* Header */}
      <header className="landing-header">
        <div className="brand">
          <Link to="/" className="brand-link">
            <img src={logoNegativo} alt="UNACH-Connect Logo" className="brand-logo" />
          </Link>
        </div>
        <nav className="landing-nav">
          <Link to={user ? "/search" : "/login"} className="nav-link" style={{ marginRight: '15px', color: '#00D2FF', fontWeight: 'bold' }}>
            👥 Tutores
          </Link>
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
                <Link to="/search" className="cta-secondary">Buscar Tutores</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="cta-primary">Empezar Ahora</Link>
                <Link to="/search" className="cta-secondary">Buscar Tutores</Link>
              </>
            )}
          </div>
        </section>

        {/* SECTION: TUTORES APROBADOS DE DISEÑO GRÁFICO */}
        <section className="value-section" style={{ marginTop: '20px' }}>
          <h2 className="section-title">🎓 Tutores Aprobados de Diseño Gráfico</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '-30px', marginBottom: '40px' }}>
            Estudiantes referentes verificados con notas superiores a 8.5/10
          </p>

          {loadingTutors ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando tutores disponibles...</p>
          ) : approvedTutors.length === 0 ? (
            <div className="value-card" style={{ textAlign: 'center', padding: '40px' }}>
              <span style={{ fontSize: '3rem' }}>🌟</span>
              <h3>No hay tutores registrados aún.</h3>
              <p>Los tutores aprobados por la coordinación aparecerán aquí automáticamente.</p>
            </div>
          ) : (
            <div className="grid-cards">
              {approvedTutors.map((tutor) => {
                const subject = tutor.tutor_subjects?.[0]?.subjects?.name || 'Diseño Gráfico';
                const professor = tutor.tutor_subjects?.[0]?.professors?.name || 'Docente UNACH';
                const price = tutor.tutor_subjects?.[0]?.price_per_hour || 5.00;
                const name = tutor.users?.full_name || 'Tutor Referente';
                const phone = tutor.users?.phone_number;

                return (
                  <div key={tutor.id} className="value-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <div 
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            color: '#fff',
                            fontSize: '1.4rem'
                          }}
                        >
                          {tutor.users?.avatar_url ? (
                            <img src={tutor.users.avatar_url} alt={name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{name}</h3>
                          <span style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: 'bold' }}>✓ Tutor Aprobado</span>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(0, 210, 255, 0.1)', padding: '12px', borderRadius: '12px', marginBottom: '14px', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
                        <div style={{ color: '#00D2FF', fontSize: '0.85rem', fontWeight: 'bold' }}>📚 Materia: {subject}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>👨‍🏫 Docente: {professor}</div>
                      </div>

                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                        {tutor.bio || 'Especialista en tutorías académicas de Diseño Gráfico.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <a 
                        href={getWhatsAppUrl(phone, name, subject)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{ flex: '1', minWidth: '130px', textAlign: 'center', backgroundColor: '#25D366', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)', fontSize: '0.85rem', padding: '10px 14px' }}
                      >
                        💬 WhatsApp
                      </a>
                      <Link 
                        to={user ? `/tutors/${tutor.id}` : '/login'}
                        className="btn-secondary"
                        style={{ flex: '1', minWidth: '130px', textAlign: 'center', fontSize: '0.85rem', padding: '10px 14px' }}
                      >
                        Ver Perfil
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
    </div>
  );
}
