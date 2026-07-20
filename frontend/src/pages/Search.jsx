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
  const [searching, setSearching] = useState(false);
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
      loadFilters();
    };

    fetchAuthData();
  }, [navigate]);

  const loadFilters = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Load subjects
      const subRes = await fetch(`${import.meta.env.VITE_API_URL}/subjects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubjects(subData);
      }

      // Load professors
      const profRes = await fetch(`${import.meta.env.VITE_API_URL}/professors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfessors(profData);
      }
    } catch (err) {
      console.error('Error loading filters:', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!selectedSubject) {
      setError('Por favor selecciona una asignatura para buscar.');
      return;
    }

    setError('');
    setLoading(true);
    setSearching(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const params = new URLSearchParams();
      params.append('subject_id', selectedSubject);
      if (selectedProfessor) {
        params.append('professor_id', selectedProfessor);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/tutors/search?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Error al buscar tutores en el servidor.');
      }

      const data = await res.json();
      setTutors(data);
    } catch (err) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
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
          <Link to="/contributions" className="nav-link" style={{ marginRight: '15px' }}>Foro Académico</Link>
          <Link to="/dashboard" className="nav-link" style={{ marginRight: '15px' }}>Ir a mi Panel</Link>
          <span className="user-welcome" style={{ marginRight: '15px' }}>{profile.full_name}</span>
          <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
        </nav>
      </header>

      {/* Main Search Panel */}
      <main className="dashboard-main" style={{ maxWidth: '900px', margin: '0 auto', width: '100%', padding: '20px' }}>
        
        <div className="dashboard-card wide-card" style={{ marginBottom: '25px', textAlign: 'center' }}>
          <h1 style={{ color: '#fff', fontSize: '2rem', marginBottom: '10px' }}>Buscar Tutores de Diseño Gráfico</h1>
          <p className="card-desc" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Filtra por asignatura y por el docente específico de la UNACH para encontrar un referente que conozca la metodología exacta.
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
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                  ¿Qué materia necesitas aprobar? *
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    backgroundColor: 'rgba(10, 15, 29, 0.95)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Selecciona una Materia</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              {/* Docente Select */}
              <div style={{ flex: '1', minWidth: '220px' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                  ¿Con qué docente? (Opcional)
                </label>
                <select
                  value={selectedProfessor}
                  onChange={(e) => setSelectedProfessor(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    backgroundColor: 'rgba(10, 15, 29, 0.95)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Cualquier Docente</option>
                  {professors.map((prof) => (
                    <option key={prof.id} value={prof.id}>{prof.name}</option>
                  ))}
                </select>
              </div>

            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'center', minWidth: '200px', fontSize: '1rem', padding: '12px 30px' }} disabled={loading}>
              {loading ? 'Buscando...' : '🔍 Buscar Tutor'}
            </button>
          </form>
        </div>

        {/* Resultados de búsqueda */}
        {searching && (
          <div>
            <h2 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.4rem' }}>Tutores Disponibles</h2>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <h3 style={{ color: 'var(--text-secondary)' }}>Cargando tutores...</h3>
              </div>
            ) : tutors.length === 0 ? (
              <div className="dashboard-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>😢</span>
                <h3>No hay tutores aprobados para esta asignatura todavía.</h3>
                <p>Pronto se registrarán más tutores referentes. Vuelve a consultar más tarde.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                {tutors.map((tutor) => (
                  <div 
                    key={tutor.tutor_id} 
                    className="dashboard-card" 
                    style={{ 
                      position: 'relative',
                      borderLeft: tutor.matches_professor ? '4px solid #10B981' : 'none',
                      background: tutor.matches_professor ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(10,15,29,0.5) 100%)' : 'var(--bg-card)'
                    }}
                  >
                    {tutor.matches_professor && (
                      <span 
                        style={{
                          position: 'absolute',
                          top: '15px',
                          right: '15px',
                          backgroundColor: '#10B981',
                          color: '#fff',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          padding: '3px 8px',
                          borderRadius: '12px'
                        }}
                      >
                        ✓ Mismo Docente
                      </span>
                    )}

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Avatar */}
                      <div 
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          color: '#fff',
                          fontSize: '1.4rem',
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
                      <div style={{ flex: '1', minWidth: '250px' }}>
                        <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '4px' }}>{tutor.full_name}</h3>
                        
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '8px', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>⭐ {parseFloat(tutor.rating_avg).toFixed(2)}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>•</span>
                          <span style={{ color: '#a7f3d0', fontWeight: 'bold' }}>{parseFloat(tutor.price_per_hour).toFixed(2)} UNACH-Credits/h</span>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 10px 0', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {tutor.bio || 'Sin biografía disponible.'}
                        </p>
                      </div>

                      {/* Ver Perfil Action */}
                      <div style={{ alignSelf: 'center' }}>
                        <Link to={`/tutors/${tutor.tutor_id}`} className="btn-secondary" style={{ whiteSpace: 'nowrap', textDecoration: 'none', padding: '10px 20px', display: 'inline-block' }}>
                          Ver Perfil
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
