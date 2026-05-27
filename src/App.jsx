import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

// API Setup
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Premium Organic Intelligence Palette
const colors = {
  bg: '#050505',
  surface: '#0F0F0D',
  card: '#141412',
  biolight: '#22d3ee',
  livinggreen: '#4ade80',
  text: '#f5f5f0',
  muted: '#a1a1aa',
  border: 'rgba(34,211,238,0.25)',
};

// Protected Route
function ProtectedRoute({ children }) {
  return localStorage.getItem('eb_token') ? children : <Navigate to="/login" replace />;
}

// Typing Indicator
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '18px 24px', background: '#1C1C19', borderRadius: 999, width: 'fit-content' }}>
      {[0, 150, 300].map((d, i) => (
        <span key={i} style={{ width: 8, height: 8, background: colors.biolight, borderRadius: '50%', animation: 'bounce 1.2s infinite', animationDelay: `${d}ms` }} />
      ))}
    </div>
  );
}

// Beautiful Chat Modal
function ChatModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: "I am Lendly — where silicon meets soil.\n\nHow may I help your business today?" }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: "I understand your vision. I'm here to help you automate, grow, and operate with clarity." }]);
      setIsTyping(false);
    }, 1400);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(20px)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 560, background: '#111110', borderRadius: 32, overflow: 'hidden', boxShadow: '0 40px 160px rgba(0,0,0,0.95)', border: `1px solid ${colors.border}` }}>
        <div style={{ padding: '26px 34px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0A0A08' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: 20, background: `linear-gradient(135deg, ${colors.biolight}, ${colors.livinggreen})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, boxShadow: `0 0 50px ${colors.biolight}60` }}>🌿</div>
            <div>
              <div style={{ fontSize: 23, fontWeight: 700 }}>Lendly</div>
              <div style={{ fontSize: 13.5, color: colors.biolight, letterSpacing: '1.6px' }}>SILICON • SOIL • SYMBIOSIS</div>
            </div>
          </div>
          <button onClick={onClose} style={{ fontSize: 32, color: '#777' }}>✕</button>
        </div>

        <div style={{ height: 480, overflowY: 'auto', padding: 28, background: '#0A0A09', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '82%',
                padding: '17px 26px',
                borderRadius: msg.role === 'user' ? '26px 26px 8px 26px' : '26px 26px 26px 8px',
                background: msg.role === 'user' ? colors.biolight : '#1C1C19',
                color: msg.role === 'user' ? '#050505' : colors.text,
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && <TypingDots />}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: 24, background: '#111110', borderTop: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Speak your thoughts..."
              style={{ flex: 1, padding: '18px 26px', borderRadius: 999, background: '#1C1C19', border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' }}
            />
            <button onClick={sendMessage} disabled={!input.trim()} style={{ padding: '0 38px', background: colors.biolight, color: '#050505', borderRadius: 999, fontWeight: 700 }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Navigation
function Nav({ onChatOpen }) {
  const token = localStorage.getItem('eb_token');
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(5,5,5,0.96)', backdropFilter: 'blur(24px)', borderBottom: `1px solid ${colors.border}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: colors.text }}>
          <div style={{ width: 50, height: 50, borderRadius: 18, background: `linear-gradient(135deg, ${colors.biolight}, ${colors.livinggreen})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 28, color: '#050505' }}>EB</div>
          <span style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-1.5px' }}>Easy Branding AI</span>
        </Link>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {token ? (
            <>
              <Link to="/dashboard" style={{ color: '#ddd', textDecoration: 'none' }}>Dashboard</Link>
              <button onClick={logout} style={{ padding: '10px 24px', background: 'transparent', border: `1px solid #444`, borderRadius: 999, color: '#ddd' }}>Logout</button>
            </>
          ) : null}
          <button onClick={onChatOpen} style={{ padding: '12px 34px', background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: 999, color: colors.text }}>Talk to Lendly</button>
        </div>
      </div>
    </nav>
  );
}

