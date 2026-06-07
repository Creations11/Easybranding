// src/components/Nav.jsx — Mobile responsive with hamburger menu
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const t = {
  lime:    '#B8F040',
  emerald: '#34d399',
  cyan:    '#22d3ee',
  text:    '#EEF0E8',
  muted:   '#8A9080',
  border:  'rgba(184,240,64,0.15)',
  bg:      'rgba(8,10,6,0.97)',
};

export default function Nav({ onChatOpen }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const token = localStorage.getItem('eb_token');
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('eb_user') || '{}'); }
    catch { return {}; }
  })();

  const isSuperAdmin = ['super_admin', 'eb_manager'].includes(user.role);
  const isAdmin      = user.role === 'admin';
  const isAgent      = ['agent', 'admin', 'super_admin', 'eb_agent', 'eb_manager'].includes(user.role);

  const handleSignOut = () => {
    localStorage.removeItem('eb_token');
    localStorage.removeItem('eb_user');
    window.location.href = '/';
  };

  const NavLinks = ({ mobile = false }) => (
    <>
      {token && isSuperAdmin && (
        <Link to="/superadmin" onClick={() => setMenuOpen(false)} style={{ padding: mobile ? '14px 0' : '8px 16px', color: t.lime, fontWeight: '600', textDecoration: 'none', fontSize: mobile ? '16px' : '14px', display: 'block', borderBottom: mobile ? `1px solid rgba(255,255,255,0.06)` : 'none' }}>
          Dashboard
        </Link>
      )}
      {token && isAdmin && (
        <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ padding: mobile ? '14px 0' : '8px 16px', color: t.cyan, fontWeight: '600', textDecoration: 'none', fontSize: mobile ? '16px' : '14px', display: 'block', borderBottom: mobile ? `1px solid rgba(255,255,255,0.06)` : 'none' }}>
          Admin
        </Link>
      )}
      {token && isAgent && !isSuperAdmin && (
        <Link to="/agent" onClick={() => setMenuOpen(false)} style={{ padding: mobile ? '14px 0' : '8px 16px', color: t.emerald, fontWeight: '600', textDecoration: 'none', fontSize: mobile ? '16px' : '14px', display: 'block', borderBottom: mobile ? `1px solid rgba(255,255,255,0.06)` : 'none' }}>
          Agent
        </Link>
      )}
      {token ? (
        <button onClick={handleSignOut} style={{ padding: mobile ? '14px 0' : '8px 18px', background: 'none', border: mobile ? 'none' : '1px solid rgba(255,255,255,0.1)', color: t.muted, borderRadius: mobile ? '0' : '8px', cursor: 'pointer', fontSize: mobile ? '16px' : '14px', fontFamily: "'Outfit', sans-serif", textAlign: 'left', width: mobile ? '100%' : 'auto' }}>
          Sign Out
        </button>
      ) : (
        <>
          <Link to="/login" onClick={() => setMenuOpen(false)} style={{ padding: mobile ? '14px 0' : '8px 18px', background: 'transparent', border: mobile ? 'none' : '1px solid rgba(255,255,255,0.1)', color: t.muted, borderRadius: mobile ? '0' : '8px', textDecoration: 'none', fontSize: mobile ? '16px' : '14px', display: 'block', borderBottom: mobile ? `1px solid rgba(255,255,255,0.06)` : 'none' }}>
            Sign In
          </Link>
          <Link to="/register" onClick={() => setMenuOpen(false)} style={{ padding: mobile ? '16px 0' : '8px 18px', background: mobile ? t.lime : t.lime, color: '#080A06', borderRadius: mobile ? '12px' : '8px', textDecoration: 'none', fontSize: mobile ? '16px' : '14px', fontWeight: '700', display: 'block', textAlign: mobile ? 'center' : 'left', marginTop: mobile ? '8px' : '0' }}>
            Get Started
          </Link>
        </>
      )}
    </>
  );

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
        @media (min-width: 769px) {
          .nav-desktop { display: flex !important; }
          .nav-hamburger { display: none !important; }
          .nav-mobile-menu { display: none !important; }
        }
      `}</style>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: t.bg, backdropFilter: 'blur(16px)', padding: '0 20px', height: '64px', display: 'flex', alignItems: 'center', borderBottom: `1px solid ${t.border}`, fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontSize: '20px' }}>🌿</span>
            <span style={{ fontSize: '16px', fontWeight: '700', color: t.text, whiteSpace: 'nowrap' }}>
              Easy Branding <span style={{ color: t.lime }}>AI</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="nav-desktop" style={{ gap: '6px', alignItems: 'center' }}>
            <NavLinks />
          </div>

          {/* Hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'none', flexDirection: 'column', gap: '5px' }}>
            <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? t.lime : t.text, transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? t.lime : t.text, transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? t.lime : t.text, transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="nav-mobile-menu" style={{ position: 'fixed', top: '64px', left: 0, right: 0, background: t.bg, borderBottom: `1px solid ${t.border}`, zIndex: 99, padding: '8px 24px 24px', fontFamily: "'Outfit', sans-serif" }}>
          <NavLinks mobile />
        </div>
      )}

      {/* Floating action button */}
      {token && onChatOpen && (
        <button onClick={onChatOpen} style={{ position: 'fixed', bottom: '24px', right: '20px', width: '52px', height: '52px', borderRadius: '50%', background: `linear-gradient(135deg, ${t.lime}, #4A6741)`, border: 'none', fontSize: '22px', boxShadow: `0 8px 24px rgba(184,240,64,0.3)`, zIndex: 150, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          🌿
        </button>
      )}
    </>
  );
}