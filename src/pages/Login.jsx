// src/pages/Login.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const t = {
  bg:     '#080A06',
  card:   '#0E110B',
  lime:   '#B8F040',
  earth:  '#C4873A',
  moss:   '#4A6741',
  sage:   '#7A9E6E',
  text:   '#EEF0E8',
  muted:  '#8A9080',
  border: 'rgba(184,240,64,0.12)',
  red:    '#f87171',
};

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user } = res.data.data;

      // Token is now in httpOnly cookie — browser handles it automatically
      // Only store user data
      localStorage.setItem('eb_user', JSON.stringify(user));

      if (['super_admin', 'eb_manager', 'eb_agent'].includes(user.role)) window.location.href = '/superadmin';
      else if (user.role === 'admin')    window.location.href = '/admin';
      else if (user.role === 'agent')    window.location.href = '/agent';
      else if (user.role === 'borrower') window.location.href = '/pending';
      else window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', color: t.text,
    fontSize: '15px', outline: 'none',
    transition: 'border-color 0.2s ease',
    fontFamily: "'Outfit', sans-serif",
  };

  return (
    <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', fontFamily: "'Outfit', sans-serif" }}>
      
      <style>{`
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .login-right-panel { width: 100% !important; padding: 80px 24px 40px !important; }
        }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&display=swap" rel="stylesheet" />

      {/* Left panel — brand */}
      <div className="login-left-panel" style={{ flex: 1, background: t.card, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', borderRight: `1px solid ${t.border}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px', background: 'radial-gradient(ellipse, rgba(74,103,65,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '200px', height: '200px', background: 'radial-gradient(ellipse, rgba(184,240,64,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '360px' }}>
          <div style={{ fontSize: '56px', marginBottom: '24px' }}>🌿</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '36px', fontWeight: '900', lineHeight: '1.1', marginBottom: '16px', color: t.text }}>
            Built for the <span style={{ fontStyle: 'italic', color: t.lime }}>hustle.</span>
          </h2>
          <p style={{ color: t.muted, fontSize: '15px', lineHeight: '1.7' }}>
            Your WhatsApp pipeline runs 24/7. Qualified leads land in your dashboard while you focus on closing.
          </p>

          <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { icon: '🤖', text: 'Automated lead qualification' },
              { icon: '📊', text: 'Live operations dashboard' },
              { icon: '💬', text: 'Human takeover when needed' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(184,240,64,0.05)', border: `1px solid ${t.border}`, borderRadius: '12px', padding: '12px 16px' }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span style={{ color: t.muted, fontSize: '14px' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="login-right-panel" style={{ width: '480px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '48px' }}>
          <span style={{ fontSize: '18px' }}>🌿</span>
          <span style={{ fontSize: '16px', fontWeight: '700', color: t.text }}>Easy Branding <span style={{ color: t.lime }}>AI</span></span>
        </Link>

        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.01em' }}>Welcome back</h1>
        <p style={{ color: t.muted, fontSize: '15px', marginBottom: '36px' }}>Sign in to your workspace</p>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: t.red, fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email address" required style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(184,240,64,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" required style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(184,240,64,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '15px',
            background: loading ? 'rgba(184,240,64,0.5)' : t.lime,
            color: '#080A06', border: 'none', borderRadius: '12px',
            fontWeight: '700', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '6px', fontFamily: "'Outfit', sans-serif",
            transition: 'box-shadow 0.2s ease',
          }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '28px', color: t.muted, fontSize: '14px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: t.lime, textDecoration: 'none', fontWeight: '600' }}>Request access</Link>
        </p>

        <Link to="/" style={{ display: 'block', textAlign: 'center', marginTop: '16px', color: t.muted, fontSize: '13px', textDecoration: 'none' }}>← Back to home</Link>
      </div>
    </div>
  );
}