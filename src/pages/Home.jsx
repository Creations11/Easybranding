import { Link } from 'react-router-dom';

const colors = { lime: '#a3e635', text: '#f5f5f0', muted: '#a1a1aa' };

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: colors.text, paddingTop: '100px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4.8rem', fontWeight: '900', lineHeight: '1.1', marginBottom: '24px' }}>
          AI-Powered WhatsApp<br />Automation for African Businesses
        </h1>
        <p style={{ fontSize: '1.4rem', color: colors.muted, maxWidth: '700px', margin: '0 auto 40px' }}>
          Capture leads, automate replies, qualify customers, and scale your business — all through WhatsApp.
        </p>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '80px' }}>
          <Link to="/register" style={{ padding: '18px 48px', background: colors.lime, color: '#050505', borderRadius: '999px', fontSize: '1.1rem', fontWeight: '700', textDecoration: 'none' }}>
            Start 14-Day Free Trial
          </Link>
          <button onClick={() => window.open('https://wa.me/27846549578', '_blank')} style={{ padding: '18px 48px', background: 'transparent', color: colors.text, border: `2px solid ${colors.lime}`, borderRadius: '999px', fontSize: '1.1rem', fontWeight: '600' }}>
            Talk to Us on WhatsApp
          </button>
        </div>

        <div style={{ fontSize: '1.1rem', color: '#34d399' }}>Trusted by forward-thinking South African businesses</div>
      </div>
    </div>
  );
}