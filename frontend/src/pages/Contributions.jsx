import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logoNegativo from '../assets/logo negativo-8.png';
import ParticlesBackground from '../components/ParticlesBackground';
import { supabase } from '../supabaseClient';

export default function Contributions() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Search & Filter State
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('tutorial');
  const [formUrl, setFormUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        navigate('/login');
        return;
      }

      // Get profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
    };

    fetchUserData();
  }, [navigate]);

  const loadContributions = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let data = null;
      try {
        const params = new URLSearchParams();
        if (searchText) params.append('search', searchText);
        if (categoryFilter) params.append('category', categoryFilter);

        const res = await fetch(`${import.meta.env.VITE_API_URL}/contributions?${params.toString()}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const text = await res.text();
          data = JSON.parse(text);
        }
      } catch (apiErr) {
        console.warn('API error fetching contributions, using direct Supabase fallback:', apiErr);
      }

      // Supabase direct query fallback
      if (!data) {
        let query = supabase
          .from('contributions')
          .select(`
            id,
            user_id,
            title,
            description,
            category,
            resource_url,
            created_at,
            users ( id, full_name, email, avatar_url )
          `)
          .order('created_at', { ascending: false });

        if (categoryFilter) {
          query = query.eq('category', categoryFilter);
        }

        if (searchText) {
          query = query.or(`title.ilike.%${searchText}%,description.ilike.%${searchText}%`);
        }

        const { data: dbData, error: dbError } = await query;
        if (dbError) throw dbError;

        data = (dbData || []).map(item => ({
          ...item,
          user: item.users
        }));
      }

      setContributions(data);
    } catch (err) {
      console.error('Error loading contributions:', err);
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load contributions if the user profile is fetched (guaranteeing auth state)
    if (profile) {
      loadContributions();
    }
  }, [profile, categoryFilter]); // Reload automatically on category filter change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadContributions();
  };

  const handleCreateContribution = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let apiSuccess = false;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/contributions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: formTitle,
            description: formDescription,
            category: formCategory,
            resource_url: formUrl
          })
        });

        if (res.ok) {
          apiSuccess = true;
        }
      } catch (apiErr) {
        console.warn('API error creating contribution, using direct Supabase fallback:', apiErr);
      }

      // If API was not used or failed, fallback to direct Supabase insert + credits reward
      if (!apiSuccess) {
        const { error: contribError } = await supabase
          .from('contributions')
          .insert({
            user_id: profile.id,
            title: formTitle,
            description: formDescription,
            category: formCategory,
            resource_url: formUrl
          });

        if (contribError) throw contribError;

        // Recompensa automática de +10.00 UNACH-Credits
        await supabase
          .from('credit_transactions')
          .insert({
            wallet_id: profile.id,
            amount: 10.00,
            type: 'admin_adjustment',
            description: `Recompensa por aporte en el Foro Académico: ${formTitle}`
          });
      }

      setSuccess('🎉 ¡Aportación publicada con éxito! Has acumulado +10.00 UNACH-Credits en tu billetera.');
      
      // Close modal and reset fields
      setIsModalOpen(false);
      setFormTitle('');
      setFormDescription('');
      setFormCategory('tutorial');
      setFormUrl('');

      // Reload list
      loadContributions();
    } catch (err) {
      console.error('Error creating contribution:', err);
      setError(err.message || 'Error al crear la aportación.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContribution = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este aporte del foro?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let apiSuccess = false;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/contributions/${id}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          apiSuccess = true;
        }
      } catch (apiErr) {
        console.warn('API delete contribution error, using direct Supabase fallback:', apiErr);
      }

      // Direct Supabase Fallback if API was not used or failed
      if (!apiSuccess) {
        const { error: dbErr } = await supabase
          .from('contributions')
          .delete()
          .eq('id', id);

        if (dbErr) throw dbErr;
      }

      setSuccess('Aportación eliminada correctamente.');
      setContributions(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting contribution:', err);
      setError(err.message || 'Error al eliminar la aportación.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    navigate('/');
  };

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'tutorial': return '🎥 Tutorial';
      case 'recurso': return '📦 Recurso / Enlace';
      case 'consejo_general': return '💡 Consejo';
      default: return cat;
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'tutorial': return '#FF5E13';
      case 'recurso': return '#10B981';
      case 'consejo_general': return '#3B82F6';
      default: return 'var(--text-secondary)';
    }
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
          <Link to="/dashboard" className="nav-link" style={{ marginRight: '15px' }}>Ir a mi Panel</Link>
          <span className="user-welcome" style={{ marginRight: '15px' }}>{profile.full_name}</span>
          <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="dashboard-main" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '20px' }}>
        
        {/* Banner principal */}
        <div className="dashboard-card wide-card" style={{ marginBottom: '30px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255, 94, 19, 0.08) 0%, rgba(10, 15, 29, 0.6) 100%)' }}>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '10px', color: '#fff' }}>Portal de Aportaciones Académicas</h1>
          <p className="card-desc" style={{ maxWidth: '700px', margin: '0 auto 20px' }}>
            Comparte tutoriales, repositorios en Drive/OneDrive y tips de diseño gráfico con tus compañeros de la UNACH. ¡El éxito es colectivo!
          </p>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '10px 24px', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>➕ Compartir Aporte</span>
          </button>
        </div>

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

        {/* Buscador y Filtros */}
        <div className="dashboard-card" style={{ marginBottom: '25px', padding: '20px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
            <div style={{ flex: '1', minWidth: '250px' }}>
              <input
                type="text"
                placeholder="Buscar por palabra clave..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            <div style={{ minWidth: '180px' }}>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
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
                <option value="">Todas las Categorías</option>
                <option value="tutorial">🎥 Tutoriales</option>
                <option value="recurso">📦 Recursos</option>
                <option value="consejo_general">💡 Consejos</option>
              </select>
            </div>
            <button type="submit" className="btn-secondary" style={{ padding: '10px 20px', minHeight: '40px' }}>
              🔍 Buscar
            </button>
          </form>
        </div>

        {/* Lista de Aportaciones */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-secondary)' }}>
            <h2>Cargando foro...</h2>
          </div>
        ) : contributions.length === 0 ? (
          <div className="dashboard-card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '15px' }}>📂</span>
            <h3>No se encontraron aportes</h3>
            <p>Sé el primero en compartir un tutorial o recurso haciendo clic en "Compartir Aporte".</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            {contributions.map((item) => (
              <div key={item.id} className="dashboard-card" style={{ borderLeft: `5px solid ${getCategoryColor(item.category)}`, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                  <span 
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      color: '#fff',
                      backgroundColor: getCategoryColor(item.category),
                      padding: '4px 10px',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {getCategoryLabel(item.category)}
                  </span>
                  
                  {/* Delete button (owner or admin) */}
                  {(profile.role === 'admin' || item.user_id === profile.id) && (
                    <button 
                      onClick={() => handleDeleteContribution(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      🗑️ Eliminar
                    </button>
                  )}
                </div>

                <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '8px' }}>{item.title}</h3>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
                  {item.description}
                </p>

                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '15px', 
                    paddingTop: '15px', 
                    borderTop: '1px solid rgba(255,255,255,0.06)' 
                  }}
                >
                  {/* Info de Autor */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div 
                      style={{
                        width: '35px',
                        height: '35px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: '#fff',
                        fontSize: '0.9rem',
                        overflow: 'hidden'
                      }}
                    >
                      {item.user?.avatar_url ? (
                        <img src={item.user.avatar_url} alt={item.user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        item.user?.full_name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '500' }}>{item.user?.full_name || 'Estudiante UNACH'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(item.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Link al Recurso */}
                  <a 
                    href={item.resource_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-secondary" 
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      textDecoration: 'none', 
                      fontSize: '0.85rem', 
                      fontWeight: 'bold',
                      color: 'var(--primary)',
                      border: '1px solid var(--primary)',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      backgroundColor: 'transparent',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = 'var(--primary)';
                      e.target.style.color = '#fff';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = 'var(--primary)';
                    }}
                  >
                    🔗 Ver Recurso
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Formulario Modal para Agregar Aporte */}
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
              maxWidth: '550px', 
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

            <h2 style={{ color: '#fff', marginBottom: '8px' }}>Compartir Recurso</h2>
            <p className="auth-subtitle" style={{ marginBottom: '20px' }}>Agrega un aporte para la comunidad académica de la UNACH</p>

            <form onSubmit={handleCreateContribution} className="auth-form">
              <div className="form-group">
                <label htmlFor="title">Título del Recurso</label>
                <input
                  type="text"
                  id="title"
                  placeholder="Ej: Carpeta de pinceles para Photoshop / Tutorial de InDesign"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  disabled={submitting}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Categoría</label>
                <select
                  id="category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  required
                  disabled={submitting}
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
                  <option value="tutorial">🎥 Tutorial / Video</option>
                  <option value="recurso">📦 Recurso (Drive / OneDrive / Indrive)</option>
                  <option value="consejo_general">💡 Consejo General / Tips</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="url">URL de Recurso (Drive, OneDrive, YouTube, etc.)</label>
                <input
                  type="url"
                  id="url"
                  placeholder="https://drive.google.com/..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  required
                  disabled={submitting}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Descripción / Instrucciones</label>
                <textarea
                  id="description"
                  placeholder="Explica detalladamente de qué trata el recurso, para qué semestres o materias sirve, y cómo usarlo..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  required
                  disabled={submitting}
                  rows={4}
                  className="form-input"
                  style={{ resize: 'vertical', minHeight: '100px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="auth-submit-btn" disabled={submitting} style={{ flex: '1', margin: 0 }}>
                  {submitting ? 'Publicando...' : 'Publicar Aporte'}
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
                  disabled={submitting}
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
