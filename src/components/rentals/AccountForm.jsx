import { useState } from 'react';
import { colors as c } from '../../utils/theme';
import { field, ROLES, btn } from './helpers';

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
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} style={{ display: 'grid', gap: 8, marginTop: 10 }}>
      <input aria-label="Full name" placeholder="Full name" value={form.fullName} onChange={set('fullName')} style={field} />
      <input aria-label="Email" placeholder="Email" type="email" value={form.email} onChange={set('email')} style={field} />
      <input aria-label="Cellphone" placeholder="Cellphone, e.g. 0821234567" value={form.phone} onChange={set('phone')} style={field} />
      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: c.text }}>
        {ROLES.map(([id, label]) => (
          <label key={id} style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.roles.includes(id)} onChange={() => toggle(id)} /> {label}
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={busy || !form.roles.length} style={btn(c.lime, busy || !form.roles.length)}>{submitLabel}</button>
        <button type="button" onClick={onCancel} style={btn(c.muted, false)}>Cancel</button>
      </div>
    </form>
  );
}
