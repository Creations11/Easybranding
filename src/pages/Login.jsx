import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const colors = { lime: '#a3e635', text: '#f5f5f0', muted: '#a1a1aa', card: '#121210' };

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('eb_token', res.data.data.token);
      localStorage.setItem('eb_user', JSON.stringify(res.data.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: colors.text, paddingTop: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: colors.card, padding: '40px', borderRadius: '24px', border: `1px solid rgba(163,230,53,0.2)` }}>
        <h2 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '32px' }}>Welcome Back</h2>

        {error && <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '20px' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Business Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '16px', marginBottom: '16px', background: '#1C1C19', border: '1px solid rgba(163,230,53,0.3)', borderRadius: '12px', color: colors.text }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '16px', marginBottom: '24px', background: '#1C1C19', border: '1px solid rgba(163,230,53,0.3)', borderRadius: '12px', color: colors.text }} />

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '999px', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer' }}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: colors.muted }}>
          Don't have an account? <Link to="/register" style={{ color: colors.lime }}>Create one</Link>
        </p>

        <button onClick={() => window.history.back()} style={{ marginTop: '32px', color: colors.muted, background: 'none', border: 'none', cursor: 'pointer' }}>← Back to Home</button>
      </div>
    </div>
  );
}