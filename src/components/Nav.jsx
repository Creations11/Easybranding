import { Link, useNavigate } from 'react-router-dom';

const colors = { lime: '#a3e635', emerald: '#34d399', text: '#f5f5f0', muted: '#a1a1aa' };

export default function Nav({ onChatOpen }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('eb_token');
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('eb_user') || '{}'); }
    catch { return {}; }
  })();

  const isAdmin  = ["admin", "super_admin"].includes(user.role);
  const isAgent  = ["agent", "admin", "super_admin"].includes(user.role);

  return (
    <>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(5,5,5,0.95)', padding: '18px 40px', borderBottom: '1px solid rgba(163,230,53,0.22)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: colors.lime }}>Easy Branding AI</div>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {token && <Link to="/dashboard" style={{ color: colors.text, textDecoration: 'none' }}>Dashboard</Link>}
            {token && isAgent  && <Link to="/agent" style={{ color: colors.emerald, fontWeight: '600', textDecoration: 'none' }}>Agent</Link>}
            {token && isAdmin  && <Link to="/admin" style={{ color: '#22d3ee', fontWeight: '600', textDecoration: 'none' }}>Admin</Link>}
            {token ? (
              <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: colors.muted, padding: '8px 18px', borderRadius: '8px', cursor: 'pointer' }}>
                Sign Out
              </button>
            ) : (
              <Link to="/login" style={{ color: colors.lime, fontWeight: '600', textDecoration: 'none' }}>Sign In</Link>
            )}
          </div>
        </div>
      </nav>

      <button onClick={() => token ? onChatOpen() : navigate('/login')} style={{ position: 'fixed', bottom: '32px', right: '32px', width: '68px', height: '68px', borderRadius: '50%', background: `linear-gradient(135deg, #a3e635, #34d399)`, border: 'none', fontSize: '32px', boxShadow: `0 12px 40px rgba(163,230,53,0.5)`, zIndex: 150, cursor: 'pointer' }}>
        {token ? '🌿' : '🚀'}
      </button>
    </>
  );
}