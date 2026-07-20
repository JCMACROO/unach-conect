import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import logoNegativo from '../assets/logo negativo-8.png';
import ParticlesBackground from '../components/ParticlesBackground';
import { supabase } from '../supabaseClient';

export default function TutorProfile() {
  const { id } = useParams();
  const [tutor, setTutor] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        navigate('/login');
        return;
      }

      // Fetch student profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);
    };

    fetchUserData();
    loadTutorDetails();
  }, [id, navigate]);

  const loadTutorDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let fetchedTutor = null;
      let fetchedSubjects = null;

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/tutors/${id}`, {
          headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const text = await res.text();
          const data = JSON.parse(text);
          fetchedTutor = data.tutor;
          fetchedSubjects = data.subjects;
        }
      } catch (apiErr) {
        console.warn('API error, using direct Supabase query for tutor profile:', apiErr);
      }

      // Direct Supabase Fallback
      if (!fetchedTutor) {
        const { data: tutorData, error: dbErr } = await supabase
          .from('tutors')
          .select(`
            id,
            bio,
            portfolio_url,
            status,
            users ( full_name, email, avatar_url, phone_number ),
            tutor_subjects (
              price_per_hour,
              subject_id,
              subjects ( id, name, description ),
              professors ( id, name, department )
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (dbErr || !tutorData) {
          throw new Error('Tutor no encontrado.');
        }

        fetchedTutor = {
          id: tutorData.id,
          full_name: tutorData.users?.full_name || 'Tutor Referente',
          email: tutorData.users?.email || '',
          phone_number: tutorData.users?.phone_number || '',
          avatar_url: tutorData.users?.avatar_url || null,
          bio: tutorData.bio || 'Sin biografía disponible.',
          rating_avg: 9.50,
          price_per_hour: tutorData.tutor_subjects?.[0]?.price_per_hour || 5.00
        };

        fetchedSubjects = (tutorData.tutor_subjects || []).map(ts => ({
          subject_id: ts.subjects?.id,
          subject_name: ts.subjects?.name || 'Diseño Gráfico',
          subject_description: ts.subjects?.description || '',
          professor_name: ts.professors?.name || 'Docente UNACH',
          price_per_hour: ts.price_per_hour || 5.00
        }));
      }

      setTutor(fetchedTutor);
      setSubjects(fetchedSubjects || []);

      if (fetchedSubjects && fetchedSubjects.length > 0) {
        setSelectedSubjectId(fetchedSubjects[0].subject_id || fetchedSubjects[0].subject_name || '');
      }
    } catch (err) {
      console.error('Error loading tutor profile:', err);
      setError(err.message || 'Error al cargar la información del tutor.');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId || !scheduledAt) {
      setError('Por favor completa todos los campos para agendar.');
      return;
    }

    setError('');
    setBookingLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const chosenSubjectObj = subjects.find(s => s.subject_name === selectedSubjectId || s.subject_id === parseInt(selectedSubjectId));
      
      let apiSuccess = false;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/tutoring-sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            tutor_id: id,
            subject_id: chosenSubjectObj ? chosenSubjectObj.subject_id : selectedSubjectId,
            scheduled_at: scheduledAt
          })
        });

        if (res.ok) {
          apiSuccess = true;
        }
      } catch (apiErr) {
        console.warn('API booking error, fallback to direct Supabase insert:', apiErr);
      }

      if (!apiSuccess) {
        const { error: sessionErr } = await supabase
          .from('tutoring_sessions')
          .insert({
            student_id: profile.id,
            tutor_id: id,
            subject_id: chosenSubjectObj?.subject_id || 1,
            scheduled_at: scheduledAt,
            status: 'scheduled'
          });

        if (sessionErr) throw sessionErr;
      }

      setSuccess('Sesión de tutoría registrada con éxito.');
      setIsModalOpen(false);

      // REDIRECT TO WHATSAPP
      const formattedDate = new Date(scheduledAt).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });

      const subjectName = chosenSubjectObj ? chosenSubjectObj.subject_name : 'Tutoría';
      const profName = chosenSubjectObj ? chosenSubjectObj.professor_name : '';
      
      const message = `¡Hola ${tutor.full_name}! Vi tu perfil en UNACH-Connect. Acabo de solicitar una tutoría de ${subjectName} con el docente ${profName} programada para el ${formattedDate}. ¿Confirmas disponibilidad para coordinar los detalles?`;

      let phone = tutor.phone_number || '';
      if (phone.startsWith('0')) {
        phone = '593' + phone.substring(1);
      } else if (!phone.startsWith('593') && phone.length > 0) {
        phone = '593' + phone;
      } else if (!phone) {
        phone = '593999999999';
      }

      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      setError(err.message || 'Error al agendar.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="auth-container">
        <ParticlesBackground />
        <div style={{ textAlign: 'center' }}>
          <h2>Cargando perfil del tutor...</h2>
        </div>
      </div>
    );
  }

  if (error && !tutor) {
    return (
      <div className="auth-container">
        <ParticlesBackground />
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h2>Error</h2>
          <p style={{ color: 'var(--error)', margin: '15px 0' }}>{error}</p>
          <Link to="/search" className="btn-primary">Volver al buscador</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <ParticlesBackground />

      {/* Header */}
      <header className="landing-header">
        <div className="brand">
          <Link to="/" className="brand-link">
            <img src={logoNegativo} alt="UNACH-Connect Logo" className="brand-logo" />
          </Link>
        </div>
        <nav className="landing-nav">
          <Link to="/search" className="nav-link" style={{ marginRight: '15px' }}>Buscador</Link>
          <Link to="/dashboard" className="nav-link" style={{ marginRight: '15px' }}>Ir a mi Panel</Link>
          <span className="user-welcome" style={{ marginRight: '15px' }}>{profile.full_name}</span>
          <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
        </nav>
      </header>

      {/* Main Profile Info */}
      <main className="dashboard-main" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '20px' }}>
        
        {error && (
          <div className="auth-alert error-alert" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-alert success-alert" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">✓</span>
            <span className="alert-text">{success}</span>
          </div>
        )}

        {/* Card de Presentación */}
        <div className="dashboard-card" style={{ marginBottom: '30px', padding: '30px' }}>
          <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '25px' }}>
            
            {/* Avatar */}
            <div 
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: '#fff',
                fontSize: '2rem',
                overflow: 'hidden'
              }}
            >
              {tutor.avatar_url ? (
                <img src={tutor.avatar_url} alt={tutor.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                tutor.full_name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Info */}
            <div style={{ flex: '1', minWidth: '250px' }}>
              <h1 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '6px' }}>{tutor.full_name}</h1>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: 'var(--warning)', fontWeight: 'bold', fontSize: '1.05rem' }}>⭐ {parseFloat(tutor.rating_avg).toFixed(2)}</span>
                <span style={{ color: 'var(--text-secondary)' }}>•</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Referente de la Carrera</span>
              </div>
              <a 
                href={tutor.portfolio_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="auth-link" 
                style={{ fontSize: '0.9rem', color: '#10B981', textDecoration: 'underline', fontWeight: '500' }}
              >
                📄 Descargar Kardex / Portafolio Aprobado
              </a>
            </div>

            {/* Action */}
            <div>
              <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '12px 25px', fontSize: '1rem' }}>
                📅 Agendar Tutoría
              </button>
            </div>

          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
            <h3 style={{ color: '#fff', marginBottom: '10px', fontSize: '1.1rem' }}>Sobre Mí</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
              {tutor.bio || 'Este tutor aún no ha ingresado una biografía.'}
            </p>
          </div>
        </div>

        {/* Listado de Asignaturas de este Tutor */}
        <div className="dashboard-card wide-card">
          <h2 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.3rem' }}>Asignaturas Autorizadas y Tarifas</h2>
          
          <div className="sessions-table-wrapper">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>Asignatura</th>
                  <th>Docente con el que Aprobó</th>
                  <th>Tarifa por Hora</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{sub.subject_name}</td>
                    <td>{sub.professor_name}</td>
                    <td style={{ fontWeight: 'bold', color: '#a7f3d0' }}>
                      {parseFloat(sub.price_per_hour).toFixed(2)} UNACH-Credits
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Booking Modal */}
      {isModalOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div 
            className="auth-card" 
            style={{ 
              maxWidth: '480px', 
              width: '100%', 
              margin: '0', 
              background: 'var(--bg-card)', 
              border: '1px solid var(--glass-border)',
              position: 'relative' 
            }}
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              ×
            </button>

            <h2 style={{ color: '#fff', marginBottom: '8px' }}>Solicitar Tutoría</h2>
            <p className="auth-subtitle" style={{ marginBottom: '20px' }}>Reserva un espacio con {tutor.full_name}</p>

            <form onSubmit={handleBooking} className="auth-form">
              
              {/* Asignatura Select */}
              <div className="form-group">
                <label htmlFor="subject">¿Qué asignatura necesitas?</label>
                <select
                  id="subject"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  required
                  disabled={bookingLoading}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(10, 15, 29, 0.95)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  {subjects.map((sub, index) => (
                    <option key={index} value={sub.subject_id}>{sub.subject_name} ({sub.professor_name})</option>
                  ))}
                </select>
              </div>

              {/* Fecha / Hora */}
              <div className="form-group">
                <label htmlFor="date">Fecha y Hora Propuesta</label>
                <input
                  type="datetime-local"
                  id="date"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                  disabled={bookingLoading}
                  className="form-input"
                  style={{ color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
                <button type="submit" className="auth-submit-btn" disabled={bookingLoading} style={{ flex: '1', margin: 0 }}>
                  {bookingLoading ? 'Agendando...' : 'Proceder al WhatsApp'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="logout-btn" 
                  style={{ 
                    flex: '1', 
                    margin: 0, 
                    border: '1px solid var(--glass-border)', 
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: '#fff'
                  }}
                  disabled={bookingLoading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
