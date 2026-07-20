import logoNegativo from '../assets/logo negativo-8.png';
import logoPositivo from '../assets/logo positivo-8.png';

export default function Footer() {
  return (
    <footer 
      style={{
        width: '100%',
        backgroundColor: 'rgba(10, 15, 29, 0.95)',
        borderTop: '1px solid var(--glass-border)',
        padding: '16px 20px',
        marginTop: 'auto',
        backdropFilter: 'blur(12px)',
        zIndex: 10
      }}
    >
      <div 
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img 
            src={logoNegativo} 
            alt="UNACH-Connect Logo Negativo" 
            style={{ height: '42px', width: 'auto', objectFit: 'contain' }} 
          />
          <img 
            src={logoPositivo} 
            alt="UNACH-Connect Logo Positivo" 
            style={{ height: '42px', width: 'auto', objectFit: 'contain' }} 
          />
        </div>

        <div 
          style={{
            color: '#E2E8F0',
            fontSize: '0.9rem',
            fontWeight: '500',
            letterSpacing: '0.3px',
            textAlign: 'right',
            fontFamily: 'var(--font-heading)'
          }}
        >
          🎓 Página realizada para la carrera de <span style={{ color: 'var(--primary)', fontWeight: '700' }}>Diseño Gráfico</span> — UNACH
        </div>
      </div>
    </footer>
  );
}
