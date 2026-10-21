import { useState } from 'react';
import Button from '../ui/Button';
import { useRentalsActions } from '../../hooks/useRentalsModeration';
import { useAct } from './useAct';
import { Result, Sheet, TemporaryPassword } from './ui';
import AccountForm from './AccountForm';

export default function NewAccount() {
  const { createAccount } = useRentalsActions();
  const [open, setOpen] = useState(false);
  const [made, setMade] = useState(null);
  const { busy, result, act } = useAct();
  if (made) return <Sheet><TemporaryPassword who={made.account.fullName} password={made.temporaryPassword} onDone={() => setMade(null)} /></Sheet>;
  if (!open) return <Button variant="primary" onClick={() => setOpen(true)} className="mb-3.5">+ New account</Button>;
  const onSubmit = (form) => act(async () => {
    const data = await createAccount({ ...form, fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim() });
    setOpen(false);
    setMade(data);
  }, 'Account made.');
  return (
    <Sheet>
      <div className="font-bold text-ink">New EasyRentals account</div>
      <div className="text-xs text-muted">The API makes a temporary password and shows it once, for you to give the person.</div>
      <AccountForm submitLabel="Make account" onSubmit={onSubmit} onCancel={() => setOpen(false)} busy={busy} />
      <Result result={result} />
    </Sheet>
  );
}
