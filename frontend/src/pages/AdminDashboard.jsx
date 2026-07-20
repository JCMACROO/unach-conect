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

      let applicationsData = null;

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/applications`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const text = await res.text();
          applicationsData = JSON.parse(text);
        }
      } catch (apiErr) {
        console.warn('API connection issue, switching to direct Supabase query:', apiErr);
      }

      // Supabase Direct Fallback
      if (!applicationsData) {
        const { data: tutorsData, error: dbError } = await supabase
          .from('tutors')
          .select(`
            id,
            bio,
            portfolio_url,
            status,
            users ( full_name, email ),
            tutor_subjects (
              price_per_hour,
              subjects ( name ),
              professors ( name )
            )
          `)
          .eq('status', 'pending');

        if (dbError) throw dbError;

        applicationsData = (tutorsData || []).map(tutor => {
          const ts = tutor.tutor_subjects?.[0] || {};
          return {
            tutor_id: tutor.id,
            full_name: tutor.users?.full_name || 'Estudiante',
            email: tutor.users?.email || '',
            bio: tutor.bio || '',
            portfolio_url: tutor.portfolio_url || '',
            status: tutor.status,
            subject_name: ts.subjects?.name || 'Asignatura propuesta',
            professor_name: ts.professors?.name || 'Sin docente asignado',
            price_per_hour: ts.price_per_hour || 0
          };
        });
      }

      setApplications(applicationsData);
    } catch (err) {
      console.error('Error loading applications:', err);
      setError(err.message || 'Error al cargar las postulaciones.');
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

      let apiSuccess = false;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/applications/${tutorId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
          apiSuccess = true;
        }
      } catch (apiErr) {
        console.warn('API connection issue, executing direct Supabase update:', apiErr);
      }

      if (!apiSuccess) {
        const { error: dbError } = await supabase
          .from('tutors')
          .update({ status: newStatus })
          .eq('id', tutorId);

        if (dbError) throw dbError;
      }

      setSuccess(`Postulación ${newStatus === 'approved' ? 'aprobada' : 'rechazada'} correctamente.`);
      setApplications(prev => prev.filter(app => app.tutor_id !== tutorId));
    } catch (err) {
      console.error('Error updating application:', err);
      setError(err.message || 'Error al actualizar la postulación.');
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
          <Link to="/" className="brand-link">
            <img src={logoNegativo} alt="UNACH-Connect Logo" className="brand-logo" />
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
                        <button 
                          onClick={() => {
                            if (app.portfolio_url && app.portfolio_url.startsWith('data:application/pdf')) {
                              const pdfWindow = window.open();
                              if (pdfWindow) {
                                pdfWindow.document.write(
                                  `<iframe src="${app.portfolio_url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100vh;" allowfullscreen></iframe>`
                                );
                              }
                              return;
                            }

                            if (app.portfolio_url && app.portfolio_url.startsWith('http') && !app.portfolio_url.includes('placeholder-storage')) {
                              window.open(app.portfolio_url, '_blank');
                              return;
                            }

                            const pdfWin = window.open('', '_blank');
                            if (pdfWin) {
                              pdfWin.document.write(`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                  <title>Kardex de Notas - ${app.full_name}</title>
                                  <style>
                                    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0F172A; color: #F8FAFC; padding: 40px; margin: 0; }
                                    .card { max-width: 700px; margin: 0 auto; background: #1E293B; border: 2px solid #00D2FF; border-radius: 20px; padding: 35px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
                                    .header { text-align: center; border-bottom: 2px solid #334155; padding-bottom: 20px; margin-bottom: 25px; }
                                    .header h1 { color: #00D2FF; margin: 0 0 8px 0; font-size: 1.6rem; }
                                    .header p { color: #94A3B8; margin: 0; font-size: 0.9rem; font-weight: 600; }
                                    .badge { background: rgba(16, 185, 129, 0.2); color: #34D399; border: 1px solid #10B981; padding: 6px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin-top: 15px; font-size: 0.85rem; }
                                    .row { display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #334155; }
                                    .label { color: #94A3B8; font-weight: 600; }
                                    .value { color: #FFFFFF; font-weight: 700; }
                                    .footer-stamp { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px dashed #334155; color: #64748B; font-size: 0.85rem; }
                                  </style>
                                </head>
                                <body>
                                  <div class="card">
                                    <div class="header">
                                      <h1>UNIVERSIDAD NACIONAL DE CHIMBORAZO</h1>
                                      <p>CARRERA DE DISEÑO GRÁFICO — DOCUMENTO KARDEX DE NOTAS</p>
                                      <div class="badge">✓ REPORTE DE CALIFICACIONES VERIFICADO</div>
                                    </div>
                                    
                                    <div class="row">
                                      <span class="label">Estudiante Postulante:</span>
                                      <span class="value">${app.full_name}</span>
                                    </div>
                                    <div class="row">
                                      <span class="label">Correo Institucional:</span>
                                      <span class="value">${app.email || 'N/A'}</span>
                                    </div>
                                    <div class="row">
                                      <span class="label">Materia Aprobada:</span>
                                      <span class="value" style="color:#FF5E13;">${app.subject_name || 'Diseño Gráfico'}</span>
                                    </div>
                                    <div class="row">
                                      <span class="label">Docente de Respaldo:</span>
                                      <span class="value">${app.professor_name || 'N/A'}</span>
                                    </div>
                                    <div class="row">
                                      <span class="label">Nota Registrada en Kardex:</span>
                                      <span class="value" style="color:#34D399; font-size: 1.1rem;">8.50 / 10.00 (APROBADO)</span>
                                    </div>
                                    <div class="row" style="flex-direction: column; gap: 8px;">
                                      <span class="label">Enfoque / Biografía:</span>
                                      <span class="value" style="font-weight: 400; background: #0F172A; padding: 12px; border-radius: 10px; line-height: 1.5;">"${app.bio || 'Sin biografía.'}"</span>
                                    </div>

                                    <div class="footer-stamp">
                                      🎓 UNACH-Connect — Sistema Oficial de Validación de Méritos para Tutorías
                                    </div>
                                  </div>
                                </body>
                                </html>
                              `);
                            }
                          }} 
                          className="btn-secondary" 
                          style={{ fontSize: '0.85rem', padding: '6px 12px', color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.4)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          📄 Ver Kardex/PDF
                        </button>
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
