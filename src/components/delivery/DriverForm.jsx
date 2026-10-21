import { useState } from 'react';
import Button from '../ui/Button';
import { Input, Select } from '../ui/Field';
import { Field } from './ui';

const VEHICLES = [['', 'Not given'], ['motorbike', 'Motorbike'], ['motorcycle', 'Motorcycle'], ['car', 'Car']];

export default function DriverForm({ initial, submitLabel, onSubmit, onCancel, busy }) {
  const [f, setF] = useState({
    name: initial?.name || '', phone: initial?.phone || '', fullName: initial?.fullName || '',
    vehicleType: initial?.vehicleType || '', vehicleRegistration: initial?.vehicleRegistration || '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="mt-2.5 grid gap-2">
      <Field label="Name on the job card"><Input mono={false} aria-label="Driver name" value={f.name} onChange={set('name')} /></Field>
      <Field label="Cellphone"><Input aria-label="Driver phone" value={f.phone} onChange={set('phone')} placeholder="0821234567" /></Field>
      {initial && <Field label="Name on their licence"><Input mono={false} aria-label="Licence name" value={f.fullName} onChange={set('fullName')} /></Field>}
      <Field label="Vehicle">
        <Select aria-label="Vehicle" value={f.vehicleType} onChange={set('vehicleType')}>
          {VEHICLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </Field>
      <Field label="Registration"><Input aria-label="Registration" value={f.vehicleRegistration} onChange={set('vehicleRegistration')} /></Field>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" type="submit" disabled={busy}>{submitLabel}</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
