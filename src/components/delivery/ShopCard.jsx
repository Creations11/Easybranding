import { useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useDeliveryManage } from '../../hooks/useDeliveryManage';
import { useRun } from './useRun';
import { money, changed } from './helpers';
import { Card, CardHead, Row, Said } from './ui';
import ShopForm from './ShopForm';

export default function ShopCard({ v, q, categories }) {
  const m = useDeliveryManage(q);
  const { busy, result, run } = useRun();
  const [editing, setEditing] = useState(false);
  const settingUp = !!v.onboardingStep;
  const waiting = v.onboardingStep === 'review';

  const save = async (f) => {
    const fields = changed(v, f, ['name', 'category', 'phone', 'contactName', 'address', 'deliveryOnly']);
    if (!f.deliveryOnly && Number(f.commissionPct || 0) !== Number(v.commissionPct || 0)) fields.commissionPct = Number(f.commissionPct || 0);
    if (String(f.prepMinutes ?? '') !== String(v.prepMinutes ?? '')) fields.prepMinutes = f.prepMinutes === '' ? null : Number(f.prepMinutes);
    if (!Object.keys(fields).length) { setEditing(false); return; }
    if (await run(() => m.updateShop(v.id, fields), `${f.name.trim() || v.name} is updated.`)) setEditing(false);
  };
  const approve = () => {
    if (!window.confirm(`Approve ${v.name}? They get a WhatsApp saying they are live, and customers see them once they send OPEN.`)) return;
    run(() => m.approveShop(v.id), `${v.name} is approved, and has been told.`);
  };
  const off = () => {
    if (!window.confirm(`Switch ${v.name} off? It closes now, gets no orders, and customers stop seeing it. The shop is not messaged.`)) return;
    run(() => m.switchShopOff(v.id), `${v.name} is switched off.`);
  };
  const on = () => {
    if (!window.confirm(`Switch ${v.name} back on? Customers see it again once it sends OPEN.`)) return;
    run(() => m.switchShopOn(v.id), `${v.name} is switched on.`);
  };
  const remove = () => {
    if (!window.confirm(`Delete ${v.name}? Only a shop that has never had an order can be deleted; one with orders has to be switched off instead.`)) return;
    run(() => m.removeShop(v.id), `${v.name} is deleted.`);
  };

  let state = ['closed', 'neutral'];
  if (waiting) state = ['waiting for approval', 'warn'];
  else if (settingUp) state = ['setting up', 'system'];
  else if (!v.active) state = ['switched off', 'bad'];
  else if (v.open) state = ['open', 'good'];

  return (
    <Card>
      <CardHead title={v.name}>
        <Badge tone={state[1]}>{state[0]}</Badge>
      </CardHead>
      <div className="mt-1.5 text-xs text-muted">{v.phone} · {v.category}{v.contactName ? ` · ${v.contactName}` : ''}</div>
      <div className="mt-2">
        <Row left="Plan" right={v.plan === 'subscriber' ? 'subscriber' : 'pay as you go'} />
        {v.plan === 'subscriber' && <Row left="Wallet" right={money(v.wallet)} mono />}
        <Row left="Paid by" right={v.paystackSubaccount ? 'split at checkout' : 'by hand'} />
        {!v.deliveryOnly && <Row left="Commission" right={`${v.commissionPct || 0}%`} />}
        {v.address && <Row left="Address" right={v.address} />}
        {v.onboardingStep && <Row left="Setting up" right={v.onboardingStep} />}
        {v.joinCode && <Row left="Join code" right={v.joinCode} />}
      </div>
      {v.joinLink && (
        <div className="mt-1.5 break-all text-xs">
          <a href={v.joinLink} target="_blank" rel="noreferrer" className="text-lime">Their join link ↗</a>
        </div>
      )}
      {editing
        ? <ShopForm initial={v} submitLabel="Save" onSubmit={save} onCancel={() => setEditing(false)} busy={busy} categories={categories} />
        : (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Button variant="secondary" onClick={() => setEditing(true)} disabled={busy}>Edit</Button>
            {waiting && <Button variant="good" onClick={approve} disabled={busy}>Approve</Button>}
            {!settingUp && v.active && <Button variant="warn" onClick={off} disabled={busy}>Switch off</Button>}
            {!settingUp && !v.active && <Button variant="good" onClick={on} disabled={busy}>Switch on</Button>}
            <Button variant="danger" onClick={remove} disabled={busy}>Delete</Button>
          </div>
        )}
      <Said result={result} />
    </Card>
  );
}
