import { useState } from 'react';
import Button from '../ui/Button';
import { useDeliveryManage } from '../../hooks/useDeliveryManage';
import { useRun } from './useRun';
import { Card, Empty, Said } from './ui';
import DriverForm from './DriverForm';
import DriverCard from './DriverCard';

function AddDriver({ q }) {
  const { addDriver } = useDeliveryManage(q);
  const { busy, result, run, clear } = useRun();
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <div className="mb-3">
        <Button variant="primary" onClick={() => { clear(); setOpen(true); }}>+ Add driver</Button>
        <Said result={result} />
      </div>
    );
  }
  const submit = async (f) => {
    const data = await run(
      () => addDriver({ name: f.name.trim(), phone: f.phone.trim(), vehicleType: f.vehicleType || null, vehicleRegistration: f.vehicleRegistration.trim() || null }),
      (d) => `${d.driver.name} is added. No real job reaches them until they have done one practice run and you have checked their papers.\n\nSend them this link to start: ${d.joinLink}`,
    );
    if (data) setOpen(false);
  };
  return (
    <Card>
      <div className="text-sm font-semibold text-ink">Add a driver</div>
      <DriverForm submitLabel="Add driver" onSubmit={submit} onCancel={() => setOpen(false)} busy={busy} />
      <Said result={result} />
    </Card>
  );
}

export default function Drivers({ drivers, q }) {
  // Who can take a job right now first, then who is owed the most.
  const sorted = [...drivers].sort((a, b) => (b.onShift ? 1 : 0) - (a.onShift ? 1 : 0) || (b.owed || 0) - (a.owed || 0));
  return (
    <div>
      <AddDriver q={q} />
      {!drivers.length && <Empty>No drivers yet, so orders come in and sit waiting. Add one above, or from WhatsApp with ADDDRIVER Name 082…</Empty>}
      {sorted.map((d) => <DriverCard key={d.phone} d={d} q={q} />)}
    </div>
  );
}
