import { useState } from 'react';
import { colors } from '../../utils/theme';
import { input, act } from './helpers';
import { Field } from './ui';

const VEHICLES = [['', 'Not given'], ['motorbike', 'Motorbike'], ['motorcycle', 'Motorcycle'], ['car', 'Car']];

export default function DriverForm({ initial, submitLabel, onSubmit, onCancel, busy }) {
  const [f, setF] = useState({
    name: initial?.name || '', phone: initial?.phone || '', fullName: initial?.fullName || '',
    vehicleType: initial?.vehicleType || '', vehicleRegistration: initial?.vehicleRegistration || '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
      <Field label="Name on the job card"><input aria-label="Driver name" value={f.name} onChange={set('name')} style={input} /></Field>
      <Field label="Cellphone"><input aria-label="Driver phone" value={f.phone} onChange={set('phone')} placeholder="0821234567" style={input} /></Field>
      {initial && <Field label="Name on their licence"><input aria-label="Licence name" value={f.fullName} onChange={set('fullName')} style={input} /></Field>}
      <Field label="Vehicle">
        <select aria-label="Vehicle" value={f.vehicleType} onChange={set('vehicleType')} style={input}>
          {VEHICLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Field>
      <Field label="Registration"><input aria-label="Registration" value={f.vehicleRegistration} onChange={set('vehicleRegistration')} style={input} /></Field>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" disabled={busy} style={act(colors.lime, busy)}>{submitLabel}</button>
        <button type="button" onClick={onCancel} style={act(colors.muted, false)}>Cancel</button>
      </div>
    </form>
  );
}
