import { useState } from 'react';
import api from '../../api';
import Button from '../ui/Button';
import { Input } from '../ui/Field';

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

  // Typed on a phone, so each field is full width and 44px tall.
  const field = 'mb-3 bg-[#1C1C19]';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[380px] rounded-[14px] border border-edge bg-card p-[22px]"
      >
        <h3 className="mb-3.5 text-[17px] text-lime">Change password</h3>

        {done ? (
          <>
            <p className="mb-[18px] text-sm text-ink">
              ✅ Password updated. Use the new one next time you sign in.
            </p>
            <Button variant="primary" className="w-full" onClick={onClose}>Done</Button>
          </>
        ) : (
          <>
            {/* autoCapitalize/autoCorrect off: a mobile keyboard "helpfully"
                capitalising the first character is a wrong password. */}
            <Input mono={false} type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
              placeholder="Current password" className={field} autoComplete="current-password"
              autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            <Input mono={false} type="password" value={next} onChange={(e) => setNext(e.target.value)}
              placeholder="New password (6+ characters)" className={field} autoComplete="new-password"
              autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            <Input mono={false} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password" className={field} autoComplete="new-password"
              autoCapitalize="none" autoCorrect="off" spellCheck={false} />

            {error && <p className="mb-3 text-[13px] text-red">{error}</p>}

            <div className="flex gap-2">
              <Button variant="primary" className="flex-1" onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Change password'}</Button>
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
