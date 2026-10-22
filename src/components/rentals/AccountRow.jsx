import { useState } from 'react';
import Button from '../ui/Button';
import { useRentalsActions } from '../../hooks/useRentalsModeration';
import { useAct } from './useAct';
import { when, askReason, changes, whatsapp } from './helpers';
import { Result, Sheet, TemporaryPassword } from './ui';
import AccountForm from './AccountForm';

export default function AccountRow({ account }) {
  const { suspend, reinstate, updateAccount, resetPassword, deleteAccount, unlinkWhatsApp } = useRentalsActions();
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
  const onUnlink = () => {
    if (!window.confirm(`Unlink ${account.fullName}'s WhatsApp? EasyRentals stops messaging that number until they link it again from their account page.`)) return;
    act(() => unlinkWhatsApp(account.id), `${account.fullName}'s WhatsApp is unlinked.`);
  };
  const onReinstate = () => {
    if (!window.confirm(`Reinstate ${account.fullName}?`)) return;
    act(() => reinstate(account.id), `${account.fullName} is reinstated.`);
  };
  return (
    <Sheet data-testid={`account-${account.id}`}>
      <div className="flex flex-wrap justify-between gap-2.5">
        <div>
          <span className="font-bold text-ink">{account.fullName}</span>
          <span className="ml-2 text-xs text-muted">{account.roles.join(' and ')}</span>
          {!account.isActive && <span className="ml-2 text-[11px] text-red">suspended{account.suspendedReason ? `: ${account.suspendedReason}` : ''}</span>}
        </div>
        <span className="font-mono text-xs tabular-nums text-muted">{account.listings === 1 ? '1 listing' : `${account.listings} listings`}</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
        <span>{account.email}</span>
        <span className="font-mono">{account.phone}</span>
        <span>joined {when(account.createdAt)}</span>
        <span>{account.lastLoginAt ? `last signed in ${when(account.lastLoginAt)}` : 'never signed in again'}</span>
        {/* Linked = the handset sent the account page's code, so the number is
            proved theirs. The cellphone above is only what they typed. */}
        {account.whatsappPhone
          ? <span>WhatsApp linked: <a href={whatsapp(account.whatsappPhone)} target="_blank" rel="noopener noreferrer" className="font-mono text-emerald underline">{account.whatsappPhone}</a></span>
          : <span>WhatsApp not linked</span>}
      </div>
      {editing
        ? <AccountForm initial={account} submitLabel="Save" onSubmit={onSave} onCancel={() => setEditing(false)} busy={busy} />
        : (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)} disabled={busy}>Edit</Button>
            <Button variant="warn" onClick={onReset} disabled={busy}>Reset password</Button>
            {account.isActive
              ? <Button variant="danger" onClick={onSuspend} disabled={busy}>Suspend</Button>
              : <Button variant="good" onClick={onReinstate} disabled={busy}>Reinstate</Button>}
            {account.whatsappPhone && <Button variant="secondary" onClick={onUnlink} disabled={busy}>Unlink WhatsApp</Button>}
            <Button variant="danger" onClick={onDelete} disabled={busy}>Delete</Button>
          </div>
        )}
      {password && <TemporaryPassword who={account.fullName} password={password} onDone={() => setPassword(null)} />}
      <Result result={result} />
    </Sheet>
  );
}
