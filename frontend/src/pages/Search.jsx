import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logoNegativo from '../assets/logo negativo-8.png';
import ParticlesBackground from '../components/ParticlesBackground';
import { supabase } from '../supabaseClient';

export default function Search() {
  const [subjects, setSubjects] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState('');
  
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuthData = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        navigate('/login');
        return;
      }

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);
      loadFiltersAndTutors();
    };

    fetchAuthData();
  }, [navigate]);

  const loadFiltersAndTutors = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Load subjects
      try {
        const subRes = await fetch(`${import.meta.env.VITE_API_URL}/subjects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubjects(subData);
        }
      } catch (e) {
        const { data: dbSub } = await supabase.from('subjects').select('*').order('name');
        if (dbSub) setSubjects(dbSub);
      }

      // Load professors
      try {
        const profRes = await fetch(`${import.meta.env.VITE_API_URL}/professors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profRes.ok) {
          const profData = await profRes.json();
          setProfessors(profData);
        }
      } catch (e) {
        const { data: dbProf } = await supabase.from('professors').select('*').order('name');
        if (dbProf) setProfessors(dbProf);
      }

      // Load initial approved tutors from Supabase
      const { data: approvedData } = await supabase
        .from('tutors')
        .select(`
          id,
          bio,
          status,
          users ( full_name, email, avatar_url, phone_number ),
          tutor_subjects (
            price_per_hour,
            subjects ( id, name ),
            professors ( id, name )
          )
        `)
        .eq('status', 'approved');

      if (approvedData) {
        const mappedTutors = approvedData.map(t => ({
          tutor_id: t.id,
          full_name: t.users?.full_name || 'Tutor Referente',
          email: t.users?.email,
          phone_number: t.users?.phone_number,
          bio: t.bio,
          avatar_url: t.users?.avatar_url,
          rating_avg: 9.50,
          price_per_hour: t.tutor_subjects?.[0]?.price_per_hour || 5.00,
          subject_name: t.tutor_subjects?.[0]?.subjects?.name || 'Diseño Gráfico',
          professor_name: t.tutor_subjects?.[0]?.professors?.name || 'Docente UNACH'
        }));
        setTutors(mappedTutors);
      }
    } catch (err) {
      console.error('Error loading filters and tutors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const params = new URLSearchParams();
      if (selectedSubject) params.append('subject_id', selectedSubject);
      if (selectedProfessor) params.append('professor_id', selectedProfessor);

      let fetchedTutors = null;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/tutors/search?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          fetchedTutors = await res.json();
        }
      } catch (apiErr) {
        console.warn('API search error, fallback to direct Supabase query:', apiErr);
      }

      if (!fetchedTutors) {
        // Direct Supabase query
        const { data: approvedData } = await supabase
          .from('tutors')
          .select(`
            id,
            bio,
            status,
            users ( full_name, email, avatar_url, phone_number ),
            tutor_subjects (
              price_per_hour,
              subjects ( id, name ),
              professors ( id, name )
            )
          `)
          .eq('status', 'approved');

        if (approvedData) {
          fetchedTutors = approvedData
            .filter(t => {
              if (!selectedSubject) return true;
              return t.tutor_subjects?.some(ts => ts.subjects?.id === parseInt(selectedSubject));
            })
            .map(t => ({
              tutor_id: t.id,
              full_name: t.users?.full_name || 'Tutor Referente',
              email: t.users?.email,
              phone_number: t.users?.phone_number,
              bio: t.bio,
              avatar_url: t.users?.avatar_url,
              rating_avg: 9.50,
              price_per_hour: t.tutor_subjects?.[0]?.price_per_hour || 5.00,
              subject_name: t.tutor_subjects?.[0]?.subjects?.name || 'Diseño Gráfico',
              professor_name: t.tutor_subjects?.[0]?.professors?.name || 'Docente UNACH'
            }));
        }
      }

      setTutors(fetchedTutors || []);
    } catch (err) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppUrl = (phone, tutorName, subjectName) => {
    let cleanPhone = phone || '593999999999';
    if (cleanPhone.startsWith('0')) cleanPhone = '593' + cleanPhone.substring(1);
    if (!cleanPhone.startsWith('593')) cleanPhone = '593' + cleanPhone;
    const msg = `Hola ${tutorName}, vi tu perfil en UNACH-Connect y me gustaría agendar una tutoría para la materia ${subjectName || 'Diseño Gráfico'}.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!profile) return null;

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
          <Link to="/contributions" className="nav-link" style={{ marginRight: '15px', color: '#FF5E13', fontWeight: 'bold' }}>Foro Académico</Link>
          <Link to="/dashboard" className="nav-link" style={{ marginRight: '15px' }}>Ir a mi Panel</Link>
          <span className="user-welcome" style={{ marginRight: '15px' }}>{profile.full_name}</span>
          <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
        </nav>
      </header>

      {/* Main Search Panel */}
      <main className="dashboard-main" style={{ maxWidth: '950px', margin: '0 auto', width: '100%', padding: '20px' }}>
        
        <div className="dashboard-card wide-card" style={{ marginBottom: '25px', textAlign: 'center' }}>
          <h1 style={{ color: '#fff', fontSize: '2.2rem', marginBottom: '10px' }}>Tutores Aprobados de Diseño Gráfico</h1>
          <p className="card-desc" style={{ maxWidth: '650px', margin: '0 auto' }}>
            Encuentra referentes de semestres superiores que aprobaron con los mismos docentes de la UNACH.
          </p>
        </div>

        {error && (
          <div className="auth-alert error-alert" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">{error}</span>
          </div>
        )}

        {/* Buscador Formulario */}
        <div className="dashboard-card" style={{ marginBottom: '30px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              
              {/* Asignatura Select */}
              <div style={{ flex: '1', minWidth: '220px' }}>
                <label style={{ display: 'block', color: 'var(--accent-cyan)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>
                  Filtrar por Materia
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="">Todas las Materias de Diseño Gráfico</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              {/* Docente Select */}
              <div style={{ flex: '1', minWidth: '220px' }}>
                <label style={{ display: 'block', color: 'var(--accent-cyan)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>
                  Filtrar por Docente (Opcional)
                </label>
                <select
                  value={selectedProfessor}
                  onChange={(e) => setSelectedProfessor(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="">Cualquier Docente UNACH</option>
                  {professors.map((prof) => (
                    <option key={prof.id} value={prof.id}>{prof.name}</option>
                  ))}
                </select>
              </div>

            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'center', minWidth: '220px', fontSize: '1rem' }} disabled={loading}>
              {loading ? 'Buscando...' : '🔍 Buscar Tutores'}
            </button>
          </form>
        </div>

        {/* Resultados de búsqueda */}
        <div>
          <h2 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.5rem' }}>Lista de Tutores Verificados</h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>Cargando tutores...</h3>
            </div>
          ) : tutors.length === 0 ? (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🌟</span>
              <h3>No se encontraron tutores para este filtro.</h3>
              <p>Prueba seleccionando otra asignatura o docente.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              {tutors.map((tutor) => (
                <div 
                  key={tutor.tutor_id} 
                  className="dashboard-card" 
                  style={{ 
                    position: 'relative',
                    background: 'var(--glass-surface)',
                    border: '1.5px solid var(--glass-border)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Avatar */}
                    <div 
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: '#fff',
                        fontSize: '1.6rem',
                        overflow: 'hidden'
                      }}
                    >
                      {tutor.avatar_url ? (
                        <img src={tutor.avatar_url} alt={tutor.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        tutor.full_name.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Bio & Details */}
                    <div style={{ flex: '1', minWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h3 style={{ color: '#fff', fontSize: '1.3rem', margin: 0 }}>{tutor.full_name}</h3>
                        <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '1px solid #10B981', fontSize: '0.75rem', fontWeight: 'bold', padding: '3px 10px', borderRadius: '12px' }}>
                          ✓ Aprobado
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', margin: '8px 0', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>📚 {tutor.subject_name || 'Diseño Gráfico'}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>•</span>
                        <span style={{ color: '#FCD34D', fontWeight: 'bold' }}>⭐ Nota: 9.5/10</span>
                        <span style={{ color: 'var(--text-secondary)' }}>•</span>
                        <span style={{ color: '#34D399', fontWeight: 'bold' }}>{parseFloat(tutor.price_per_hour).toFixed(2)} UNACH-Credits/h</span>
                      </div>

                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                        {tutor.bio || 'Sin biografía disponible.'}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '160px' }}>
                      <a 
                        href={getWhatsAppUrl(tutor.phone_number, tutor.full_name, tutor.subject_name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{ textAlign: 'center', backgroundColor: '#25D366', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)', fontSize: '0.85rem', padding: '10px' }}
                      >
                        💬 WhatsApp
                      </a>
                      <Link to={`/tutors/${tutor.tutor_id}`} className="btn-secondary" style={{ textAlign: 'center', fontSize: '0.85rem', padding: '10px' }}>
                        Ver Perfil
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
