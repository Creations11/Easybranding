import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const colors = { lime: '#a3e635', text: '#f5f5f0', muted: '#a1a1aa', card: '#121210' };

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', { fullName, email, phone, password });
      localStorage.setItem('eb_token', res.data.data.token);
      localStorage.setItem('eb_user', JSON.stringify(res.data.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: colors.text, paddingTop: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: colors.card, padding: '40px', borderRadius: '24px', border: `1px solid rgba(163,230,53,0.2)` }}>
        <h2 style={{ textAlign: 'center', marginBottom: '32px' }}>Create Your Account</h2>

        {error && <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '20px' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required style={{ width: '100%', padding: '16px', marginBottom: '16px', background: '#1C1C19', border: '1px solid rgba(163,230,53,0.3)', borderRadius: '12px', color: colors.text }} />
          <input type="email" placeholder="Business Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '16px', marginBottom: '16px', background: '#1C1C19', border: '1px solid rgba(163,230,53,0.3)', borderRadius: '12px', color: colors.text }} />
          <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required style={{ width: '100%', padding: '16px', marginBottom: '16px', background: '#1C1C19', border: '1px solid rgba(163,230,53,0.3)', borderRadius: '12px', color: colors.text }} />
          <input type="password" placeholder="Create Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '16px', marginBottom: '32px', background: '#1C1C19', border: '1px solid rgba(163,230,53,0.3)', borderRadius: '12px', color: colors.text }} />

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '999px', fontWeight: '700' }}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: colors.muted }}>
          Already have an account? <Link to="/login" style={{ color: colors.lime }}>Sign In</Link>
        </p>

        <button onClick={() => window.history.back()} style={{ marginTop: '32px', color: colors.muted, background: 'none', border: 'none', cursor: 'pointer' }}>← Back to Home</button>
      </div>
    </div>
  );
}