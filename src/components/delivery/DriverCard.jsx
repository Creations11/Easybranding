import { useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useDeliveryManage } from '../../hooks/useDeliveryManage';
import { useRun } from './useRun';
import { money, changed } from './helpers';
import { Card, CardHead, Row, Said } from './ui';
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
      <CardHead title={who}>
        <Badge tone={suspended ? 'bad' : d.onShift ? 'good' : 'neutral'}>{suspended ? 'suspended' : d.onShift ? 'on shift' : 'off'}</Badge>
      </CardHead>
      <div className="mt-1.5 text-xs text-muted">
        {d.phone}{d.vehicleType ? ` · ${d.vehicleType}` : ''}{d.vehicleRegistration ? ` · ${d.vehicleRegistration}` : ''}
      </div>
      <div className="mt-2">
        <Row left="Papers" right={d.kycStatus || 'not asked for'} />
        <Row left="Practice run" right={d.practiceDoneAt ? 'done' : d.practiceRequired ? 'not done — no jobs reach them' : 'not required'} />
        <Row left="Carrying" right={d.carrying || 'nothing'} />
        <Row left="Owed" right={money(d.owed)} mono />
      </div>
      {editing
        ? <DriverForm initial={d} submitLabel="Save" onSubmit={save} onCancel={() => setEditing(false)} busy={busy} />
        : (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Button variant="secondary" onClick={() => setEditing(true)} disabled={busy}>Edit</Button>
            {papersWaiting && <Button variant="good" onClick={verify} disabled={busy}>Accept papers</Button>}
            {papersWaiting && <Button variant="warn" onClick={reject} disabled={busy}>Send papers back</Button>}
            {suspended
              ? <Button variant="good" onClick={activate} disabled={busy}>Activate</Button>
              : <Button variant="warn" onClick={suspend} disabled={busy}>Suspend</Button>}
            <Button variant="danger" onClick={remove} disabled={busy}>Remove</Button>
          </div>
        )}
      <Said result={result} />
    </Card>
  );
}
