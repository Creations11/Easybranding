// src/components/ConnectWhatsApp.jsx
//
// Embedded Signup, in the onboarding flow — ADR-008 Phase 6.
//
// Replaces the step where a business owner types their WhatsApp number into
// a text box and hopes it is right. Instead Meta's own dialog runs, the
// client authorises us, and the number comes back verified.
//
// ── The two routes, and why both exist ──────────────────────────────────
//
// Decided 2026-08-21. A client either:
//
//   CONNECTS THEIR OWN NUMBER — lands in the CLIENT's WhatsApp Business
//   Account. They get their own display name (not "X by EasyBranding"),
//   they can keep using the WhatsApp Business app on the same number
//   (coexistence), and they pay Meta directly for messages. They must also
//   pass Meta's Business Verification themselves.
//
//   OR TAKES A MANAGED NUMBER — lands in OUR WABA, the way every existing
//   tenant did. No verification, no card, live the same day, but approved
//   as "X by EasyBranding".
//
// Most South African SMEs cannot pass Business Verification quickly — it
// wants CIPC registration and proof of address — so managed is the DEFAULT
// and the honest recommendation, not a lesser tier. Self-connection is an
// upgrade for clients who both want it and qualify.
//
// ── The failure this must not produce ───────────────────────────────────
//
// ADR-008: connecting a client in four minutes and then having no way to
// message them is worse than the manual process, because they already
// believe they are live. So this reports a real number and verified name
// from Meta, or it reports a failure — never a hopeful "done".
import { useEffect, useRef, useState } from 'react';
import api from '../api';

export default function ConnectWhatsApp({ businessName, contactEmail, onConnected, colors }) {
  const c = colors || {
    lime: '#B8F040', text: '#EEF0E8', muted: '#8A9080',
    card: '#121710', border: 'rgba(184,240,64,0.12)',
    emerald: '#34d399', amber: '#fbbf24',
  };

  const [cfg, setCfg] = useState(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const loaded = useRef(false);

  // App id and config id come from the SERVER, never hardcoded here. A
  // second copy is a copy that drifts, and the failure would be a signup
  // dialog opening against a stale configuration and half-working.
  useEffect(() => {
    let cancelled = false;
    api.get('/embedded-signup/config')
      .then((r) => {
        const data = r.data?.data || r.data;
        if (cancelled || !data?.appId) return;
        setCfg(data);

        if (loaded.current) return;
        loaded.current = true;
        const s = document.createElement('script');
        s.src = 'https://connect.facebook.net/en_US/sdk.js';
        s.async = true;
        s.onload = () => {
          window.FB.init({
            appId: data.appId,
            cookie: true,
            xfbml: false,
            version: data.graphVersion || 'v21.0',
          });
          if (!cancelled) setSdkReady(true);
        };
        s.onerror = () => !cancelled && setError("Could not load Meta's sign-up library. Check your connection.");
        document.head.appendChild(s);
      })
      .catch(() => !cancelled && setError('Could not reach the sign-up service. Try again shortly.'));
    return () => { cancelled = true; };
  }, []);

  const connect = () => {
    if (!window.FB || !cfg) return;
    setError(null);
    setBusy(true);

    window.FB.login((response) => {
      const code = response?.authResponse?.code;
      if (!code) {
        setBusy(false);
        setError('Sign-up was cancelled or did not finish. Nothing has changed — you can try again.');
        return;
      }

      api.post('/embedded-signup/complete', { code, businessName, contactEmail })
        .then((r) => {
          const d = r.data?.data || r.data;
          setResult(d);
          setBusy(false);
          // Hand the VERIFIED number back to the form, in the shape the
          // rest of onboarding already uses.
          onConnected?.({
            whatsappNumber: `whatsapp:${d.number}`,
            phoneNumberId: d.phoneNumberId,
            wabaId: d.wabaId,
            verifiedName: d.verifiedName,
            tenantId: d.tenantId,
          });
        })
        .catch((err) => {
          setBusy(false);
          // Meta may well have completed its half. Say so, rather than
          // inviting a retry that could double-connect.
          setError(
            err.response?.data?.message ||
            'Could not finish connecting. Your account with Meta may have been created — please contact us before trying again.'
          );
        });
    }, {
      config_id: cfg.configId,
      response_type: 'code',
      override_default_response_type: true,
      // EMPTY on purpose — this is what selects Embedded Signup v4. Every
      // other version expires October 2026, and adding keys here silently
      // opts back into one of them.
      extras: {},
    });
  };

  if (result) {
    return (
      <div style={{ background: c.card, border: `1px solid ${c.emerald}44`, borderRadius: 12, padding: '1.1rem' }}>
        <div style={{ color: c.emerald, fontWeight: 600, marginBottom: '.4rem' }}>✓ WhatsApp connected</div>
        <div style={{ color: c.text, fontSize: '1.05rem' }}>{result.number}</div>
        {result.verifiedName && (
          <div style={{ color: c.muted, fontSize: '.86rem', marginTop: '.2rem' }}>
            Display name: {result.verifiedName}
          </div>
        )}
        <div style={{ color: c.muted, fontSize: '.82rem', marginTop: '.7rem', lineHeight: 1.5 }}>
          Your number is on your own WhatsApp Business Account. We'll set up your
          message templates before anything goes out to customers.
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={connect}
        disabled={!sdkReady || busy}
        style={{
          width: '100%', padding: '.85rem 1rem', borderRadius: 10, border: 'none',
          background: sdkReady && !busy ? c.lime : '#2a2f26',
          color: sdkReady && !busy ? '#06080A' : c.muted,
          fontWeight: 700, fontSize: '.98rem',
          cursor: sdkReady && !busy ? 'pointer' : 'not-allowed',
        }}
      >
        {busy ? 'Waiting for Meta…' : sdkReady ? 'Connect my WhatsApp number' : 'Loading…'}
      </button>

      {error && (
        <div style={{ marginTop: '.7rem', color: c.amber, fontSize: '.86rem', lineHeight: 1.5 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: '.8rem', color: c.muted, fontSize: '.82rem', lineHeight: 1.55 }}>
        You'll authorise this inside Meta's own window — we never see your password.
        If the number is already on the WhatsApp Business app, you'll scan a QR code
        and can keep using the app afterwards.
        <br /><br />
        <strong style={{ color: c.text }}>You'll need:</strong> a number not on personal
        WhatsApp, and your business registration details — Meta verifies these itself,
        which can take a few days.
      </div>
    </div>
  );
}
