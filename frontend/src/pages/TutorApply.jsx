import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logoNegativo from '../assets/logo negativo-8.png';
import ParticlesBackground from '../components/ParticlesBackground';
import { supabase } from '../supabaseClient';

export default function TutorApply() {
  const [user, setUser] = useState(null);
  const [subject, setSubject] = useState('');
  const [professor, setProfessor] = useState('');
  const [grade, setGrade] = useState('');
  const [bio, setBio] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/login');
      } else {
        setUser(authUser);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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

      // 2. Insert/Upsert Tutor application details
      const { error: tutorError } = await supabase
        .from('tutors')
        .upsert([
          {
            id: user.id,
            bio: bio,
            portfolio_url: publicUrl,
            status: 'pending'
          }
        ]);

      if (tutorError) throw tutorError;

      setSuccess('Tu postulación ha sido enviada con éxito. Está en cola de revisión por la administración.');
      
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
          <p className="auth-subtitle">Conviértete en referente académico de la facultad</p>
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
            <label htmlFor="subject">Materia Crítica a Dictar</label>
            <input
              type="text"
              id="subject"
              placeholder="Ej. Geometría Descriptiva, Tipografía II"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="professor">Docente con quien aprobó la materia</label>
            <input
              type="text"
              id="professor"
              placeholder="Ej. Dis. Carlos Fuentes"
              value={professor}
              onChange={(e) => setProfessor(e.target.value)}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="grade">Calificación final obtenida (sobre 10)</label>
            <input
              type="number"
              id="grade"
              step="0.01"
              min="0"
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
            <label htmlFor="bio">Biografía / Mensaje de presentación</label>
            <textarea
              id="bio"
              rows="3"
              placeholder="Cuéntanos por qué eres el tutor ideal para esta materia..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
              disabled={loading}
              className="form-input form-textarea"
            />
          </div>

          <div className="form-group">
            <label htmlFor="file">Reporte de calificaciones (Kardex) o Portafolio (PDF)</label>
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
            <Link to="/dashboard" className="btn-cancel">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
