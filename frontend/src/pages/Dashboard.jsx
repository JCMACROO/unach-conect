import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logoNegativo from '../assets/logo negativo-8.png';
import ParticlesBackground from '../components/ParticlesBackground';
import { supabase } from '../supabaseClient';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(0.00);
  const [tutorStatus, setTutorStatus] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          navigate('/login');
          return;
        }

        // 1. Get profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // 2. Get wallet balance
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        if (walletData) {
          setBalance(parseFloat(walletData.balance));
        }

        // 3. Get tutor status
        const { data: tutorData } = await supabase
          .from('tutors')
          .select('status')
          .eq('id', user.id)
          .single();

        if (tutorData) {
          setTutorStatus(tutorData.status);
        }

        // 4. Get tutoring sessions
        const { data: sessionsData } = await supabase
          .from('tutoring_sessions')
          .select(`
            id,
            status,
            scheduled_at,
            subjects ( name ),
            tutors ( id )
          `)
          .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
          .order('scheduled_at', { ascending: false });

        if (sessionsData) {
          // Resolve tutor/student names dynamically
          const resolvedSessions = await Promise.all(
            sessionsData.map(async (session) => {
              const { data: tutorProfile } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', session.tutors?.id)
                .single();

              return {
                id: session.id,
                subject: session.subjects?.name || 'Materia general',
                tutorName: tutorProfile?.full_name || 'Desconocido',
                date: new Date(session.scheduled_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }),
                status: session.status
              };
            })
          );
          setSessions(resolvedSessions);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="auth-container">
        <ParticlesBackground />
        <div style={{ textalign: 'center' }}>
          <h2>Cargando Dashboard...</h2>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="dashboard-container">
      <ParticlesBackground />
      
      {/* Header */}
      <header className="landing-header">
        <div className="brand">
          <Link to="/" className="brand-link">
            <img src={logoNegativo} alt="UNACH-Connect Logo" className="brand-logo" />
            <span className="brand-title">UNACH-Connect</span>
          </Link>
        </div>
        <nav className="landing-nav">
          <span className="user-welcome">Hola, {profile.full_name}</span>
          <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
        </nav>
      </header>

      {/* Main Panel */}
      <main className="dashboard-main">
        <div className="dashboard-grid">
          {/* Left panel: Balance & Quick Stats */}
          <div className="dashboard-card promo-card">
            <h2>Mi Billetera</h2>
            <div className="credit-display">
              <span className="credit-amount">{balance.toFixed(2)}</span>
              <span className="credit-label">UNACH-Credits</span>
            </div>
            <p className="card-desc">Úsalos para agendar tutorías o canjéalos por ploteos e impresiones en locales asociados.</p>
            <div className="action-buttons">
              <Link to="/search" className="btn-primary">Buscar Tutor</Link>
              <button className="btn-secondary" onClick={() => alert('Código QR generado para canjear en ploteos: Código 4402-UNACH')}>Generar Código de Canje</button>
            </div>
          </div>

          {/* Right panel: Tutor status & applications */}
          <div className="dashboard-card status-card">
            <h2>Postular como Tutor</h2>
            <p className="card-desc">¿Aprobaste una materia crítica con excelente nota y deseas ganar créditos ayudando a tus compañeros?</p>
            
            <div className="tutor-badge pending-badge">
              <span>Rol actual: {tutorStatus === 'approved' ? 'Tutor Referente' : 'Alumno'}</span>
            </div>

            <div className="tutor-application-promo">
              {tutorStatus === 'pending' && (
                <p style={{ color: 'var(--warning)', fontWeight: 'bold' }}>⚠️ Tu postulación está siendo revisada por la administración.</p>
              )}
              {tutorStatus === 'approved' && (
                <p style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓ ¡Eres un Tutor Aprobado! Ya puedes dictar clases y recibir créditos.</p>
              )}
              {(!tutorStatus || tutorStatus === 'suspended') && (
                <>
                  <p>Conviértete en "Referente" de la facultad. Se requiere una nota mínima de 8.5/10 y subir tu reporte de calificaciones (Kardex).</p>
                  <Link to="/tutor/apply" className="btn-primary">Iniciar Postulación</Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Panel: Recent sessions */}
        <div className="dashboard-card wide-card">
          <h2>Mis Tutorías Recientes</h2>
          <div className="sessions-table-wrapper">
            {sessions.length === 0 ? (
              <p className="card-desc" style={{ textAlign: 'center', padding: '20px 0' }}>No tienes tutorías programadas o completadas en el sistema.</p>
            ) : (
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>Materia</th>
                    <th>Tutor / Alumno</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td>{session.subject}</td>
                      <td>{session.tutorName}</td>
                      <td>{session.date}</td>
                      <td>
                        <span className={`status-badge ${session.status}`}>
                          {session.status === 'requested' ? 'Solicitada' :
                           session.status === 'scheduled' ? 'Agendada' :
                           session.status === 'completed' ? 'Completada' : 'Cancelada'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
