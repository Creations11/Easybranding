import { Link, useNavigate } from 'react-router-dom';

const colors = {
  lime: '#a3e635',
  text: '#f5f5f0',
  muted: '#a1a1aa',
};

export default function Nav({ onChatOpen }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('eb_token');
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('eb_user') || '{}');
    } catch {
      return {};
    }
  })();

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(5,5,5,0.95)', padding: '18px 40px',
      borderBottom: '1px solid rgba(163,230,53,0.22)'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '28px', fontWeight: '800', color: colors.lime }}>Easy Branding AI</div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {token && <Link to="/dashboard" style={{ color: colors.text, textDecoration: 'none' }}>Dashboard</Link>}
          {token && user?.role === 'admin' && <Link to="/admin" style={{ color: '#22d3ee', fontWeight: '600' }}>Admin</Link>}
          
          {token ? (
            <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: colors.muted, padding: '8px 18px', borderRadius: '8px', cursor: 'pointer' }}>
              Sign Out
            </button>
          ) : (
            <Link to="/login" style={{ color: colors.lime, fontWeight: '600' }}>Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}