import { useState } from 'react';
import Button from '../ui/Button';
import { Input } from '../ui/Field';
import { ROLES } from './helpers';

/** Name, email, number and roles: the same form for a new account and an edit. */
export default function AccountForm({ initial, submitLabel, onSubmit, onCancel, busy }) {
  const [form, setForm] = useState({
    fullName: initial?.fullName || '', email: initial?.email || '', phone: initial?.phone || '',
    roles: initial?.roles || ['renter'],
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggle = (role) => setForm({
    ...form, roles: form.roles.includes(role) ? form.roles.filter((r) => r !== role) : [...form.roles, role],
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="mt-2.5 grid gap-2">
      <Input mono={false} aria-label="Full name" placeholder="Full name" value={form.fullName} onChange={set('fullName')} className="bg-surface" />
      <Input mono={false} aria-label="Email" placeholder="Email" type="email" value={form.email} onChange={set('email')} className="bg-surface" />
      <Input aria-label="Cellphone" placeholder="Cellphone, e.g. 0821234567" value={form.phone} onChange={set('phone')} className="bg-surface" />
      <div className="flex gap-4 text-[13px] text-ink">
        {ROLES.map(([id, label]) => (
          <label key={id} className="flex min-h-[44px] cursor-pointer items-center gap-1.5">
            <input type="checkbox" checked={form.roles.includes(id)} onChange={() => toggle(id)} /> {label}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" disabled={busy || !form.roles.length}>{submitLabel}</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
