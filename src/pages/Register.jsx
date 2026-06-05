// src/pages/Register.jsx
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

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [pending,  setPending]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/register', { fullName, email, phone, password });
      setPending(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', color: t.text,
    fontSize: '15px', outline: 'none',
    fontFamily: "'Outfit', sans-serif",
    transition: 'border-color 0.2s ease',
  };

  // ── Pending approval screen ───────────────────────────────
  if (pending) {
    return (
      <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Outfit', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Fraunces:ital,wght@0,700;0,900;1,900&display=swap" rel="stylesheet" />
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🌱</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '32px', fontWeight: '900', marginBottom: '14px', color: t.lime }}>
            Application received.
          </h2>
          <p style={{ color: t.muted, fontSize: '16px', lineHeight: '1.7', marginBottom: '32px' }}>
            Your account is <strong style={{ color: t.text }}>pending approval</strong>. An administrator will review your application and grant access shortly.
          </p>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '20px', marginBottom: '32px' }}>
            <p style={{ color: t.muted, fontSize: '13px', marginBottom: '6px' }}>Registered as</p>
            <p style={{ color: t.text, fontWeight: '600', fontSize: '16px' }}>{fullName}</p>
            <p style={{ color: t.muted, fontSize: '14px', marginTop: '4px' }}>{email}</p>
          </div>
          <Link to="/login" style={{ color: t.lime, fontSize: '14px', textDecoration: 'none' }}>← Back to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&display=swap" rel="stylesheet" />

      {/* Left panel */}
      <div style={{ flex: 1, background: t.card, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', borderRight: `1px solid ${t.border}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '15%', right: '5%', width: '280px', height: '280px', background: 'radial-gradient(ellipse, rgba(196,135,58,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '360px' }}>
          <div style={{ fontSize: '56px', marginBottom: '24px' }}>🏘️</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '34px', fontWeight: '900', lineHeight: '1.1', marginBottom: '16px', color: t.text }}>
            Your leads, <span style={{ fontStyle: 'italic', color: t.earth }}>automated.</span>
          </h2>
          <p style={{ color: t.muted, fontSize: '15px', lineHeight: '1.7', marginBottom: '32px' }}>
            Join rental agencies across South Africa using Easy Branding AI to qualify leads 24/7 on WhatsApp.
          </p>

          <div style={{ background: 'rgba(184,240,64,0.05)', border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px' }}>
            <p style={{ color: t.muted, fontSize: '13px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>How approval works</p>
            {['Submit your details', 'Admin reviews your account', 'Get access within 24 hours'].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: i < 2 ? '10px' : 0 }}>
                <div style={{ width: '22px', height: '22px', background: t.lime, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: t.bg, fontWeight: '800', flexShrink: 0 }}>{i + 1}</div>
                <span style={{ color: t.muted, fontSize: '14px' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ width: '480px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '48px' }}>
          <span style={{ fontSize: '18px' }}>🌿</span>
          <span style={{ fontSize: '16px', fontWeight: '700', color: t.text }}>Easy Branding <span style={{ color: t.lime }}>AI</span></span>
        </Link>

        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.01em' }}>Request access</h1>
        <p style={{ color: t.muted, fontSize: '15px', marginBottom: '32px' }}>Create your account — approval required</p>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: t.red, fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
          <input type="text"     value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name"     required style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(184,240,64,0.4)'}
            onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
          <input type="email"    value={email}    onChange={e => setEmail(e.target.value)}    placeholder="Email address" required style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(184,240,64,0.4)'}
            onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
          <input type="tel"      value={phone}    onChange={e => setPhone(e.target.value)}    placeholder="Phone number"  required style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(184,240,64,0.4)'}
            onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"     required style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(184,240,64,0.4)'}
            onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '15px',
            background: loading ? 'rgba(184,240,64,0.5)' : t.lime,
            color: '#080A06', border: 'none', borderRadius: '12px',
            fontWeight: '700', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '6px', fontFamily: "'Outfit', sans-serif",
          }}>
            {loading ? 'Submitting...' : 'Request Access →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '28px', color: t.muted, fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: t.lime, textDecoration: 'none', fontWeight: '600' }}>Sign In</Link>
        </p>
        <Link to="/" style={{ display: 'block', textAlign: 'center', marginTop: '14px', color: t.muted, fontSize: '13px', textDecoration: 'none' }}>← Back to home</Link>
      </div>
    </div>
  );
}