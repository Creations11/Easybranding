import { useState } from 'react';
import { colors } from '../../utils/theme';
import { useDeliveryManage } from '../../hooks/useDeliveryManage';
import { useRun } from './useRun';
import { money, act, changed } from './helpers';
import { Card, Chip, Row, Said } from './ui';
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

  let state = ['closed', colors.muted];
  if (waiting) state = ['waiting for approval', colors.amber];
  else if (settingUp) state = ['setting up', colors.cyan];
  else if (!v.active) state = ['switched off', colors.red];
  else if (v.open) state = ['open', colors.emerald];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
        <div style={{ color: colors.text, fontWeight: 600, fontSize: '14px' }}>{v.name}</div>
        <Chip text={state[0]} tint={state[1]} />
      </div>
      <div style={{ color: colors.muted, fontSize: '12px', marginTop: '6px' }}>{v.phone} · {v.category}{v.contactName ? ` · ${v.contactName}` : ''}</div>
      <div style={{ marginTop: '8px' }}>
        <Row left="Plan" right={v.plan === 'subscriber' ? 'subscriber' : 'pay as you go'} />
        {v.plan === 'subscriber' && <Row left="Wallet" right={money(v.wallet)} />}
        <Row left="Paid by" right={v.paystackSubaccount ? 'split at checkout' : 'by hand'} />
        {!v.deliveryOnly && <Row left="Commission" right={`${v.commissionPct || 0}%`} />}
        {v.address && <Row left="Address" right={v.address} />}
        {v.onboardingStep && <Row left="Setting up" right={v.onboardingStep} />}
        {v.joinCode && <Row left="Join code" right={v.joinCode} />}
      </div>
      {v.joinLink && (
        <div style={{ fontSize: '12px', marginTop: '6px', wordBreak: 'break-all' }}>
          <a href={v.joinLink} target="_blank" rel="noreferrer" style={{ color: colors.lime }}>Their join link ↗</a>
        </div>
      )}
      {editing
        ? <ShopForm initial={v} submitLabel="Save" onSubmit={save} onCancel={() => setEditing(false)} busy={busy} categories={categories} />
        : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
            <button onClick={() => setEditing(true)} disabled={busy} style={act(colors.cyan, busy)}>Edit</button>
            {waiting && <button onClick={approve} disabled={busy} style={act(colors.emerald, busy)}>Approve</button>}
            {!settingUp && v.active && <button onClick={off} disabled={busy} style={act(colors.amber, busy)}>Switch off</button>}
            {!settingUp && !v.active && <button onClick={on} disabled={busy} style={act(colors.emerald, busy)}>Switch on</button>}
            <button onClick={remove} disabled={busy} style={act(colors.red, busy)}>Delete</button>
          </div>
        )}
      <Said result={result} />
    </Card>
  );
}
