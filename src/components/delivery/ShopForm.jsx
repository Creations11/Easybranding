import { useState } from 'react';
import Button from '../ui/Button';
import { Input, Select } from '../ui/Field';
import { Field } from './ui';

export default function ShopForm({ initial, submitLabel, onSubmit, onCancel, busy, categories }) {
  const [f, setF] = useState({
    name: initial?.name || '', category: initial?.category || '', phone: initial?.phone || '',
    contactName: initial?.contactName || '', address: initial?.address || '',
    commissionPct: initial?.commissionPct ?? 0, prepMinutes: initial?.prepMinutes ?? '',
    deliveryOnly: !!initial?.deliveryOnly,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="mt-2.5 grid gap-2">
      <Field label="Shop name"><Input mono={false} aria-label="Shop name" value={f.name} onChange={set('name')} /></Field>
      <Field label="Category">
        <Select aria-label="Category" value={f.category} onChange={set('category')}>
          <option value="">Choose…</option>
          {(categories || []).map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
        </Select>
      </Field>
      <Field label="Shop's WhatsApp number"><Input aria-label="Shop phone" value={f.phone} onChange={set('phone')} placeholder="0821234567" /></Field>
      <Field label="Contact person"><Input mono={false} aria-label="Contact person" value={f.contactName} onChange={set('contactName')} /></Field>
      {initial && <Field label="Address"><Input mono={false} aria-label="Address" value={f.address} onChange={set('address')} /></Field>}
      <label className="flex items-center gap-2 text-[13px] text-ink">
        <input type="checkbox" aria-label="Delivery only" checked={f.deliveryOnly} onChange={(e) => setF({ ...f, deliveryOnly: e.target.checked })} />
        Delivery only (no menu, no commission)
      </label>
      {!f.deliveryOnly && (
        <Field label="Commission %"><Input aria-label="Commission" type="number" min="0" max="100" step="0.5" value={f.commissionPct} onChange={set('commissionPct')} /></Field>
      )}
      {initial && <Field label="Preparation time, minutes"><Input aria-label="Preparation minutes" type="number" min="0" max="240" value={f.prepMinutes} onChange={set('prepMinutes')} /></Field>}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" type="submit" disabled={busy}>{submitLabel}</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
