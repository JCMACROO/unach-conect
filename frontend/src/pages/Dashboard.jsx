import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logoNegativo from '../assets/logo negativo-8.png';
import ParticlesBackground from '../components/ParticlesBackground';
import { supabase } from '../supabaseClient';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(0.00);
  const [tutorStatus, setTutorStatus] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Wallet Ledger & Redemption State
  const [transactions, setTransactions] = useState([]);
  const [activeCodes, setActiveCodes] = useState([]);
  const [partners, setPartners] = useState([]);
  
  // Redeem Modal State
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');
  const [submittingRedeem, setSubmittingRedeem] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          navigate('/login');
          return;
        }

        // 1. Get profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        // 2. Get wallet balance & ledger from Laravel API
        const walletRes = await fetch(`${import.meta.env.VITE_API_URL}/wallet/balance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          setBalance(parseFloat(walletData.balance));
          setTransactions(walletData.transactions || []);
          setActiveCodes(walletData.active_codes || []);
        }

        // 3. Get partners list for redemption
        const partnersRes = await fetch(`${import.meta.env.VITE_API_URL}/partners`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (partnersRes.ok) {
          const partnersData = await partnersRes.json();
          setPartners(partnersData);
          if (partnersData.length > 0) {
            setSelectedPartnerId(partnersData[0].id);
          }
        }

        // 4. Get tutor status
        const { data: tutorData } = await supabase
          .from('tutors')
          .select('status')
          .eq('id', user.id)
          .single();

        if (tutorData) {
          setTutorStatus(tutorData.status);
        }

        // 5. Get tutoring sessions
        const { data: sessionsData } = await supabase
          .from('tutoring_sessions')
          .select(`
            id,
            status,
            scheduled_at,
            subjects ( name ),
            tutors ( id )
          `)
          .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
          .order('scheduled_at', { ascending: false });

        if (sessionsData) {
          // Resolve tutor/student names dynamically
          const resolvedSessions = await Promise.all(
            sessionsData.map(async (session) => {
              const { data: tutorProfile } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', session.tutors?.id)
                .single();

              return {
                id: session.id,
                subject: session.subjects?.name || 'Materia general',
                tutorName: tutorProfile?.full_name || 'Desconocido',
                date: new Date(session.scheduled_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }),
                status: session.status
              };
            })
          );
          setSessions(resolvedSessions);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleGenerateRedemptionCode = async (e) => {
    e.preventDefault();
    setRedeemError('');
    setRedeemSuccess('');
    setSubmittingRedeem(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/wallet/redeem/code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(redeemAmount),
          partner_shop_id: selectedPartnerId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al generar el código.');
      }

      setGeneratedCode(data.code);
      setRedeemSuccess(`Código generado con éxito: ${data.code}`);
      setRedeemAmount('');
      
      // Reload balance & ledger
      const walletRes = await fetch(`${import.meta.env.VITE_API_URL}/wallet/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setBalance(parseFloat(walletData.balance));
        setTransactions(walletData.transactions || []);
        setActiveCodes(walletData.active_codes || []);
      }
    } catch (err) {
      setRedeemError(err.message || 'Error de conexión.');
    } finally {
      setSubmittingRedeem(false);
    }
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'tutoring_payment': return '📅 Pago de Tutoría';
      case 'tutoring_earning': return '💰 Ingreso por Tutoría';
      case 'shop_redemption': return '🛍️ Canje de Ploteos';
      case 'refund': return '↩️ Reembolso';
      case 'admin_adjustment': return '⚙️ Ajuste de Admin';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <ParticlesBackground />
        <div style={{ textalign: 'center' }}>
          <h2>Cargando Dashboard...</h2>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="dashboard-container">
      <ParticlesBackground />
      
      {/* Header */}
      <header className="landing-header">
        <div className="brand">
          <Link to="/dashboard" className="brand-link">
            <img src={logoNegativo} alt="UNACH-Connect Logo" className="brand-logo" />
            <span className="brand-title">UNACH-Connect</span>
          </Link>
        </div>
        <nav className="landing-nav">
          <Link to="/contributions" className="nav-link" style={{ marginRight: '15px', color: '#FF5E13', fontWeight: 'bold' }}>Foro Académico</Link>
          <span className="user-welcome">Hola, {profile.full_name}</span>
          {profile.role === 'admin' && (
            <Link to="/admin/dashboard" className="nav-link" style={{ marginRight: '15px', color: '#fca5a5', fontWeight: 'bold' }}>Panel Admin</Link>
          )}
          {profile.role === 'partner' && (
            <Link to="/partner/redeem" className="nav-link" style={{ marginRight: '15px', color: '#a7f3d0', fontWeight: 'bold' }}>Canjes</Link>
          )}
          <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
        </nav>
      </header>
 
      {/* Main Panel */}
      <main className="dashboard-main">
        <div className="dashboard-grid">
          {/* Left panel: Balance & Quick Stats */}
          <div className="dashboard-card promo-card">
            <h2>Mi Billetera</h2>
            <div className="credit-display">
              <span className="credit-amount">{balance.toFixed(2)}</span>
              <span className="credit-label">UNACH-Credits</span>
            </div>
            <p className="card-desc">Úsalos para agendar tutorías o canjéalos por ploteos e impresiones en locales asociados.</p>
            <div className="action-buttons">
              <Link to="/search" className="btn-primary">Buscar Tutor</Link>
              <button className="btn-secondary" onClick={() => { setIsRedeemModalOpen(true); setGeneratedCode(null); setRedeemError(''); setRedeemSuccess(''); }}>Generar Canje</button>
            </div>

            {/* Mostrar códigos activos en el dashboard */}
            {activeCodes.length > 0 && (
              <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
                <h4 style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '8px' }}>🔑 Códigos de Canje Activos:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeCodes.map((codeObj) => (
                    <div key={codeObj.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '4px', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 'bold', color: '#10B981' }}>{codeObj.code}</span>
                      <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{codeObj.partner?.full_name}</span>
                      <button 
                        onClick={() => {
                          setGeneratedCode(codeObj.code);
                          setIsRedeemModalOpen(true);
                          setRedeemSuccess(`Código activo recuperado: ${codeObj.code}`);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        👁️ Ver QR
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
 
          {/* Right panel: Tutor status & applications */}
          <div className="dashboard-card status-card">
            {profile.role === 'admin' ? (
              <>
                <h2>Panel de Administración</h2>
                <p className="card-desc">Tienes privilegios de Administrador para gestionar el catálogo y las postulaciones de tutores.</p>
                
                <div className="tutor-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '6px 12px', borderRadius: '20px', display: 'inline-block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '16px' }}>
                  <span>Rol actual: Administrador</span>
                </div>
 
                <div className="tutor-application-promo" style={{ marginTop: '10px' }}>
                  <Link to="/admin/dashboard" className="btn-primary" style={{ display: 'block', textAlign: 'center', backgroundColor: '#EF4444', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}>
                    Acceder al Panel Admin
                  </Link>
                </div>
              </>
            ) : profile.role === 'partner' ? (
              <>
                <h2>Portal de Comercio</h2>
                <p className="card-desc">Tienes privilegios de Comercio Aliado para escanear y reclamar códigos de canje de ploteos y librerías.</p>
                
                <div className="tutor-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#a7f3d0', padding: '6px 12px', borderRadius: '20px', display: 'inline-block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '16px' }}>
                  <span>Rol actual: Comercio Aliado</span>
                </div>
 
                <div className="tutor-application-promo" style={{ marginTop: '10px' }}>
                  <Link to="/partner/redeem" className="btn-primary" style={{ display: 'block', textAlign: 'center' }}>
                    Escanear Código de Canje
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2>Postular como Tutor</h2>
                <p className="card-desc">¿Aprobaste una materia crítica con excelente nota y deseas ganar créditos ayudando a tus compañeros?</p>
                
                <div className={`tutor-badge ${tutorStatus === 'approved' ? 'approved-badge' : 'pending-badge'}`}>
                  <span>Rol actual: {tutorStatus === 'approved' ? 'Tutor Referente' : 'Alumno'}</span>
                </div>
 
                <div className="tutor-application-promo">
                  {tutorStatus === 'pending' && (
                    <p style={{ color: 'var(--warning)', fontWeight: 'bold' }}>⚠️ Tu postulación está siendo revisada por la administración.</p>
                  )}
                  {tutorStatus === 'approved' && (
                    <p style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓ ¡Eres un Tutor Aprobado! Ya puedes dictar clases y recibir créditos.</p>
                  )}
                  {(!tutorStatus || tutorStatus === 'suspended') && (
                    <>
                      <p>Conviértete en "Referente" de la Carrera. Se requiere una nota mínima de 8.5/10 y subir tu reporte de calificaciones (Kardex).</p>
                      <Link to="/tutor/apply" className="btn-primary">Iniciar Postulación</Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
 
        {/* Bottom Panel: Recent sessions */}
        <div className="dashboard-card wide-card" style={{ marginBottom: '30px' }}>
          <h2>Mis Tutorías Recientes</h2>
          <div className="sessions-table-wrapper">
            {sessions.length === 0 ? (
              <p className="card-desc" style={{ textAlign: 'center', padding: '20px 0' }}>No tienes tutorías programadas o completadas en el sistema.</p>
            ) : (
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>Materia</th>
                    <th>Tutor / Alumno</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td>{session.subject}</td>
                      <td>{session.tutorName}</td>
                      <td>{session.date}</td>
                      <td>
                        <span className={`status-badge ${session.status}`}>
                          {session.status === 'requested' ? 'Solicitada' :
                           session.status === 'scheduled' ? 'Agendada' :
                           session.status === 'completed' ? 'Completada' : 'Cancelada'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Ledger: Historial de Créditos */}
        <div className="dashboard-card wide-card">
          <h2>Historial de UNACH-Credits</h2>
          <div className="sessions-table-wrapper">
            {transactions.length === 0 ? (
              <p className="card-desc" style={{ textAlign: 'center', padding: '20px 0' }}>No registras transacciones financieras en el sistema.</p>
            ) : (
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Concepto / Descripción</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        {new Date(tx.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td>{tx.description}</td>
                      <td>{getTransactionTypeLabel(tx.type)}</td>
                      <td style={{ fontWeight: 'bold', color: tx.amount > 0 ? '#10B981' : '#EF4444' }}>
                        {tx.amount > 0 ? '+' : ''}{parseFloat(tx.amount).toFixed(2)} UNACH-Credits
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Redeem QR Code Modal */}
      {isRedeemModalOpen && (
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
              maxWidth: '450px', 
              width: '100%', 
              margin: '0', 
              background: 'var(--bg-card)', 
              border: '1px solid var(--glass-border)',
              position: 'relative',
              textAlign: 'center'
            }}
          >
            <button 
              onClick={() => setIsRedeemModalOpen(false)}
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

            <h2 style={{ color: '#fff', marginBottom: '8px' }}>Canje de UNACH-Credits</h2>
            
            {redeemError && (
              <div className="auth-alert error-alert" style={{ margin: '15px 0' }}>
                <span className="alert-icon">⚠️</span>
                <span className="alert-text">{redeemError}</span>
              </div>
            )}

            {generatedCode ? (
              <div style={{ marginTop: '20px' }}>
                <p className="card-desc" style={{ marginBottom: '15px' }}>Presenta este código QR en el comercio aliado seleccionado. Expira en 10 minutos.</p>
                
                {/* Código QR Real usando api libre de qrserver */}
                <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', display: 'inline-block', marginBottom: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${generatedCode}`} 
                    alt={`Redemption QR ${generatedCode}`} 
                    style={{ display: 'block', width: '150px', height: '150px' }}
                  />
                </div>

                <div 
                  style={{ 
                    fontSize: '1.8rem', 
                    fontWeight: 'bold', 
                    letterSpacing: '2px', 
                    color: '#fff', 
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    padding: '10px 15px',
                    borderRadius: '6px',
                    display: 'inline-block',
                    marginBottom: '10px'
                  }}
                >
                  {generatedCode}
                </div>
                
                <p style={{ color: 'var(--warning)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  ⚠️ Si no se canjea a tiempo, el saldo se reembolsará automáticamente.
                </p>
              </div>
            ) : (
              <form onSubmit={handleGenerateRedemptionCode} className="auth-form" style={{ marginTop: '20px', textAlign: 'left' }}>
                
                {/* Seleccionar Comercio */}
                <div className="form-group">
                  <label htmlFor="partner">¿En qué comercio deseas canjear?</label>
                  <select
                    id="partner"
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    required
                    disabled={submittingRedeem}
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
                    {partners.length === 0 ? (
                      <option value="">No hay comercios asociados disponibles</option>
                    ) : (
                      partners.map((partner) => (
                        <option key={partner.id} value={partner.id}>{partner.full_name}</option>
                      ))
                    )}
                  </select>
                </div>

                {/* Cantidad de créditos */}
                <div className="form-group">
                  <label htmlFor="amount">Cantidad de UNACH-Credits a retirar</label>
                  <input
                    type="number"
                    id="amount"
                    placeholder="Mínimo 0.50"
                    step="0.05"
                    min="0.5"
                    max={balance}
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    required
                    disabled={submittingRedeem}
                    className="form-input"
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    Saldo disponible: {balance.toFixed(2)} UNACH-Credits
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
                  <button 
                    type="submit" 
                    className="auth-submit-btn" 
                    disabled={submittingRedeem || partners.length === 0} 
                    style={{ flex: '1', margin: 0 }}
                  >
                    {submittingRedeem ? 'Generando QR...' : 'Generar QR'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsRedeemModalOpen(false)} 
                    className="logout-btn" 
                    style={{ 
                      flex: '1', 
                      margin: 0, 
                      border: '1px solid var(--glass-border)', 
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: '#fff'
                    }}
                    disabled={submittingRedeem}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
