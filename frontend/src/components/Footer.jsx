import logoNegativo from '../assets/logo negativo-8.png';
import logoPositivo from '../assets/logo positivo-8.png';

export default function Footer() {
  const instagramUrl = "https://www.instagram.com/unach_connect?igsh=MTVsdHpycGd0b3FpZQ%3D%3D&utm_source=qr";
  const tiktokUrl = "https://www.tiktok.com/@unachconnect?_r=1&_t=ZS-98BGUpOzbeC";

  return (
    <footer 
      style={{
        width: '100%',
        backgroundColor: 'rgba(0, 29, 57, 0.95)',
        borderTop: '1px solid rgba(123, 189, 232, 0.35)',
        padding: '30px 20px',
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
        {/* Logos Oficiales con tamaño grande */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <img 
            src={logoNegativo} 
            alt="UNACH-Connect Logo Negativo" 
            style={{ height: '110px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }} 
          />
          <img 
            src={logoPositivo} 
            alt="UNACH-Connect Logo Positivo" 
            style={{ height: '110px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }} 
          />
        </div>

        {/* Sección de Créditos con paleta #7BBDE8 y #BDD8E9 */}
        <div style={{ textAlign: 'center', flex: '1', minWidth: '280px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#7BBDE8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
            CRÉDITOS
          </div>
          <div style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: '800', letterSpacing: '0.5px' }}>
            UNIVERSIDAD NACIONAL DE CHIMBORAZO
          </div>
          <div style={{ color: '#BDD8E9', fontSize: '0.9rem', fontWeight: '600', marginTop: '3px' }}>
            CARRERA DE DISEÑO GRÁFICO
          </div>
          <div style={{ color: '#7BBDE8', fontSize: '0.85rem', fontWeight: '600', marginTop: '6px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
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
              backgroundColor: 'rgba(225, 48, 108, 0.2)',
              border: '1px solid rgba(225, 48, 108, 0.5)',
              color: '#FF6492',
              padding: '10px 18px',
              borderRadius: '24px',
              fontSize: '0.9rem',
              fontWeight: '700',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(225, 48, 108, 0.2)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(225, 48, 108, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(225, 48, 108, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              backgroundColor: 'rgba(123, 189, 232, 0.15)',
              border: '1px solid rgba(123, 189, 232, 0.4)',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: '24px',
              fontSize: '0.9rem',
              fontWeight: '700',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(123, 189, 232, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(123, 189, 232, 0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 2.164 6.337 6.337 0 0 0 1.258 8.877 6.328 6.328 0 0 0 7.828-.621 6.334 6.334 0 0 0 1.769-4.435V9.406a8.211 8.211 0 0 0 5.07 1.724V7.684a4.82 4.82 0 0 1-1.308-1.002z"/>
            </svg>
            <span>TikTok</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
