// src/pages/Register.jsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';

const t = {
  bg: '#080A06', card: '#0E110B', lime: '#B8F040',
  earth: '#C4873A', moss: '#4A6741', text: '#EEF0E8',
  muted: '#8A9080', border: 'rgba(184,240,64,0.12)', red: '#f87171',
};

export default function Register() {
  const [searchParams]  = useSearchParams();
  const inviteToken     = searchParams.get('invite');
  const selectedPlan    = searchParams.get('plan') || null;

  const PLAN_LABELS = {
    starter:    { label: 'Starter', price: 'R950/mo',   color: '#7A9E6E' },
    growth:     { label: 'Growth',  price: 'R2,450/mo', color: '#B8F040' },
    enterprise: { label: 'Enterprise', price: 'Custom', color: '#C4873A' },
  };

  const [fullName,     setFullName]     = useState('');
  const [email,        setEmail]        = useState('');
  const [phone,        setPhone]        = useState('');
  const [password,     setPassword]     = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [pending,      setPending]      = useState(false);
  const [tenantName,   setTenantName]   = useState(null);
  const [inviteValid,  setInviteValid]  = useState(null); // null=checking, true=valid, false=invalid
  const [inviteChecking, setInviteChecking] = useState(false);

  // Validate invite token on load
  useEffect(() => {
    if (!inviteToken) { setInviteValid(null); return; }
    setInviteChecking(true);
    fetch(`${import.meta.env.VITE_API_URL}/invites/validate/${inviteToken}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setTenantName(data.data?.businessName || data.data?.brandName);
          setInviteValid(true);
        } else {
          setInviteValid(false);
          setError('This invite link is invalid or has expired. Please request a new one.');
        }
      })
      .catch(() => { setInviteValid(false); setError('Could not validate invite link.'); })
      .finally(() => setInviteChecking(false));
  }, [inviteToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/register', {
        fullName, email, phone, password,
        inviteToken: inviteToken || undefined,
        plan: selectedPlan || undefined,
      });
      setTenantName(res.data.data?.tenantName || tenantName);
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

  // ── Pending screen ────────────────────────────────────────
  if (pending) {
    return (
      <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Outfit', sans-serif" }}>
        
      <style>{`
        @media (max-width: 768px) {
          .register-left-panel { display: none !important; }
          .register-right-panel { width: 100% !important; padding: 80px 24px 40px !important; }
        }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Fraunces:ital,wght@0,700;0,900;1,900&display=swap" rel="stylesheet" />
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🌱</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '32px', fontWeight: '900', marginBottom: '14px', color: t.lime }}>
            Application received.
          </h2>
          <p style={{ color: t.muted, fontSize: '16px', lineHeight: '1.7', marginBottom: '24px' }}>
            Your account is <strong style={{ color: t.text }}>pending approval</strong>.
            {tenantName && <span> You'll be added to <strong style={{ color: t.lime }}>{tenantName}</strong> once approved.</span>}
          </p>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '20px', marginBottom: '32px' }}>
            <p style={{ color: t.muted, fontSize: '13px', marginBottom: '6px' }}>Registered as</p>
            <p style={{ color: t.text, fontWeight: '600', fontSize: '16px' }}>{fullName}</p>
            <p style={{ color: t.muted, fontSize: '14px', marginTop: '4px' }}>{email}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {[
              { step: '1', label: 'Registration submitted', done: true },
              { step: '2', label: 'Admin reviews your account', done: false },
              { step: '3', label: 'Access granted — log in', done: false },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: item.done ? 'rgba(184,240,64,0.06)' : 'rgba(255,255,255,0.02)', borderRadius: '10px', border: `1px solid ${item.done ? t.border : 'rgba(255,255,255,0.05)'}` }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: item.done ? t.lime : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: item.done ? '#080A06' : t.muted, fontWeight: '700', flexShrink: 0 }}>
                  {item.done ? '✓' : item.step}
                </div>
                <span style={{ color: item.done ? t.text : t.muted, fontSize: '14px' }}>{item.label}</span>
              </div>
            ))}
          </div>
          <Link to="/login" style={{ color: t.lime, fontSize: '14px', textDecoration: 'none' }}>← Back to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', fontFamily: "'Outfit', sans-serif" }}>
      
      <style>{`
        @media (max-width: 768px) {
          .register-left-panel { display: none !important; }
          .register-right-panel { width: 100% !important; padding: 80px 24px 40px !important; }
        }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&display=swap" rel="stylesheet" />

      {/* Left panel */}
      <div className="register-left-panel" style={{ flex: 1, background: t.card, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px', borderRight: `1px solid ${t.border}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '15%', right: '5%', width: '280px', height: '280px', background: 'radial-gradient(ellipse, rgba(196,135,58,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '360px' }}>

          {/* Show tenant branding if invite is valid */}
          {inviteToken && inviteValid && tenantName ? (
            <>
              <div style={{ fontSize: '56px', marginBottom: '20px' }}>🏘️</div>
              <div style={{ background: 'rgba(184,240,64,0.08)', border: `1px solid ${t.border}`, borderRadius: '14px', padding: '16px 20px', marginBottom: '24px' }}>
                <p style={{ color: t.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>You've been invited to join</p>
                <p style={{ color: t.lime, fontSize: '20px', fontWeight: '700' }}>{tenantName}</p>
              </div>
              <p style={{ color: t.muted, fontSize: '15px', lineHeight: '1.7' }}>
                Create your account to join the {tenantName} team on Easy Branding AI.
              </p>
            </>
          ) : inviteToken && inviteValid === false ? (
            <>
              <div style={{ fontSize: '56px', marginBottom: '20px' }}>⚠️</div>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: '900', color: t.red, marginBottom: '12px' }}>Invalid Invite</h2>
              <p style={{ color: t.muted, fontSize: '15px', lineHeight: '1.7' }}>This invite link has expired or is invalid. Contact your agency admin for a new link.</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '56px', marginBottom: '24px' }}>🏘️</div>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '34px', fontWeight: '900', lineHeight: '1.1', marginBottom: '16px', color: t.text }}>
                Your leads, <span style={{ fontStyle: 'italic', color: t.earth }}>automated.</span>
              </h2>
              <p style={{ color: t.muted, fontSize: '15px', lineHeight: '1.7', marginBottom: '28px' }}>
                Join rental agencies across South Africa using Easy Branding AI.
              </p>
            </>
          )}

          {!inviteToken && (
            <div style={{ background: 'rgba(184,240,64,0.05)', border: `1px solid ${t.border}`, borderRadius: '14px', padding: '20px', marginTop: '20px' }}>
              <p style={{ color: t.muted, fontSize: '13px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>How approval works</p>
              {['Submit your details', 'Admin reviews your account', 'Get access within 24 hours'].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: i < 2 ? '10px' : 0 }}>
                  <div style={{ width: '22px', height: '22px', background: t.lime, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: t.bg, fontWeight: '800', flexShrink: 0 }}>{i + 1}</div>
                  <span style={{ color: t.muted, fontSize: '14px' }}>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="register-right-panel" style={{ width: '480px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '40px' }}>
          <span style={{ fontSize: '18px' }}>🌿</span>
          <span style={{ fontSize: '16px', fontWeight: '700', color: t.text }}>Easy Branding <span style={{ color: t.lime }}>AI</span></span>
        </Link>

        <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '6px', letterSpacing: '-0.01em' }}>
          {inviteToken && tenantName ? `Join ${tenantName}` : 'Request access'}
        </h1>
        <p style={{ color: t.muted, fontSize: '14px', marginBottom: selectedPlan ? '16px' : '28px' }}>
          {inviteToken && inviteValid ? `You've been invited to ${tenantName}` : 'Create your account — approval required'}
        </p>

        {/* Plan badge */}
        {selectedPlan && PLAN_LABELS[selectedPlan] && (
          <div style={{ background: `${PLAN_LABELS[selectedPlan].color}12`, border: `1px solid ${PLAN_LABELS[selectedPlan].color}33`, borderRadius: '10px', padding: '10px 14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: t.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Selected plan</p>
              <p style={{ color: PLAN_LABELS[selectedPlan].color, fontWeight: '700', fontSize: '15px' }}>{PLAN_LABELS[selectedPlan].label}</p>
            </div>
            <p style={{ color: PLAN_LABELS[selectedPlan].color, fontWeight: '700', fontSize: '16px' }}>{PLAN_LABELS[selectedPlan].price}</p>
          </div>
        )}

        {inviteChecking && <p style={{ color: t.muted, fontSize: '13px', marginBottom: '16px' }}>Validating invite link...</p>}

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: t.red, fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Block form if invite is invalid */}
        {inviteToken && inviteValid === false ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ color: t.muted, fontSize: '14px', marginBottom: '16px' }}>Contact your agency admin for a valid invite link.</p>
            <Link to="/" style={{ color: t.lime, textDecoration: 'none' }}>← Back to home</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

            {inviteToken && inviteValid && (
              <div style={{ background: 'rgba(184,240,64,0.06)', border: `1px solid ${t.border}`, borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: t.muted }}>
                🔗 Invite verified — you'll be linked to <strong style={{ color: t.lime }}>{tenantName}</strong>
              </div>
            )}

            <button type="submit" disabled={loading || (inviteToken && inviteValid === false)} style={{
              width: '100%', padding: '15px',
              background: loading ? 'rgba(184,240,64,0.5)' : t.lime,
              color: '#080A06', border: 'none', borderRadius: '12px',
              fontWeight: '700', fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px', fontFamily: "'Outfit', sans-serif",
            }}>
              {loading ? 'Submitting...' : inviteToken && tenantName ? `Join ${tenantName} →` : 'Request Access →'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '24px', color: t.muted, fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: t.lime, textDecoration: 'none', fontWeight: '600' }}>Sign In</Link>
        </p>
        <Link to="/" style={{ display: 'block', textAlign: 'center', marginTop: '12px', color: t.muted, fontSize: '13px', textDecoration: 'none' }}>← Back to home</Link>
      </div>
    </div>
  );
}