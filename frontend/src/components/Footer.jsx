import logoNegativo from '../assets/logo negativo-8.png';
import logoPositivo from '../assets/logo positivo-8.png';

export default function Footer() {
  const instagramUrl = "https://www.instagram.com/unach_connect?igsh=MTVsdHpycGd0b3FpZQ%3D%3D&utm_source=qr";
  const tiktokUrl = "https://www.tiktok.com/@unachconnect?_r=1&_t=ZS-98BGUpOzbeC";

  return (
    <footer 
      style={{
        width: '100%',
        backgroundColor: 'rgba(7, 10, 20, 0.96)',
        borderTop: '1px solid var(--glass-border)',
        padding: '24px 20px',
        marginTop: 'auto',
        backdropFilter: 'blur(16px)',
        zIndex: 10
      }}
    >
      <div 
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}
      >
        {/* Logos Oficiales */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img 
            src={logoNegativo} 
            alt="UNACH-Connect Logo Negativo" 
            style={{ height: '75px', width: 'auto', objectFit: 'contain' }} 
          />
          <img 
            src={logoPositivo} 
            alt="UNACH-Connect Logo Positivo" 
            style={{ height: '75px', width: 'auto', objectFit: 'contain' }} 
          />
        </div>

        {/* Sección de Créditos */}
        <div style={{ textAlign: 'center', flex: '1', minWidth: '260px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
            CRÉDITOS
          </div>
          <div style={{ color: '#FFFFFF', fontSize: '0.9rem', fontWeight: '700', letterSpacing: '0.5px' }}>
            UNIVERSIDAD NACIONAL DE CHIMBORAZO
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', marginTop: '2px' }}>
            CARRERA DE DISEÑO GRÁFICO
          </div>
          <div style={{ color: '#CBD5E1', fontSize: '0.8rem', marginTop: '4px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span>• MICAELA MARIÑO</span>
            <span>• BELÉN YANTALEMA</span>
          </div>
        </div>

        {/* Botones de Redes Sociales */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a 
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(225, 48, 108, 0.15)',
              border: '1px solid rgba(225, 48, 108, 0.4)',
              color: '#FF6492',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '700',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(225, 48, 108, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(225, 48, 108, 0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            <span>Instagram</span>
          </a>

          <a 
            href={tiktokUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '700',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 2.164 6.337 6.337 0 0 0 1.258 8.877 6.328 6.328 0 0 0 7.828-.621 6.334 6.334 0 0 0 1.769-4.435V9.406a8.211 8.211 0 0 0 5.07 1.724V7.684a4.82 4.82 0 0 1-1.308-1.002z"/>
            </svg>
            <span>TikTok</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
