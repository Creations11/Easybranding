import { useState } from 'react';
import api from '../../api';
import { colors } from '../../utils/theme';

// ── Account controls ──────────────────────────────────────────────────
//
// Added 2026-08-08. This page had NO sign-out and no way to change a password:
// ConditionalNav only renders <Nav/> on public routes, SuperAdminDashboard
// carries its own Sign Out button, and this page — the one every CLIENT lands
// on — had neither. The first client onboarded reported it as "it's just
// stuck", which is exactly what it was: signed in, no way out, no way to
// replace the temporary password he'd been sent over WhatsApp.
export default function ChangePasswordModal({ onClose }) {
  const [current, setCurrent] = useState('');
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  const submit = async () => {
    setError('');
    if (next !== confirm) return setError("The new passwords don't match.");
    if (next.length < 6) return setError('New password must be at least 6 characters.');
    setBusy(true);
    try {
      // Trimmed: these are typed on a phone and pasted out of WhatsApp, where a
      // trailing space is invisible and would otherwise read as a wrong password.
      await api.post('/auth/change-password', {
        currentPassword: current.trim(),
        newPassword: next.trim(),
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change the password.');
    } finally { setBusy(false); }
  };

  const field = {
    width: '100%', padding: '12px', borderRadius: '10px', background: '#1C1C19',
    border: '1px solid ' + colors.borderDim, color: colors.text, fontSize: '14px',
    marginBottom: '12px', outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.card, border: '1px solid ' + colors.borderDim,
          borderRadius: '14px', padding: '22px', width: '100%', maxWidth: '380px',
        }}
      >
        <h3 style={{ color: colors.lime, marginBottom: '14px', fontSize: '17px' }}>Change password</h3>

        {done ? (
          <>
            <p style={{ color: colors.text, fontSize: '14px', marginBottom: '18px' }}>
              ✅ Password updated. Use the new one next time you sign in.
            </p>
            <button onClick={onClose} style={{
              width: '100%', padding: '11px', background: colors.lime, color: '#050505',
              border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>Done</button>
          </>
        ) : (
          <>
            {/* autoCapitalize/autoCorrect off: a mobile keyboard "helpfully"
                capitalising the first character is a wrong password. */}
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
              placeholder="Current password" style={field} autoComplete="current-password"
              autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)}
              placeholder="New password (6+ characters)" style={field} autoComplete="new-password"
              autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password" style={field} autoComplete="new-password"
              autoCapitalize="none" autoCorrect="off" spellCheck={false} />

            {error && <p style={{ color: colors.red, fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={submit} disabled={busy} style={{
                flex: 1, padding: '11px', background: colors.lime, color: '#050505',
                border: 'none', borderRadius: '10px', fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1,
                fontFamily: 'inherit',
              }}>{busy ? 'Saving…' : 'Change password'}</button>
              <button onClick={onClose} style={{
                padding: '11px 18px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid ' + colors.borderDim, color: colors.muted,
                borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
              }}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
