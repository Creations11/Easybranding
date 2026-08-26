// src/pages/Continue.jsx
//
// The page a one-time link lands on. `/continue?t=<token>`
//
// ── Why this exists ─────────────────────────────────────────────────────
//
// Meta's Embedded Signup only runs in a browser, so connecting a WhatsApp
// number cannot happen in chat. Until now the only place it rendered was
// inside /onboarding, which needs a login — so anyone without an account
// could not reach it at all. NovaCare has been asking to move to their own
// WABA for days and there was literally no URL to send them.
//
// This is that URL. The token signs them in (single use, 30 minutes — see
// signupHandoffService) and drops them straight on the connect step with
// nothing to type.
//
// ── It says why it failed ───────────────────────────────────────────────
//
// Every failure here is a person holding a link that did not work, usually
// on a phone, usually having already been told it would. So each case gets
// its own sentence and a way forward, rather than one "invalid token".
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import ConnectWhatsApp from '../components/ConnectWhatsApp';

const c = {
  bg: '#06080A', card: '#121710', lime: '#B8F040',
  text: '#EEF0E8', muted: '#8A9080', amber: '#fbbf24',
  border: 'rgba(184,240,64,0.12)',
};

export default function Continue() {
  const [params] = useSearchParams();
  const token = params.get('t');

  const [state, setState] = useState('checking'); // checking | ready | failed
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(null);

  useEffect(() => {
    if (!token) {
      setState('failed');
      setError('That link is missing its code. Ask us to send a fresh one.');
      return;
    }

    let cancelled = false;
    api.post('/auth/handoff', { token })
      .then((r) => {
        if (cancelled) return;
        const data = r.data?.data || r.data;
        // Token is in an httpOnly cookie now; store the user like Login does
        // so a refresh does not bounce them back out.
        if (data?.user) localStorage.setItem('eb_user', JSON.stringify(data.user));
        setUser(data?.user || null);
        setState('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setState('failed');
        // The server deliberately gives one message for expired, used and
        // unknown — saying which would tell an attacker their guess was once
        // real. Show it as-is rather than inventing a more specific reason.
        setError(err.response?.data?.message ||
          'That link has expired or has already been used.');
      });

    return () => { cancelled = true; };
  }, [token]);

  const wrap = (children) => (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ maxWidth: 460, width: '100%' }}>{children}</div>
    </div>
  );

  if (state === 'checking') {
    return wrap(<p style={{ color: c.muted, textAlign: 'center' }}>Checking your link…</p>);
  }

  if (state === 'failed') {
    return wrap(
      <div style={{ background: c.card, border: `1px solid ${c.border}`,
        borderRadius: 14, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <h1 style={{ fontSize: 20, marginBottom: 10 }}>This link no longer works</h1>
        <p style={{ color: c.amber, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{error}</p>
        <p style={{ color: c.muted, fontSize: 14, lineHeight: 1.6 }}>
          Links last 30 minutes and work once, so nobody else can use one that
          gets forwarded. Reply <strong style={{ color: c.text }}>SIGN UP</strong> on
          WhatsApp and we'll send a new one.
        </p>
      </div>
    );
  }

  if (connected) {
    return wrap(
      <div style={{ background: c.card, border: `1px solid ${c.border}`,
        borderRadius: 14, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <h1 style={{ fontSize: 20, marginBottom: 10 }}>Your number is connected</h1>
        <p style={{ color: c.muted, fontSize: 14, lineHeight: 1.7 }}>
          {connected.number} — {connected.verifiedName || 'verified with Meta'}.
        </p>
        <p style={{ color: c.muted, fontSize: 14, lineHeight: 1.7, marginTop: 12 }}>
          We're setting up your message templates now. Meta reviews those, which
          usually takes a few hours — we'll message you on WhatsApp the moment
          you're live. You can close this page.
        </p>
      </div>
    );
  }

  return wrap(
    <>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>
        {user?.fullName ? `Welcome back, ${user.fullName.split(' ')[0]}` : 'One last step'}
      </h1>
      <p style={{ color: c.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
        Connect your WhatsApp number. This runs inside Meta's own window — we
        never see your password.
      </p>
      <ConnectWhatsApp
        colors={c}
        onConnected={(d) => setConnected(d)}
      />
    </>
  );
}
