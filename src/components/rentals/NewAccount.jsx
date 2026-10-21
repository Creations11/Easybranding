import { useState } from 'react';
import { colors as c } from '../../utils/theme';
import { useRentalsActions } from '../../hooks/useRentalsModeration';
import { useAct } from './useAct';
import { btn, card } from './helpers';
import { Result, TemporaryPassword } from './ui';
import AccountForm from './AccountForm';

export default function NewAccount() {
  const { createAccount } = useRentalsActions();
  const [open, setOpen] = useState(false);
  const [made, setMade] = useState(null);
  const { busy, result, act } = useAct();
  if (made) return <div style={card}><TemporaryPassword who={made.account.fullName} password={made.temporaryPassword} onDone={() => setMade(null)} /></div>;
  if (!open) return <button onClick={() => setOpen(true)} style={{ ...btn(c.lime, false), marginBottom: 14 }}>+ New account</button>;
  const onSubmit = (form) => act(async () => {
    const data = await createAccount({ ...form, fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim() });
    setOpen(false);
    setMade(data);
  }, 'Account made.');
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, color: c.text }}>New EasyRentals account</div>
      <div style={{ fontSize: 12, color: c.muted }}>The API makes a temporary password and shows it once, for you to give the person.</div>
      <AccountForm submitLabel="Make account" onSubmit={onSubmit} onCancel={() => setOpen(false)} busy={busy} />
      <Result result={result} />
    </div>
  );
}
