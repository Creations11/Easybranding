import { useState } from 'react';
import { colors } from '../../utils/theme';
import { useDeliveryManage } from '../../hooks/useDeliveryManage';
import { useRun } from './useRun';
import { money, act, changed } from './helpers';
import { Card, Chip, Row, Said } from './ui';
import DriverForm from './DriverForm';

export default function DriverCard({ d, q }) {
  const m = useDeliveryManage(q);
  const { busy, result, run } = useRun();
  const [editing, setEditing] = useState(false);
  const who = d.name || d.phone;
  const suspended = d.status === 'suspended';
  const papersWaiting = d.kycStatus === 'pending';

  const save = async (f) => {
    const fields = changed(d, f, ['name', 'phone', 'fullName', 'vehicleType', 'vehicleRegistration']);
    if (!Object.keys(fields).length) { setEditing(false); return; }
    if (await run(() => m.updateDriver(d.phone, fields), `${f.name.trim() || who} is updated.`)) setEditing(false);
  };
  const suspend = () => {
    if (!window.confirm(`Suspend ${who}? No new jobs reach them, and their shift ends. They are not messaged.`)) return;
    run(() => m.suspendDriver(d.phone), (r) => `${who} is suspended.${r.carrying ? ` They are still out with ${r.carrying} job${r.carrying > 1 ? 's' : ''}: re-dispatch if they will not finish.` : ''}`);
  };
  const activate = () => {
    if (!window.confirm(`Make ${who} active again?`)) return;
    run(() => m.activateDriver(d.phone), `${who} is active again.`);
  };
  const verify = () => {
    if (!window.confirm(`Accept ${who}'s papers? They get a WhatsApp saying they are approved and can go online.`)) return;
    run(() => m.verifyDriver(d.phone), `${who}'s papers are accepted, and they have been told.`);
  };
  const reject = () => {
    const reason = window.prompt(`Why are ${who}'s papers not accepted? They get this on WhatsApp and are asked to send them again.`);
    if (reason && reason.trim()) run(() => m.rejectDriver(d.phone, reason.trim()), `${who} has been told, and asked to send their papers again.`);
  };
  const remove = () => {
    if (!window.confirm(`Remove ${who} from your drivers? What they are owed stays on the books.`)) return;
    run(() => m.removeDriver(d.phone), `${who} is removed.`);
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
        <div style={{ color: colors.text, fontWeight: 600, fontSize: '14px' }}>{who}</div>
        <Chip text={suspended ? 'suspended' : d.onShift ? 'on shift' : 'off'} tint={suspended ? colors.red : d.onShift ? colors.emerald : colors.muted} />
      </div>
      <div style={{ color: colors.muted, fontSize: '12px', marginTop: '6px' }}>
        {d.phone}{d.vehicleType ? ` · ${d.vehicleType}` : ''}{d.vehicleRegistration ? ` · ${d.vehicleRegistration}` : ''}
      </div>
      <div style={{ marginTop: '8px' }}>
        <Row left="Papers" right={d.kycStatus || 'not asked for'} />
        <Row left="Practice run" right={d.practiceDoneAt ? 'done' : d.practiceRequired ? 'not done — no jobs reach them' : 'not required'} />
        <Row left="Carrying" right={d.carrying || 'nothing'} />
        <Row left="Owed" right={money(d.owed)} />
      </div>
      {editing
        ? <DriverForm initial={d} submitLabel="Save" onSubmit={save} onCancel={() => setEditing(false)} busy={busy} />
        : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
            <button onClick={() => setEditing(true)} disabled={busy} style={act(colors.cyan, busy)}>Edit</button>
            {papersWaiting && <button onClick={verify} disabled={busy} style={act(colors.emerald, busy)}>Accept papers</button>}
            {papersWaiting && <button onClick={reject} disabled={busy} style={act(colors.amber, busy)}>Send papers back</button>}
            {suspended
              ? <button onClick={activate} disabled={busy} style={act(colors.emerald, busy)}>Activate</button>
              : <button onClick={suspend} disabled={busy} style={act(colors.amber, busy)}>Suspend</button>}
            <button onClick={remove} disabled={busy} style={act(colors.red, busy)}>Remove</button>
          </div>
        )}
      <Said result={result} />
    </Card>
  );
}
