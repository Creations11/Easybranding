import { useState } from 'react';
import { colors as c } from '../../utils/theme';
import { useRentalsActions } from '../../hooks/useRentalsModeration';
import { useAct } from './useAct';
import { when, btn, card, askReason, changes } from './helpers';
import { Result, TemporaryPassword } from './ui';
import AccountForm from './AccountForm';

export default function AccountRow({ account }) {
  const { suspend, reinstate, updateAccount, resetPassword, deleteAccount } = useRentalsActions();
  const { busy, result, act } = useAct();
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState(null);
  const onSave = (form) => {
    const fields = changes(account, form);
    if (!Object.keys(fields).length) { setEditing(false); return; }
    act(async () => { await updateAccount(account.id, fields); setEditing(false); }, `${form.fullName.trim()} is updated.`);
  };
  const onReset = () => {
    if (!window.confirm(`Make a new password for ${account.fullName}? Their current one stops working at once.`)) return;
    act(async () => setPassword((await resetPassword(account.id)).temporaryPassword), 'New password made.');
  };
  const onDelete = () => {
    const listings = account.listings ? ` Their ${account.listings === 1 ? 'listing is' : `${account.listings} listings are`} archived and everyone waiting on them is told.` : '';
    if (!window.confirm(`Delete ${account.fullName}'s account? They cannot sign in again with it.${listings} Their own open applications are withdrawn.`)) return;
    act(() => deleteAccount(account.id), `${account.fullName}'s account is deleted.`);
  };
  const onSuspend = () => {
    const reason = askReason(`Why are you suspending ${account.fullName}? They are signed out at once and all their listings leave the site.`);
    if (reason) act(() => suspend(account.id, reason), `${account.fullName} is suspended.`);
  };
  const onReinstate = () => {
    if (!window.confirm(`Reinstate ${account.fullName}?`)) return;
    act(() => reinstate(account.id), `${account.fullName} is reinstated.`);
  };
  return (
    <div data-testid={`account-${account.id}`} style={card}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <span style={{ fontWeight: 700, color: c.text }}>{account.fullName}</span>
          <span style={{ marginLeft: 8, fontSize: 12, color: c.muted }}>{account.roles.join(' and ')}</span>
          {!account.isActive && <span style={{ marginLeft: 8, fontSize: 11, color: c.red }}>suspended{account.suspendedReason ? `: ${account.suspendedReason}` : ''}</span>}
        </div>
        <span style={{ fontSize: 12, color: c.muted }}>{account.listings === 1 ? '1 listing' : `${account.listings} listings`}</span>
      </div>
      <div style={{ fontSize: 12, color: c.muted, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <span>{account.email}</span>
        <span>{account.phone}</span>
        <span>joined {when(account.createdAt)}</span>
        <span>{account.lastLoginAt ? `last signed in ${when(account.lastLoginAt)}` : 'never signed in again'}</span>
      </div>
      {editing
        ? <AccountForm initial={account} submitLabel="Save" onSubmit={onSave} onCancel={() => setEditing(false)} busy={busy} />
        : (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button onClick={() => setEditing(true)} disabled={busy} style={btn(c.cyan, busy)}>Edit</button>
            <button onClick={onReset} disabled={busy} style={btn(c.amber, busy)}>Reset password</button>
            {account.isActive
              ? <button onClick={onSuspend} disabled={busy} style={btn(c.red, busy)}>Suspend</button>
              : <button onClick={onReinstate} disabled={busy} style={btn(c.emerald, busy)}>Reinstate</button>}
            <button onClick={onDelete} disabled={busy} style={btn(c.red, busy)}>Delete</button>
          </div>
        )}
      {password && <TemporaryPassword who={account.fullName} password={password} onDone={() => setPassword(null)} />}
      <Result result={result} />
    </div>
  );
}
