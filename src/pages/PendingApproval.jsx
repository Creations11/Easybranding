// src/pages/PendingApproval.jsx
import { Link } from 'react-router-dom';

const t = {
  bg: '#080A06', card: '#0E110B', lime: '#B8F040',
  earth: '#C4873A', text: '#EEF0E8', muted: '#8A9080',
  border: 'rgba(184,240,64,0.12)',
};

export default function PendingApproval() {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('eb_user') || '{}'); }
    catch { return {}; }
  })();

  const handleSignOut = () => {
    localStorage.removeItem('eb_token');
    localStorage.removeItem('eb_user');
    window.location.href = '/';
  };

  return (
    <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Fraunces:ital,wght@0,700;0,900;1,900&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '48px' }}>
          <span style={{ fontSize: '20px' }}>🌿</span>
          <span style={{ fontSize: '16px', fontWeight: '700', color: t.text }}>Easy Branding <span style={{ color: t.lime }}>AI</span></span>
        </Link>

        {/* Status card */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '24px', padding: '48px 40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🌱</div>

          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: '900', marginBottom: '12px', color: t.lime }}>
            Your account is growing.
          </h1>

          <p style={{ color: t.muted, fontSize: '16px', lineHeight: '1.7', marginBottom: '32px' }}>
            Your registration is <strong style={{ color: t.text }}>pending approval</strong>. An administrator is reviewing your application and will grant access shortly.
          </p>

          {/* User details */}
          {user.fullName && (
            <div style={{ background: 'rgba(184,240,64,0.05)', border: `1px solid ${t.border}`, borderRadius: '14px', padding: '18px', marginBottom: '32px', textAlign: 'left' }}>
              <p style={{ color: t.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Your details</p>
              <p style={{ color: t.text, fontWeight: '600', marginBottom: '4px' }}>{user.fullName}</p>
              <p style={{ color: t.muted, fontSize: '14px' }}>{user.email}</p>
            </div>
          )}

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '36px' }}>
            {[
              { step: '1', label: 'Registration submitted', done: true },
              { step: '2', label: 'Admin reviews your account', done: false },
              { step: '3', label: 'Access granted', done: false },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: item.done ? 'rgba(184,240,64,0.06)' : 'rgba(255,255,255,0.02)', borderRadius: '10px', border: `1px solid ${item.done ? t.border : 'rgba(255,255,255,0.05)'}` }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: item.done ? t.lime : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: item.done ? '#080A06' : t.muted, fontWeight: '700', flexShrink: 0 }}>
                  {item.done ? '✓' : item.step}
                </div>
                <span style={{ color: item.done ? t.text : t.muted, fontSize: '14px' }}>{item.label}</span>
              </div>
            ))}
          </div>

          <p style={{ color: t.muted, fontSize: '13px', marginBottom: '24px' }}>
            Questions? WhatsApp us at{' '}
            <a href="https://wa.me/27846549578" target="_blank" rel="noreferrer" style={{ color: t.lime, textDecoration: 'none' }}>+27 84 654 9578</a>
          </p>

          <button onClick={handleSignOut} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: t.muted, padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontFamily: "'Outfit', sans-serif" }}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}