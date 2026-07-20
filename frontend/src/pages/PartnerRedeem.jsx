import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logoNegativo from '../assets/logo negativo-8.png';
import ParticlesBackground from '../components/ParticlesBackground';
import { supabase } from '../supabaseClient';

export default function PartnerRedeem() {
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(0.00);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkPartner = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileData || profileData.role !== 'partner') {
        navigate('/dashboard'); // Only partners can access this portal
        return;
      }

      setProfile(profileData);
      setCheckingAuth(false);
      loadPartnerBalance();
    };

    checkPartner();
  }, [navigate]);

  const loadPartnerBalance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/wallet/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      }
    } catch (err) {
      console.error('Error loading partner balance:', err);
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!code) {
      setError('Por favor introduce un código de canje.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/partner/redeem/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Error al reclamar el código.');
      }

      setSuccess(`¡Canje Exitoso! ${responseData.message}`);
      setCode('');
      // Reload balance
      loadPartnerBalance();
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

  if (checkingAuth) {
    return (
      <div className="auth-container">
        <ParticlesBackground />
        <div style={{ textAlign: 'center' }}>
          <h2>Cargando Portal de Comercio...</h2>
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
          <span className="user-welcome" style={{ marginRight: '15px' }}>{profile.full_name}</span>
          <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
        </nav>
      </header>

      {/* Main Redeem Container */}
      <main className="dashboard-main" style={{ maxWidth: '600px', margin: '0 auto', width: '100%', padding: '20px' }}>
        
        {/* balance global del comercio */}
        <div className="dashboard-card" style={{ marginBottom: '25px', textAlign: 'center', borderLeft: '4px solid #10B981' }}>
          <h2>Mis Créditos Acumulados</h2>
          <div className="credit-display" style={{ margin: '15px 0' }}>
            <span className="credit-amount" style={{ color: '#a7f3d0' }}>{parseFloat(balance).toFixed(2)}</span>
            <span className="credit-label">UNACH-Credits</span>
          </div>
          <p className="card-desc">Estos créditos representan los servicios que has cobrado digitalmente a los estudiantes y pueden ser facturados al cierre del ciclo.</p>
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

        {/* Formulario de Canje */}
        <div className="dashboard-card" style={{ padding: '30px' }}>
          <h2 style={{ color: '#fff', marginBottom: '10px', textAlign: 'center' }}>Procesar Canje de Impresión/Ploteo</h2>
          <p className="card-desc" style={{ textAlign: 'center', marginBottom: '25px' }}>
            Escribe el código alfanumérico temporal que el estudiante te presente en su pantalla.
          </p>

          <form onSubmit={handleClaim} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label htmlFor="code" style={{ fontSize: '0.85rem' }}>Código UNACH-Credits (Ej: UNACH-A1B2C3)</label>
              <input
                type="text"
                id="code"
                placeholder="UNACH-XXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                disabled={loading}
                className="form-input"
                style={{
                  fontSize: '1.6rem',
                  letterSpacing: '3px',
                  textAlign: 'center',
                  padding: '12px',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  borderColor: 'var(--primary)'
                }}
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading} style={{ fontSize: '1.1rem', padding: '14px', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>{loading ? 'Procesando canje...' : '⚡ Reclamar Créditos'}</span>
            </button>
          </form>

          {/* Animación del scanner simulado */}
          <div 
            style={{ 
              marginTop: '30px', 
              border: '1px dashed rgba(255,255,255,0.1)', 
              borderRadius: '8px', 
              padding: '15px', 
              textAlign: 'center', 
              backgroundColor: 'rgba(255,255,255,0.01)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '2px',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981',
                animation: 'scan-anim 3s infinite ease-in-out'
              }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Lector Digital UNACH-Connect Activo
            </span>
            <style>{`
              @keyframes scan-anim {
                0% { top: 0%; }
                50% { top: 100%; }
                100% { top: 0%; }
              }
            `}</style>
          </div>
        </div>

      </main>
    </div>
  );
}
