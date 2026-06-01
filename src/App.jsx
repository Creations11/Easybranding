import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

const colors = {
  bg: '#050505',
  card: '#121210',
  lime: '#a3e635',
  emerald: '#34d399',
  text: '#f5f5f0',
  muted: '#a1a1aa',
  border: 'rgba(163,230,53,0.22)',
};

function ProtectedRoute({ children }) {
  return localStorage.getItem('eb_token') ? children : <Navigate to="/login" replace />;
}

// NAV + FLOATING BUTTON
function Nav() {
  const navigate = useNavigate();
  const token = localStorage.getItem('eb_token');
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, background: 'rgba(5,5,5,0.95)', padding: '18px 40px', zIndex: 100 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: colors.lime }}>Easy Branding AI</div>
        </div>
      </nav>

      <button
        onClick={() => token ? setChatOpen(true) : navigate('/login')}
        style={{
          position: 'fixed', bottom: '32px', right: '32px', width: '68px', height: '68px',
          borderRadius: '50%', background: `linear-gradient(135deg, ${colors.lime}, ${colors.emerald})`,
          border: 'none', fontSize: '32px', boxShadow: `0 12px 40px ${colors.lime}50`, zIndex: 150, cursor: 'pointer'
        }}
      >
        {token ? '🌿' : '🚀'}
      </button>

      <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}

// CHAT MODAL
function ChatModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: "🌿 Hi! I'm Lendly. Type a message and I'll send it via WhatsApp." }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendRealMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      await api.post('/leads/send', { phone: '+27846549578', message: userMsg });
      setMessages(prev => [...prev, { role: 'assistant', content: "✅ Message sent via WhatsApp!" }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "❌ Failed to send. Is backend running?" }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '90%', maxWidth: '620px', background: '#0A0A08', borderRadius: '24px', border: `1px solid ${colors.border}` }}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <h3>🌿 Lendly • Live WhatsApp</h3>
          <button onClick={onClose} style={{ fontSize: '28px', background: 'none', border: 'none' }}>×</button>
        </div>
        <div style={{ height: '420px', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <div style={{ padding: '14px 20px', borderRadius: '20px', background: m.role === 'user' ? colors.lime : '#1C1C19', color: m.role === 'user' ? '#050505' : colors.text }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div>Sending via WhatsApp...</div>}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: '20px', borderTop: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && sendRealMessage()} 
              placeholder="Type message to send via WhatsApp..." 
              style={{ flex: 1, padding: '16px', borderRadius: '999px', background: '#1C1C19', border: `1px solid ${colors.border}`, color: colors.text }} 
            />
            <button onClick={sendRealMessage} disabled={loading} style={{ padding: '0 32px', background: colors.lime, color: '#050505', borderRadius: '999px', fontWeight: '700' }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// LOGIN
function Login() {
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
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: colors.card, padding: '60px 40px', borderRadius: '24px', width: '100%', maxWidth: '420px', border: `1px solid ${colors.border}` }}>
        <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>Sign In</h2>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '16px', marginBottom: '16px', borderRadius: '16px', background: '#1C1C19', border: `1px solid ${colors.border}`, color: colors.text }} required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: '16px', marginBottom: '32px', borderRadius: '16px', background: '#1C1C19', border: `1px solid ${colors.border}`, color: colors.text }} required />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '999px', fontWeight: '700' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px' }}>Don't have an account? <Link to="/register" style={{ color: colors.lime }}>Register</Link></p>
      </div>
    </div>
  );
}

// REGISTER
function Register() {
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
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: colors.card, padding: '60px 40px', borderRadius: '24px', width: '100%', maxWidth: '420px', border: `1px solid ${colors.border}` }}>
        <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>Create Account</h2>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" style={{ width: '100%', padding: '16px', marginBottom: '16px', borderRadius: '16px', background: '#1C1C19', border: `1px solid ${colors.border}`, color: colors.text }} required />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '16px', marginBottom: '16px', borderRadius: '16px', background: '#1C1C19', border: `1px solid ${colors.border}`, color: colors.text }} required />
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" style={{ width: '100%', padding: '16px', marginBottom: '16px', borderRadius: '16px', background: '#1C1C19', border: `1px solid ${colors.border}`, color: colors.text }} required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: '16px', marginBottom: '32px', borderRadius: '16px', background: '#1C1C19', border: `1px solid ${colors.border}`, color: colors.text }} required />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '999px', fontWeight: '700' }}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px' }}>Already have an account? <Link to="/login" style={{ color: colors.lime }}>Sign In</Link></p>
      </div>
    </div>
  );
}

// HOMEPAGE
function Home() {
  return (
    <div style={{ paddingTop: '100px', background: colors.bg, color: colors.text, minHeight: '100vh', textAlign: 'center' }}>
      <h1 style={{ fontSize: 'clamp(52px, 8vw, 92px)', fontWeight: '900', marginBottom: '24px' }}>
        WhatsApp Automation That Grows African Businesses
      </h1>
      <p style={{ fontSize: '24px', color: colors.muted, maxWidth: '800px', margin: '0 auto 60px' }}>
        Capture leads, automate replies, and close sales on WhatsApp.
      </p>
      <button onClick={() => window.location.href = '/register'} style={{ padding: '18px 52px', fontSize: '20px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '999px', fontWeight: '700' }}>
        Start 14-Day Free Trial
      </button>
    </div>
  );
}

// DASHBOARD
function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leads')
      .then(res => setLeads(res.data.data?.leads || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '120px 40px', background: colors.bg, color: colors.text, minHeight: '100vh' }}>
      <h1 style={{ fontSize: '52px', fontWeight: '900' }}>WhatsApp Operations Center</h1>
      <p style={{ color: colors.muted, fontSize: '20px' }}>Live Leads • Conversations</p>
      {loading ? <p>Loading leads...</p> : leads.length > 0 ? (
        leads.map(lead => (
          <div key={lead._id} style={{ background: colors.card, padding: '24px', borderRadius: '20px', marginBottom: '16px' }}>
            <strong>{lead.phone}</strong> — {lead.workflowStatus || 'New'}
          </div>
        ))
      ) : <p>No leads yet. Send a message to your WhatsApp number.</p>}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}