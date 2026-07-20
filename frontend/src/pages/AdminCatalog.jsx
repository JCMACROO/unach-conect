import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoNegativo from '../assets/logo negativo-8.png';
import ParticlesBackground from '../components/ParticlesBackground';
import { supabase } from '../supabaseClient';

export default function AdminCatalog() {
  const [activeTab, setActiveTab] = useState('subjects'); // 'subjects' or 'professors'
  
  // Data lists
  const [subjects, setSubjects] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states for Subjects
  const [subjectId, setSubjectId] = useState(null); // null if creating
  const [subjectName, setSubjectName] = useState('');
  const [subjectDescription, setSubjectDescription] = useState('');

  // Form states for Professors
  const [professorId, setProfessorId] = useState(null); // null if creating
  const [professorName, setProfessorName] = useState('');
  const [professorDepartment, setProfessorDepartment] = useState('Diseño Gráfico');

  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/login');
        return;
      }
      
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        navigate('/dashboard');
        return;
      }

      loadCatalogs();
    };

    checkAdmin();
  }, [navigate]);

  const loadCatalogs = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let fetchedSubjects = null;
      let fetchedProfessors = null;

      try {
        const subjectsRes = await fetch(`${import.meta.env.VITE_API_URL}/subjects`, {
          headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        if (subjectsRes.ok) {
          const text = await subjectsRes.text();
          fetchedSubjects = JSON.parse(text);
        }

        const professorsRes = await fetch(`${import.meta.env.VITE_API_URL}/professors`, {
          headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        if (professorsRes.ok) {
          const text = await professorsRes.text();
          fetchedProfessors = JSON.parse(text);
        }
      } catch (apiErr) {
        console.warn('API connection issue, switching to direct Supabase query:', apiErr);
      }

      // Supabase Direct Fallback for Subjects
      if (!fetchedSubjects) {
        const { data: dbSubjects, error: subjErr } = await supabase
          .from('subjects')
          .select('*')
          .order('name');
        if (!subjErr && dbSubjects) {
          fetchedSubjects = dbSubjects;
        }
      }

      // Supabase Direct Fallback for Professors
      if (!fetchedProfessors) {
        const { data: dbProfessors, error: profErr } = await supabase
          .from('professors')
          .select('*')
          .order('name');
        if (!profErr && dbProfessors) {
          fetchedProfessors = dbProfessors;
        }
      }

      setSubjects(fetchedSubjects || []);
      setProfessors(fetchedProfessors || []);
    } catch (err) {
      console.error('Error loading catalogs:', err);
      setError('Error al obtener catálogos.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setSubjectId(null);
    setSubjectName('');
    setSubjectDescription('');
    setProfessorId(null);
    setProfessorName('');
    setProfessorDepartment('Diseño Gráfico');
    setError('');
    setSuccess('');
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let apiSuccess = false;
      try {
        const url = isEditing 
          ? `${import.meta.env.VITE_API_URL}/admin/subjects/${subjectId}`
          : `${import.meta.env.VITE_API_URL}/admin/subjects`;
        
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: subjectName,
            description: subjectDescription
          })
        });

        if (res.ok) {
          apiSuccess = true;
        }
      } catch (apiErr) {
        console.warn('API error, using Supabase direct query for subject save:', apiErr);
      }

      if (!apiSuccess) {
        if (isEditing) {
          const { error: dbErr } = await supabase
            .from('subjects')
            .update({ name: subjectName, description: subjectDescription })
            .eq('id', subjectId);
          if (dbErr) throw dbErr;
        } else {
          const { error: dbErr } = await supabase
            .from('subjects')
            .insert({ name: subjectName, description: subjectDescription });
          if (dbErr) throw dbErr;
        }
      }

      setSuccess(isEditing ? 'Asignatura actualizada con éxito.' : 'Asignatura creada con éxito.');
      resetForm();
      loadCatalogs();
    } catch (err) {
      console.error('Error saving subject:', err);
      setError(err.message || 'Error al guardar la asignatura.');
    }
  };

  const handleProfessorSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let apiSuccess = false;
      try {
        const url = isEditing 
          ? `${import.meta.env.VITE_API_URL}/admin/professors/${professorId}`
          : `${import.meta.env.VITE_API_URL}/admin/professors`;
        
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: professorName,
            department: professorDepartment
          })
        });

        if (res.ok) {
          apiSuccess = true;
        }
      } catch (apiErr) {
        console.warn('API error, using Supabase direct query for professor save:', apiErr);
      }

      if (!apiSuccess) {
        if (isEditing) {
          const { error: dbErr } = await supabase
            .from('professors')
            .update({ name: professorName, department: professorDepartment })
            .eq('id', professorId);
          if (dbErr) throw dbErr;
        } else {
          const { error: dbErr } = await supabase
            .from('professors')
            .insert({ name: professorName, department: professorDepartment });
          if (dbErr) throw dbErr;
        }
      }

      setSuccess(isEditing ? 'Docente actualizado con éxito.' : 'Docente creado con éxito.');
      resetForm();
      loadCatalogs();
    } catch (err) {
      console.error('Error saving professor:', err);
      setError(err.message || 'Error al guardar el docente.');
    }
  };

  const handleEditSubject = (subject) => {
    setIsEditing(true);
    setSubjectId(subject.id);
    setSubjectName(subject.name);
    setSubjectDescription(subject.description || '');
    setError('');
    setSuccess('');
  };

  const handleEditProfessor = (prof) => {
    setIsEditing(true);
    setProfessorId(prof.id);
    setProfessorName(prof.name);
    setProfessorDepartment(prof.department || 'Diseño Gráfico');
    setError('');
    setSuccess('');
  };

  const handleDeleteSubject = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta asignatura? Se borrarán las tutorías y asociaciones vinculadas.')) {
      return;
    }
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let apiSuccess = false;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/subjects/${id}`, {
          method: 'DELETE',
          headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          apiSuccess = true;
        }
      } catch (apiErr) {
        console.warn('API delete subject error, using direct Supabase fallback:', apiErr);
      }

      if (!apiSuccess) {
        const { error: dbErr } = await supabase
          .from('subjects')
          .delete()
          .eq('id', id);
        if (dbErr) throw dbErr;
      }

      setSuccess('Asignatura eliminada con éxito.');
      loadCatalogs();
    } catch (err) {
      console.error('Error deleting subject:', err);
      setError(err.message || 'Error al eliminar la asignatura.');
    }
  };

  const handleDeleteProfessor = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este docente?')) {
      return;
    }
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let apiSuccess = false;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/professors/${id}`, {
          method: 'DELETE',
          headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          apiSuccess = true;
        }
      } catch (apiErr) {
        console.warn('API delete professor error, using direct Supabase fallback:', apiErr);
      }

      if (!apiSuccess) {
        const { error: dbErr } = await supabase
          .from('professors')
          .delete()
          .eq('id', id);
        if (dbErr) throw dbErr;
      }

      setSuccess('Docente eliminado con éxito.');
      loadCatalogs();
    } catch (err) {
      console.error('Error deleting professor:', err);
      setError(err.message || 'Error al eliminar el docente.');
    }
  };

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
          <Link to="/admin/dashboard" className="nav-link">Bandeja Postulaciones</Link>
          <Link to="/dashboard" className="nav-link">Inicio Estudiante</Link>
        </nav>
      </header>

      <main className="dashboard-main" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '20px' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
          <button 
            onClick={() => { setActiveTab('subjects'); resetForm(); }}
            className={`nav-link ${activeTab === 'subjects' ? 'active-tab' : ''}`}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.1rem', 
              fontWeight: activeTab === 'subjects' ? '700' : '400',
              color: activeTab === 'subjects' ? '#EF4444' : 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '8px 16px'
            }}
          >
            📚 Asignaturas / Materias
          </button>
          <button 
            onClick={() => { setActiveTab('professors'); resetForm(); }}
            className={`nav-link ${activeTab === 'professors' ? 'active-tab' : ''}`}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.1rem', 
              fontWeight: activeTab === 'professors' ? '700' : '400',
              color: activeTab === 'professors' ? '#EF4444' : 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '8px 16px'
            }}
          >
            👨‍🏫 Docentes / Profesores
          </button>
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

        <div className="dashboard-grid" style={{ alignItems: 'start', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
          
          {/* Left Side Form: Create / Edit */}
          <div className="dashboard-card status-card">
            <h2>{isEditing ? 'Editar Registro' : 'Añadir Registro'}</h2>
            <p className="card-desc" style={{ marginBottom: '20px' }}>Completa los campos para actualizar el catálogo oficial de Diseño Gráfico.</p>

            {activeTab === 'subjects' ? (
              <form onSubmit={handleSubjectSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="subjName">Nombre de la Asignatura</label>
                  <input 
                    type="text" 
                    id="subjName" 
                    placeholder="Ej. Tipografía III"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="subjDesc">Descripción / Contenido Crítico</label>
                  <textarea 
                    id="subjDesc" 
                    rows="4"
                    placeholder="Describe los ejes clave de la materia..."
                    value={subjectDescription}
                    onChange={(e) => setSubjectDescription(e.target.value)}
                    className="form-input form-textarea"
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="auth-submit-btn" style={{ flex: '1', backgroundColor: '#EF4444' }}>
                    {isEditing ? 'Guardar Cambios' : 'Añadir Materia'}
                  </button>
                  {isEditing && (
                    <button type="button" onClick={resetForm} className="btn-secondary" style={{ padding: '14px', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <form onSubmit={handleProfessorSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="profName">Nombre del Docente</label>
                  <input 
                    type="text" 
                    id="profName" 
                    placeholder="Ej. Mgs. Diego Silva"
                    value={professorName}
                    onChange={(e) => setProfessorName(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profDept">Departamento / Cátedra</label>
                  <input 
                    type="text" 
                    id="profDept" 
                    placeholder="Ej. Diseño Gráfico - Área Editorial"
                    value={professorDepartment}
                    onChange={(e) => setProfessorDepartment(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="auth-submit-btn" style={{ flex: '1', backgroundColor: '#EF4444' }}>
                    {isEditing ? 'Guardar Cambios' : 'Añadir Docente'}
                  </button>
                  {isEditing && (
                    <button type="button" onClick={resetForm} className="btn-secondary" style={{ padding: '14px', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Right Side Table: View List */}
          <div className="dashboard-card wide-card">
            <h2>Catálogo Vigente de Diseño Gráfico</h2>
            <p className="card-desc" style={{ marginBottom: '20px' }}>Listado de elementos registrados en la base de datos.</p>

            <div className="sessions-table-wrapper">
              {loading ? (
                <p style={{ textAlign: 'center', padding: '20px' }}>Cargando catálogo...</p>
              ) : activeTab === 'subjects' ? (
                subjects.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No hay asignaturas en el catálogo.</p>
                ) : (
                  <table className="sessions-table">
                    <thead>
                      <tr>
                        <th>Materia</th>
                        <th>Descripción</th>
                        <th style={{ width: '150px' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((subj) => (
                        <tr key={subj.id}>
                          <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{subj.name}</td>
                          <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '350px' }}>{subj.description || 'Sin descripción.'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                onClick={() => handleEditSubject(subj)} 
                                className="nav-btn" 
                                style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer' }}
                              >
                                Editar
                              </button>
                              <button 
                                onClick={() => handleDeleteSubject(subj.id)} 
                                className="logout-btn" 
                                style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: 'transparent', border: '1px solid #EF4444', color: '#EF4444', cursor: 'pointer' }}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : (
                professors.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No hay docentes en el catálogo.</p>
                ) : (
                  <table className="sessions-table">
                    <thead>
                      <tr>
                        <th>Docente</th>
                        <th>Departamento / Cátedra</th>
                        <th style={{ width: '150px' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {professors.map((prof) => (
                        <tr key={prof.id}>
                          <td style={{ fontWeight: '600' }}>{prof.name}</td>
                          <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{prof.department}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                onClick={() => handleEditProfessor(prof)} 
                                className="nav-btn" 
                                style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer' }}
                              >
                                Editar
                              </button>
                              <button 
                                onClick={() => handleDeleteProfessor(prof.id)} 
                                className="logout-btn" 
                                style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: 'transparent', border: '1px solid #EF4444', color: '#EF4444', cursor: 'pointer' }}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
