import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoNegativo from '../assets/logo negativo-8.png';
import ParticlesBackground from '../components/ParticlesBackground';
import { supabase } from '../supabaseClient';

export default function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/login');
        return;
      }
      
      // Fetch profile to verify admin role
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        navigate('/dashboard'); // Redirect students or partners
        return;
      }

      loadApplications();
    };

    checkAdmin();
  }, [navigate]);

  const loadApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'No se pudieron cargar las postulaciones.');
      }

      const data = await res.json();
      setApplications(data);
    } catch (err) {
      console.error('Error loading applications:', err);
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (tutorId, newStatus) => {
    setError('');
    setSuccess('');
    const actionLabel = newStatus === 'approved' ? 'aprobar' : 'rechazar';
    
    if (!confirm(`¿Estás seguro de que deseas ${actionLabel} esta postulación?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/applications/${tutorId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Error al actualizar la postulación.');
      }

      setSuccess(`Postulación ${newStatus === 'approved' ? 'aprobada' : 'rechazada'} correctamente.`);
      
      // Update local state to remove the application
      setApplications(prev => prev.filter(app => app.tutor_id !== tutorId));
    } catch (err) {
      console.error('Error updating application:', err);
      setError(err.message || 'Error de conexión.');
    }
  };

  if (loading && applications.length === 0) {
    return (
      <div className="auth-container">
        <ParticlesBackground />
        <div style={{ textalign: 'center' }}>
          <h2>Cargando Panel de Administración...</h2>
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
          <Link to="/dashboard" className="brand-link">
            <img src={logoNegativo} alt="UNACH-Connect Logo" className="brand-logo" />
            <span className="brand-title" style={{ color: '#EF4444' }}>UNACH-Connect Admin</span>
          </Link>
        </div>
        <nav className="landing-nav">
          <Link to="/dashboard" className="nav-link">Inicio Estudiante</Link>
          <Link to="/admin/catalog" className="nav-btn" style={{ backgroundColor: '#EF4444', color: '#fff', fontSize: '0.9rem' }}>Gestionar Catálogos</Link>
        </nav>
      </header>

      {/* Main Admin Content */}
      <main className="dashboard-main" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '20px' }}>
        
        {/* Top Cards Stats */}
        <div className="dashboard-grid" style={{ marginBottom: '30px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div className="dashboard-card promo-card" style={{ borderLeft: '4px solid #EF4444' }}>
            <h2>Postulaciones Pendientes</h2>
            <div className="credit-display">
              <span className="credit-amount" style={{ color: '#fca5a5' }}>{applications.length}</span>
              <span className="credit-label">Tutores por revisar</span>
            </div>
            <p className="card-desc">Revisa el Kardex/Portafolio de los alumnos y decide si están aptos para ser referentes académicos.</p>
          </div>

          <div className="dashboard-card status-card">
            <h2>Gestión de la Facultad</h2>
            <p className="card-desc" style={{ marginBottom: '20px' }}>Agrega o edita las asignaturas del plan de estudio de Diseño Gráfico y el catálogo de docentes autorizados.</p>
            <Link to="/admin/catalog" className="btn-primary" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff', textAlign: 'center', display: 'block' }}>
              Catálogos de Diseño Gráfico
            </Link>
          </div>
        </div>

        {error && (
          <div className="auth-alert error-alert" style={{ marginBottom: '24px' }}>
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-alert success-alert" style={{ marginBottom: '24px' }}>
            <span className="alert-icon">✓</span>
            <span className="alert-text">{success}</span>
          </div>
        )}

        {/* Pending Applications Section */}
        <div className="dashboard-card wide-card">
          <h2>Bandeja de Entrada: Postulaciones de Tutores</h2>
          <p className="card-desc" style={{ marginBottom: '20px' }}>A continuación se listan los estudiantes de Diseño Gráfico que solicitan ser tutores.</p>

          <div className="sessions-table-wrapper">
            {applications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🎉</span>
                <h3>¡Todo al día!</h3>
                <p>No hay postulaciones de tutores pendientes de aprobación en este momento.</p>
              </div>
            ) : (
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Materia Propuesta</th>
                    <th>Docente de Respaldo</th>
                    <th>Tarifa Propuesta</th>
                    <th>Documentación / Kardex</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.tutor_id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{app.full_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.email}</div>
                        <div style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '4px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={app.bio}>
                          "{app.bio}"
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: '500', color: 'var(--primary)' }}>{app.subject_name || 'N/A'}</span>
                      </td>
                      <td>{app.professor_name || 'N/A'}</td>
                      <td>{parseFloat(app.price_per_hour).toFixed(2)} UNACH-Credits</td>
                      <td>
                        <a 
                          href={app.portfolio_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="auth-link" 
                          style={{ textDecoration: 'underline', color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          📄 Ver Kardex/PDF
                        </a>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleStatusUpdate(app.tutor_id, 'approved')} 
                            className="nav-btn" 
                            style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#10B981', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                          >
                            Aprobar
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(app.tutor_id, 'suspended')} 
                            className="logout-btn" 
                            style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: 'transparent', border: '1px solid #EF4444', color: '#EF4444', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Rechazar
                          </button>
                        </div>
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
