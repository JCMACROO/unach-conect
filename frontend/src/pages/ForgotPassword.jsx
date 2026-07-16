import { useState } from 'react';
import { Link } from 'react-router-dom';
import logoNegativo from '../assets/logo negativo-8.png';
import ParticlesBackground from '../components/ParticlesBackground';
import { supabase } from '../supabaseClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.toLowerCase().endsWith('@unach.edu.ec')) {
      setError('Solo se permiten correos institucionales de la UNACH (@unach.edu.ec).');
      return;
    }

    setLoading(true);

    try {
      const resetRedirectUrl = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetRedirectUrl,
      });

      if (resetError) throw resetError;

      setSuccess('Se ha enviado un enlace para restablecer tu contraseña a tu correo institucional.');
      setEmail('');
    } catch (err) {
      console.error('Error in password reset request:', err);
      setError(err.message || 'Ocurrió un error al enviar el enlace. Inténtalo de nuevo.');
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
          <h2>Recuperar Contraseña</h2>
          <p className="auth-subtitle">Ingresa tu correo institucional para recibir un enlace de restablecimiento</p>
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
            <label htmlFor="email">Correo Institucional</label>
            <input
              type="email"
              id="email"
              placeholder="ejemplo@unach.edu.ec"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Enviando enlace...' : 'Enviar Enlace'}
          </button>
        </form>

        <div className="auth-footer-text">
          <Link to="/login" className="auth-link">Volver al Inicio de Sesión</Link>
        </div>
      </div>
    </div>
  );
}
