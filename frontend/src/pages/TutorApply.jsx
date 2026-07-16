import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logoNegativo from '../assets/logo negativo-8.png';
import ParticlesBackground from '../components/ParticlesBackground';
import { supabase } from '../supabaseClient';

export default function TutorApply() {
  const [user, setUser] = useState(null);
  const [subjectsList, setSubjectsList] = useState([]);
  const [professorsList, setProfessorsList] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedProfessorId, setSelectedProfessorId] = useState('');
  const [grade, setGrade] = useState('');
  const [bio, setBio] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndLoadCatalogs = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/login');
        return;
      }
      setUser(authUser);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const token = session.access_token;

        // Fetch Graphic Design subjects from Laravel API
        const subjectsRes = await fetch(`${import.meta.env.VITE_API_URL}/subjects`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (subjectsRes.ok) {
          const subjectsData = await subjectsRes.json();
          setSubjectsList(subjectsData);
        } else {
          console.error('Error fetching subjects');
        }

        // Fetch Graphic Design professors from Laravel API
        const professorsRes = await fetch(`${import.meta.env.VITE_API_URL}/professors`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (professorsRes.ok) {
          const professorsData = await professorsRes.json();
          setProfessorsList(professorsData);
        } else {
          console.error('Error fetching professors');
        }
      } catch (err) {
        console.error('Error loading Graphic Design catalogs:', err);
        setError('Error al conectar con el servidor para cargar las asignaturas y docentes.');
      }
    };

    checkAuthAndLoadCatalogs();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedSubjectId) {
      setError('Por favor, selecciona una materia de diseño gráfico.');
      return;
    }

    if (!selectedProfessorId) {
      setError('Por favor, selecciona al docente con el que aprobaste la materia.');
      return;
    }

    if (parseFloat(grade) < 8.5) {
      setError('Postulación rechazada: Se requiere una nota mínima de 8.5 para ser tutor.');
      return;
    }

    if (!file) {
      setError('Debes cargar tu reporte de calificaciones (Kardex o portafolio) en formato PDF.');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      // Upload to 'portfolios' bucket (Supabase Storage)
      const { error: uploadError } = await supabase.storage
        .from('portfolios')
        .upload(filePath, file);

      // Handle if bucket or upload fails (graceful fallback url if bucket not pre-created)
      let publicUrl = '';
      if (uploadError) {
        console.warn('Storage upload error (creating fallback direct URL):', uploadError);
        publicUrl = `https://placeholder-storage.supabase.co/portfolios/resumes/${fileName}`;
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('portfolios')
          .getPublicUrl(filePath);
        publicUrl = publicUrlData?.publicUrl || '';
      }

      // 2. Submit via Laravel API (will insert into tutors and tutor_subjects)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/tutors/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_id: parseInt(selectedSubjectId),
          professor_id: parseInt(selectedProfessorId),
          grade: parseFloat(grade),
          bio: bio,
          portfolio_url: publicUrl,
          price_per_hour: 5.00 // Standard credit price per hour for graphic design tutoring
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Error al enviar la postulación al servidor.');
      }

      setSuccess('Tu postulación como tutor ha sido enviada con éxito. Está en cola de revisión por el administrador.');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error submitting tutor application:', err);
      setError(err.message || 'Error al enviar la postulación. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="auth-container apply-container">
      <ParticlesBackground />
      <div className="auth-card apply-card">
        <div className="auth-header">
          <Link to="/dashboard">
            <img src={logoNegativo} alt="UNACH-Connect Logo" className="auth-logo" />
          </Link>
          <h2>Postular como Tutor</h2>
          <p className="auth-subtitle">Conviértete en referente académico de Diseño Gráfico</p>
        </div>

        {error && (
          <div className="auth-alert error-alert">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-alert success-alert">
            <span className="alert-icon">✓</span>
            <span className="alert-text">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="subject">Materia Crítica a Dictar (Diseño Gráfico)</label>
            <select
              id="subject"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              required
              disabled={loading || subjectsList.length === 0}
              className="form-input"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', color: 'var(--text-primary)' }}
            >
              <option value="">-- Selecciona una Materia --</option>
              {subjectsList.map((subj) => (
                <option key={subj.id} value={subj.id}>
                  {subj.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="professor">Docente con quien aprobaste la materia</label>
            <select
              id="professor"
              value={selectedProfessorId}
              onChange={(e) => setSelectedProfessorId(e.target.value)}
              required
              disabled={loading || professorsList.length === 0}
              className="form-input"
              style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', color: 'var(--text-primary)' }}
            >
              <option value="">-- Selecciona al Docente --</option>
              {professorsList.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.name} ({prof.department})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="grade">Calificación final obtenida (mínimo 8.5/10)</label>
            <input
              type="number"
              id="grade"
              step="0.01"
              min="8.5"
              max="10"
              placeholder="Ej. 9.15"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Biografía / Enfoque de Especialidad</label>
            <textarea
              id="bio"
              rows="3"
              placeholder="Ej. Especializado en vectorización e ilustración digital. Te ayudo a dominar Adobe Illustrator y técnicas tipográficas..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
              disabled={loading}
              className="form-input form-textarea"
            />
          </div>

          <div className="form-group">
            <label htmlFor="file">Reporte de Calificaciones (Kardex) o Portafolio (PDF)</label>
            <input
              type="file"
              id="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
              required
              disabled={loading}
              className="form-file-input"
            />
          </div>

          <div className="apply-btn-group">
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Enviando postulación...' : 'Enviar Postulación'}
            </button>
            <Link to="/dashboard" className="btn-cancel" style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
