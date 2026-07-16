import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoNegativo from '../assets/logo negativo-8.png';
import ParticlesBackground from '../components/ParticlesBackground';
import { supabase } from '../supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have an active recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // Supabase automatically parses recovery hashes and establishes a session.
      // If there's no session, they might have accessed this URL directly without token.
      if (!session) {
        console.warn('No active recovery session found.');
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess('Tu contraseña ha sido restablecida con éxito. Redirigiendo al inicio de sesión...');
      setPassword('');
      setConfirmPassword('');

      // Sign out to clear the temporary reset password session
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.message || 'Ocurrió un error al actualizar tu contraseña. Por favor, solicita un nuevo enlace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <ParticlesBackground />
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/">
            <img src={logoNegativo} alt="UNACH-Connect Logo" className="auth-logo" />
          </Link>
          <h2>Nueva Contraseña</h2>
          <p className="auth-subtitle">Ingresa tu nueva contraseña para acceder a UNACH-Connect</p>
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
            <label htmlFor="password">Nueva Contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="form-input"
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="form-input"
              minLength="6"
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </button>
        </form>

        <div className="auth-footer-text">
          <Link to="/login" className="auth-link">Volver al Inicio de Sesión</Link>
        </div>
      </div>
    </div>
  );
}
