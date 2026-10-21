import { useState } from 'react';
import { colors } from '../../utils/theme';
import { input, act } from './helpers';
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
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
      <Field label="Shop name"><input aria-label="Shop name" value={f.name} onChange={set('name')} style={input} /></Field>
      <Field label="Category">
        <select aria-label="Category" value={f.category} onChange={set('category')} style={input}>
          <option value="">Choose…</option>
          {(categories || []).map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
        </select>
      </Field>
      <Field label="Shop's WhatsApp number"><input aria-label="Shop phone" value={f.phone} onChange={set('phone')} placeholder="0821234567" style={input} /></Field>
      <Field label="Contact person"><input aria-label="Contact person" value={f.contactName} onChange={set('contactName')} style={input} /></Field>
      {initial && <Field label="Address"><input aria-label="Address" value={f.address} onChange={set('address')} style={input} /></Field>}
      <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: colors.text }}>
        <input type="checkbox" aria-label="Delivery only" checked={f.deliveryOnly} onChange={(e) => setF({ ...f, deliveryOnly: e.target.checked })} />
        Delivery only (no menu, no commission)
      </label>
      {!f.deliveryOnly && (
        <Field label="Commission %"><input aria-label="Commission" type="number" min="0" max="100" step="0.5" value={f.commissionPct} onChange={set('commissionPct')} style={input} /></Field>
      )}
      {initial && <Field label="Preparation time, minutes"><input aria-label="Preparation minutes" type="number" min="0" max="240" value={f.prepMinutes} onChange={set('prepMinutes')} style={input} /></Field>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" disabled={busy} style={act(colors.lime, busy)}>{submitLabel}</button>
        <button type="button" onClick={onCancel} style={act(colors.muted, false)}>Cancel</button>
      </div>
    </form>
  );
}
