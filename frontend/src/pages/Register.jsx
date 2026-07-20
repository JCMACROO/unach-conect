import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoNegativo from '../assets/logo negativo-8.png';
import ParticlesBackground from '../components/ParticlesBackground';
import { supabase } from '../supabaseClient';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.toLowerCase().endsWith('@unach.edu.ec')) {
      setError('Registro denegado: Solo se permiten correos institucionales de la UNACH (@unach.edu.ec).');
      return;
    }

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
      // 1. Sign up user via Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone_number: phone,
          }
        }
      });

      if (signUpError) throw signUpError;

      // 2. Handle successful registration output
      if (data?.user) {
        // Attempt phone update if session is active
        if (data.session) {
          try {
            await supabase
              .from('users')
              .update({ phone_number: phone })
              .eq('id', data.user.id);
          } catch (e) {
            console.warn('Could not update phone number in users profile:', e);
          }

          setSuccess('¡Registro exitoso! Redirigiendo al panel...');
          localStorage.setItem('user', JSON.stringify({
            id: data.user.id,
            email: email,
            name: name,
            role: 'student'
          }));

          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          // Email confirmation is enabled in Supabase Auth settings
          setSuccess('¡Cuenta registrada! Te hemos enviado un correo de confirmación a tu e-mail institucional. Revisa tu bandeja de entrada para activar tu cuenta.');
        }
      }
    } catch (err) {
      console.error('Error in registration:', err);
      let msg = err.message || 'Error al crear la cuenta. Inténtalo de nuevo.';
      if (msg.toLowerCase().includes('email rate limit exceeded')) {
        msg = '⚠️ Límite de envíos de correo de Supabase alcanzado ("email rate limit exceeded"). En Supabase Auth Dashboard -> Authentication -> Providers -> Email, desactiva la opción "Confirm email" o espera unos minutos.';
      } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('user_already_exists')) {
        msg = 'Este correo institucional ya se encuentra registrado. Intenta iniciar sesión.';
      }
      setError(msg);
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
          <h2>Registrarse</h2>
          <p className="auth-subtitle">Crea tu cuenta institucional UNACH</p>
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
            <label htmlFor="name">Nombre Completo</label>
            <input
              type="text"
              id="name"
              placeholder="Mateo Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo Institucional</label>
            <input
              type="email"
              id="email"
              placeholder="mateo.silva@unach.edu.ec"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Número de Celular</label>
            <input
              type="tel"
              id="phone"
              placeholder="0987654321"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group font-row">
            <div className="form-col">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="form-input"
              />
            </div>
            <div className="form-col">
              <label htmlFor="confirmPassword">Confirmar</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="auth-footer-text">
          ¿Ya tienes cuenta? <Link to="/login" className="auth-link">Inicia sesión aquí</Link>
        </div>
      </div>
    </div>
  );
}
