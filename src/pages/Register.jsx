// src/pages/Register.jsx
//
// ── Why this used to dead-end ───────────────────────────────────────────
//
// Registering ALWAYS showed "pending approval — an admin reviews your
// account", regardless of what the server said. The API stopped working that
// way on 2026-08-22: a business signing itself up now gets a tenant, the
// admin role, and a session cookie, and the response says `pending: false`.
//
// This screen ignored that field, so every self-served signup landed on a
// screen telling them to wait for a human who was never coming — and because
// the wizard is the ONLY place Embedded Signup lives, nobody ever reached it.
// The whole automatic go-live chain sat behind a screen nobody could pass.
//
// The pending screen is still correct for INVITED users joining an existing
// tenant: that approval gate exists to stop a stranger reaching another
// business's data, and it still does.
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import { loadProducts } from '../config/plans';

const t = {
  bg: '#080A06', card: '#0E110B', lime: '#B8F040',
  earth: '#C4873A', moss: '#4A6741', text: '#EEF0E8',
  muted: '#8A9080', border: 'rgba(184,240,64,0.12)', red: '#f87171',
};

export default function Register() {
  const [searchParams]  = useSearchParams();
  const inviteToken     = searchParams.get('invite');
  const selectedPlan    = searchParams.get('plan') || null;

  // The plan badge, from the API. This was a hardcoded table saying
  // "Starter R950 / Growth R2,450" — the SIXTH copy of the prices in this
  // system, and one of the wrongest: R950 is nearly 10x what Venbus pays and
  // R2,450 is a figure no tenant has ever been charged. Somebody arriving
  // from a pricing link was greeted with a price we do not sell.
  const [products, setProducts] = useState([]);
  useEffect(() => { loadProducts().then(setProducts).catch(() => {}); }, []);
  const planBadge = products.find((p) => p.key === selectedPlan) || null;

  const [fullName,     setFullName]     = useState('');
  const [businessName, setBusinessName] = useState('');
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
        // Omitted entirely for invites — sending one alongside an invite
        // token would be ambiguous about which tenant they are joining.
        businessName: inviteToken ? undefined : businessName,
        inviteToken: inviteToken || undefined,
        plan: selectedPlan || undefined,
      });
      const data = res.data.data || res.data;
      setTenantName(data?.tenantName || tenantName);

      // A self-served business is already signed in — the server set the
      // session cookie and returned pending: false. Send them straight into
      // the wizard, which is where Embedded Signup and checkout live.
      //
      // Making somebody log in again immediately after registering is the
      // step a self-service funnel loses people at, and showing them a
      // "pending approval" screen loses all of them.
      if (data?.pending === false) {
        // Token is in an httpOnly cookie; only the user object is stored —
        // the same arrangement Login.jsx uses.
        localStorage.setItem('eb_user', JSON.stringify(data.user));
        window.location.href = '/onboarding';
        return;
      }

      // Invited users still wait for approval. That gate protects an
      // EXISTING tenant's data and is not what this change removes.
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
              {/* Was "How approval works — admin reviews your account, get
                  access within 24 hours". Nothing about that is true any
                  more, and promising a 24-hour wait to somebody who is
                  actually about to go live in minutes is the wrong story. */}
              <p style={{ color: t.muted, fontSize: '13px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>What happens next</p>
              {['Create your account', 'Connect your WhatsApp number', 'Choose your bot and go live'].map((step, i) => (
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
          {inviteToken && tenantName ? `Join ${tenantName}` : 'Create your account'}
        </h1>
        <p style={{ color: t.muted, fontSize: '14px', marginBottom: selectedPlan ? '16px' : '28px' }}>
          {/* "Request access — approval required" was true until 2026-08-22
              and is now only true for invited users. A business signing
              itself up goes straight through. */}
          {inviteToken && inviteValid
            ? `You've been invited to ${tenantName}`
            : "Set up your WhatsApp assistant — you'll be connecting your number next"}
        </p>

        {/* Plan badge — label and price from the API, never from this file */}
        {planBadge && (
          <div style={{ background: `${t.lime}12`, border: `1px solid ${t.lime}33`, borderRadius: '10px', padding: '10px 14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: t.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Selected plan</p>
              <p style={{ color: t.lime, fontWeight: '700', fontSize: '15px' }}>{planBadge.label}</p>
            </div>
            <p style={{ color: t.lime, fontWeight: '700', fontSize: '16px' }}>R{planBadge.price}/mo</p>
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
            {/* Business name is what makes this a SELF-SERVICE signup. The
                API branches on it: with a name it creates the tenant, signs
                them in and returns pending:false; without one it falls
                through to the invited-user path and returns "pending
                approval". This field did not exist, so every website signup
                took the pending branch and waited for a human who was never
                coming — and the wizard, which is the only place Embedded
                Signup lives, was unreachable. Not shown for invites: those
                join a tenant that already has a name. */}
            {!inviteToken && (
              <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Business name" required style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(184,240,64,0.4)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
            )}
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