// Home Page - Strong Business Writing
function Home({ onChatOpen }) {
  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, paddingTop: 90 }}>
      <section style={{ padding: '160px 24px 120px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(3.4rem, 8.5vw, 6.6rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-4px', marginBottom: 32 }}>
          AI Systems That Actually<br />
          Grow African Businesses
        </h1>
        <p style={{ fontSize: 23, maxWidth: 760, margin: '0 auto 48px', color: colors.muted, lineHeight: 1.65 }}>
          We help African SMEs automate WhatsApp communication, deliver excellent customer support, generate qualified leads, and gain real-time control over their operations — so you can focus on scaling profitably.
        </p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onChatOpen} style={{ padding: '20px 56px', background: colors.biolight, color: '#050505', borderRadius: 999, fontSize: 19, fontWeight: 700 }}>Talk to Lendly Now</button>
          <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })} style={{ padding: '20px 56px', border: `1px solid ${colors.border}`, borderRadius: 999, fontSize: 19 }}>See Pricing</button>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '100px 24px', background: colors.surface }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 44, fontWeight: 900, marginBottom: 24 }}>Simple Pricing</h2>
          <p style={{ color: colors.muted, marginBottom: 70, fontSize: 19 }}>Choose the plan that matches your ambition</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
            <div style={{ background: colors.card, padding: 48, borderRadius: 28, border: `1px solid ${colors.border}` }}>
              <h3 style={{ fontSize: 28 }}>Starter</h3>
              <div style={{ fontSize: 56, fontWeight: 900, margin: '20px 0' }}>R950 <span style={{ fontSize: 20 }}>/mo</span></div>
              <button onClick={onChatOpen} style={{ marginTop: 40, width: '100%', padding: 18, borderRadius: 999, background: 'transparent', border: `1px solid ${colors.border}` }}>Get Started</button>
            </div>

            <div style={{ background: `linear-gradient(145deg, ${colors.biolight}, ${colors.livinggreen})`, padding: 48, borderRadius: 28, transform: 'scale(1.06)', position: 'relative', color: '#050505' }}>
              <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', background: '#050505', color: colors.biolight, padding: '8px 24px', borderRadius: 999, fontSize: 14, fontWeight: 700 }}>MOST POPULAR</div>
              <h3 style={{ fontSize: 28 }}>Growth</h3>
              <div style={{ fontSize: 62, fontWeight: 900, margin: '20px 0' }}>R2,450 <span style={{ fontSize: 22 }}> /mo</span></div>
              <button onClick={onChatOpen} style={{ marginTop: 40, width: '100%', padding: 18, borderRadius: 999, background: '#050505', color: '#fff' }}>Start Growth Plan</button>
            </div>

            <div style={{ background: colors.card, padding: 48, borderRadius: 28, border: `1px solid ${colors.border}` }}>
              <h3 style={{ fontSize: 28 }}>Enterprise</h3>
              <div style={{ fontSize: 56, fontWeight: 900, margin: '20px 0' }}>Custom</div>
              <button onClick={onChatOpen} style={{ marginTop: 40, width: '100%', padding: 18, borderRadius: 999, background: 'transparent', border: `1px solid ${colors.border}` }}>Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* Single Floating Button */}
      <button 
        onClick={() => window.location.href = '/login'}
        style={{ 
          position: 'fixed', bottom: 38, right: 38, 
          width: 76, height: 76, borderRadius: '50%', 
          background: `linear-gradient(135deg, ${colors.biolight}, ${colors.livinggreen})`, 
          border: 'none', fontSize: 34, cursor: 'pointer', 
          boxShadow: `0 15px 60px ${colors.biolight}60`, zIndex: 100 
        }}
      >
        🌱
      </button>
    </div>
  );
}

// Full Login Component
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
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440, background: colors.card, padding: 52, borderRadius: 28, border: `1px solid ${colors.border}` }}>
        <h2 style={{ textAlign: 'center', fontSize: 34, marginBottom: 12 }}>Welcome Back</h2>
        <p style={{ textAlign: 'center', color: colors.muted, marginBottom: 40 }}>Sign in to access your operations center</p>
        
        {error && <p style={{ color: '#f87171', textAlign: 'center', marginBottom: 20 }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" style={{ width: '100%', padding: 18, marginBottom: 16, borderRadius: 16, background: '#1a1a1a', border: `1px solid ${colors.border}`, color: colors.text }} required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: 18, marginBottom: 32, borderRadius: 16, background: '#1a1a1a', border: `1px solid ${colors.border}`, color: colors.text }} required />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 18, background: colors.biolight, color: '#050505', borderRadius: 16, fontWeight: 700, fontSize: 17 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 32, color: colors.muted }}>
          Don't have an account? <Link to="/register" style={{ color: colors.biolight, fontWeight: 600 }}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}

// Full Register Component
function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { fullName: name, email, password });
      localStorage.setItem('eb_token', res.data.data.token);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440, background: colors.card, padding: 52, borderRadius: 28, border: `1px solid ${colors.border}` }}>
        <h2 style={{ textAlign: 'center', fontSize: 34, marginBottom: 12 }}>Start Your Growth Journey</h2>
        <p style={{ textAlign: 'center', color: colors.muted, marginBottom: 40 }}>Create your account and unlock AI automation</p>
        
        <form onSubmit={handleSubmit}>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" style={{ width: '100%', padding: 18, marginBottom: 16, borderRadius: 16, background: '#1a1a1a', border: `1px solid ${colors.border}`, color: colors.text }} required />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Business Email" style={{ width: '100%', padding: 18, marginBottom: 16, borderRadius: 16, background: '#1a1a1a', border: `1px solid ${colors.border}`, color: colors.text }} required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create Password" style={{ width: '100%', padding: 18, marginBottom: 32, borderRadius: 16, background: '#1a1a1a', border: `1px solid ${colors.border}`, color: colors.text }} required />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 18, background: colors.biolight, color: '#050505', borderRadius: 16, fontWeight: 700, fontSize: 17 }}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 32, color: colors.muted }}>
          Already have an account? <Link to="/login" style={{ color: colors.biolight, fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

// Dashboard
function Dashboard({ onChatOpen }) {
  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, padding: '100px 40px' }}>
      <h1 style={{ fontSize: 42, fontWeight: 900 }}>Welcome to Your Operations Center</h1>
      <p style={{ color: colors.muted, marginTop: 12, fontSize: 19 }}>Everything you need to run and grow your business is here.</p>
      <button onClick={onChatOpen} style={{ marginTop: 50, padding: '18px 52px', background: colors.biolight, color: '#050505', borderRadius: 999, fontWeight: 700, fontSize: 18 }}>
        Open Lendly Assistant
      </button>
    </div>
  );
}

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <Router>
      <Nav onChatOpen={() => setChatOpen(true)} />
      <Routes>
        <Route path="/" element={<Home onChatOpen={() => setChatOpen(true)} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard onChatOpen={() => setChatOpen(true)} /></ProtectedRoute>} />
      </Routes>
      <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </Router>
  );
}