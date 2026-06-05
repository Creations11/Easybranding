// src/components/Nav.jsx
import { Link, useNavigate } from 'react-router-dom';

const t = {
  lime:    '#B8F040',
  emerald: '#34d399',
  cyan:    '#22d3ee',
  text:    '#EEF0E8',
  muted:   '#8A9080',
  border:  'rgba(184,240,64,0.15)',
};

export default function Nav({ onChatOpen }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('eb_token');
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('eb_user') || '{}'); }
    catch { return {}; }
  })();

  const isAdmin = ["admin", "super_admin"].includes(user.role);
  const isAgent = ["agent", "admin", "super_admin"].includes(user.role);

  const handleSignOut = () => {
    localStorage.removeItem('eb_token');
    localStorage.removeItem('eb_user');
    window.location.href = '/';
  };

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(8,10,6,0.95)',
        backdropFilter: 'blur(16px)',
        padding: '0 40px', height: '68px',
        display: 'flex', alignItems: 'center',
        borderBottom: `1px solid ${t.border}`,
        fontFamily: "'Outfit', sans-serif",
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span style={{ fontSize: '20px' }}>🌿</span>
            <span style={{ fontSize: '17px', fontWeight: '700', color: t.text }}>
              Easy Branding <span style={{ color: t.lime }}>AI</span>
            </span>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {token && ['super_admin', 'admin'].includes(user.role) && (
              <Link to="/dashboard" style={{ padding: '8px 16px', color: t.muted, textDecoration: 'none', fontSize: '14px', borderRadius: '8px' }}>
                Dashboard
              </Link>
            )}
            {token && isAgent && (
              <Link to="/agent" style={{ padding: '8px 16px', color: t.emerald, fontWeight: '600', textDecoration: 'none', fontSize: '14px', borderRadius: '8px' }}>
                Agent
              </Link>
            )}
            {token && isAdmin && (
              <Link to="/admin" style={{ padding: '8px 16px', color: t.cyan, fontWeight: '600', textDecoration: 'none', fontSize: '14px', borderRadius: '8px' }}>
                Admin
              </Link>
            )}
            {token ? (
              <button
                onClick={handleSignOut}
                style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: t.muted, borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: "'Outfit', sans-serif" }}>
                Sign Out
              </button>
            ) : (
              <>
                <Link to="/login" style={{ padding: '8px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: t.muted, borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}>
                  Sign In
                </Link>
                <Link to="/register" style={{ padding: '8px 18px', background: t.lime, color: '#080A06', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Floating action button */}
      {token && (
        <button
          onClick={onChatOpen}
          style={{
            position: 'fixed', bottom: '28px', right: '28px',
            width: '56px', height: '56px', borderRadius: '50%',
            background: `linear-gradient(135deg, ${t.lime}, #4A6741)`,
            border: 'none', fontSize: '24px',
            boxShadow: `0 8px 32px rgba(184,240,64,0.3)`,
            zIndex: 150, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          🌿
        </button>
      )}
    </>
  );
}