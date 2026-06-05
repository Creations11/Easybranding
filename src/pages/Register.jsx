// src/pages/Register.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const colors = {
  bg: '#050505', card: '#121210', lime: '#a3e635',
  text: '#f5f5f0', muted: '#a1a1aa', border: 'rgba(163,230,53,0.22)',
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

  // ── Pending approval screen ───────────────────────────────
  if (pending) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: colors.card, padding: '60px 40px', borderRadius: '24px', width: '100%', maxWidth: '480px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🌿</div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '16px', color: colors.lime }}>Application Received</h2>
          <p style={{ color: colors.muted, fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
            Thank you for registering. Your account is currently <strong style={{ color: colors.text }}>pending approval</strong>.
            <br /><br />
            An administrator will review your application and grant access shortly.
          </p>
          <div style={{ background: 'rgba(163,230,53,0.08)', border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '20px', marginBottom: '32px' }}>
            <p style={{ color: colors.muted, fontSize: '14px' }}>Registered as:</p>
            <p style={{ color: colors.text, fontWeight: '600', marginTop: '4px' }}>{fullName}</p>
            <p style={{ color: colors.muted, fontSize: '14px', marginTop: '2px' }}>{email}</p>
          </div>
          <Link to="/login" style={{ color: colors.lime, fontSize: '14px' }}>← Back to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: colors.card, padding: '60px 40px', borderRadius: '24px', width: '100%', maxWidth: '420px', border: `1px solid ${colors.border}` }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Create Account</h2>
        <p style={{ textAlign: 'center', color: colors.muted, fontSize: '14px', marginBottom: '36px' }}>Registration requires admin approval</p>
        {error && <p style={{ color: '#f87171', textAlign: 'center', marginBottom: '16px' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input type="text"     value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name"      style={{ width: '100%', padding: '16px', marginBottom: '16px', borderRadius: '16px', background: '#1C1C19', border: `1px solid ${colors.border}`, color: colors.text }} required />
          <input type="email"    value={email}    onChange={e => setEmail(e.target.value)}    placeholder="Email"          style={{ width: '100%', padding: '16px', marginBottom: '16px', borderRadius: '16px', background: '#1C1C19', border: `1px solid ${colors.border}`, color: colors.text }} required />
          <input type="tel"      value={phone}    onChange={e => setPhone(e.target.value)}    placeholder="Phone Number"   style={{ width: '100%', padding: '16px', marginBottom: '16px', borderRadius: '16px', background: '#1C1C19', border: `1px solid ${colors.border}`, color: colors.text }} required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"       style={{ width: '100%', padding: '16px', marginBottom: '32px', borderRadius: '16px', background: '#1C1C19', border: `1px solid ${colors.border}`, color: colors.text }} required />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '999px', fontWeight: '700' }}>
            {loading ? 'Submitting...' : 'Request Access'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px', color: colors.muted }}>Already have an account? <Link to="/login" style={{ color: colors.lime }}>Sign In</Link></p>
      </div>
    </div>
  );
}