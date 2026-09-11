// src/components/BillingPanel.jsx
//
// Clients & Billing — what each client owes us, and the four things you do
// about it: record an EFT, send a Pay Now, suspend, reactivate.
//
// Phase 1 of the frontend upgrade (docs/…, 2026-09-11). On that day each of
// these was a server script; Venbus's R100 alone took three separate steps,
// and forgetting any one leaves a client paying-and-dark or dark-and-"paid".
//
// Two things this screen must never do:
//   - show R0 when the figures failed to load (a zero reads as "owes nothing");
//   - let "suspend" look like a label. It is a behaviour: their customers get
//     silence. The server says so on every change, and this shows it.
import { useState } from 'react';
import { colors as c } from '../utils/theme';
import { useClientBilling, useBillingActions, billingErrorMessage } from '../hooks/useClientBilling';

const rand = (n) => (typeof n === 'number' ? 'R' + n.toLocaleString('en-ZA', { maximumFractionDigits: 2 }) : '—');
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const today = () => new Date().toISOString().slice(0, 10);

const STATUS_TONE = { active: c.emerald, suspended: c.red, trial: c.amber, cancelled: c.muted };

const btn = (tone, disabled) => ({
  padding: '6px 12px', fontSize: 12, fontFamily: 'inherit', borderRadius: 8,
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
  background: tone + '18', color: tone, border: '1px solid ' + tone + '44',
});

const input = {
  padding: '6px 10px', fontSize: 13, fontFamily: 'inherit', borderRadius: 8,
  background: c.surface, color: c.text, border: '1px solid ' + c.borderDim, outline: 'none',
};

/** Record an EFT that arrived in the bank — amount, statement date and reference. */
function EftForm({ client, onDone, onCancel }) {
  const oldest = client.openInvoices[0];
  const [amount, setAmount] = useState(oldest ? String(oldest.total) : '');
  const [date, setDate] = useState(today());
  const [reference, setReference] = useState('');
  const [invoiceId, setInvoiceId] = useState(oldest?.id || '');
  const [reactivate, setReactivate] = useState(client.status !== 'active');
  const [busy, setBusy] = useState(false);
  const { recordEft } = useBillingActions();

  // All three are required by the server: a row without a statement date and
  // reference cannot be traced back to the bank, and looks like evidence.
  const ready = Number(amount) > 0 && date && reference.trim() && !busy;

  const submit = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    try {
      const r = await recordEft(client.tenantId, {
        amount: Number(amount), date, bankReference: reference.trim(),
        invoiceId: invoiceId || null, reactivate,
      });
      const parts = ['Payment recorded.'];
      if (r.invoice?.closed) parts.push(`Invoice ${r.invoice.invoiceNumber} closed.`);
      if (r.reactivated) parts.push(`${client.businessName} is active again.`);
      onDone({ tone: c.emerald, text: parts.join(' '), warnings: r.warnings || [] });
    } catch (err) {
      onDone({ tone: c.red, text: billingErrorMessage(err), warnings: [], keepOpen: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} aria-label={`Record EFT for ${client.businessName}`}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 12, padding: 12, background: c.surface, borderRadius: 10 }}>
      <label style={{ fontSize: 12, color: c.muted }}>Amount (R)
        <input aria-label="Amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ ...input, width: 100, marginLeft: 6 }} />
      </label>
      <label style={{ fontSize: 12, color: c.muted }}>Statement date
        <input aria-label="Statement date" type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} style={{ ...input, marginLeft: 6 }} />
      </label>
      <label style={{ fontSize: 12, color: c.muted }}>Bank reference
        <input aria-label="Bank reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="as on the statement" style={{ ...input, width: 200, marginLeft: 6 }} />
      </label>
      {client.openInvoices.length > 0 && (
        <label style={{ fontSize: 12, color: c.muted }}>Pays
          <select aria-label="Invoice" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} style={{ ...input, marginLeft: 6 }}>
            {client.openInvoices.map((i) => <option key={i.id} value={i.id}>{i.invoiceNumber} — {rand(i.total)}</option>)}
          </select>
        </label>
      )}
      {client.status !== 'active' && (
        <label style={{ fontSize: 12, color: c.text, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input aria-label="Switch them back on" type="checkbox" checked={reactivate} onChange={(e) => setReactivate(e.target.checked)} />
          Switch them back on
        </label>
      )}
      <button type="submit" disabled={!ready} style={btn(c.lime, !ready)}>{busy ? 'Recording…' : 'Record payment'}</button>
      <button type="button" onClick={onCancel} style={btn(c.muted, false)}>Cancel</button>
    </form>
  );
}

function ClientRow({ client }) {
  const [eftOpen, setEftOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const { suspend, reactivate, sendPayLink } = useBillingActions();
  const oldest = client.openInvoices[0];
  const tone = STATUS_TONE[client.status] || c.muted;

  const act = async (fn, describe) => {
    setBusy(true);
    try { setResult(describe(await fn())); }
    catch (err) { setResult({ tone: c.red, text: billingErrorMessage(err) }); }
    finally { setBusy(false); }
  };

  const onPayNow = () => {
    if (!oldest) return;
    // A real WhatsApp to a real person, and a real Paystack charge — so it is
    // said in full before it happens.
    if (!window.confirm(`Send ${client.businessName} a Pay Now for ${oldest.invoiceNumber} (${rand(oldest.total)}) on WhatsApp to ${client.contactPhone}?`)) return;
    act(() => sendPayLink(client.tenantId, oldest.id), (r) => r.sent
      ? { tone: c.emerald, text: `Pay Now sent for ${r.invoice.invoiceNumber}. Paying it closes the invoice and switches them back on automatically.` }
      // Minted but not delivered: hand the link over rather than invite a
      // second click, which would mint a second charge.
      : { tone: c.amber, text: `WhatsApp didn't deliver it — send this link yourself, and don't press Send again (it would create a second charge): ${r.link}` });
  };

  const onSuspend = () => {
    const reason = window.prompt(`Why is ${client.businessName} being suspended? Their customers will get no reply while suspended.`);
    if (!reason || !reason.trim()) return;
    act(() => suspend(client.tenantId, reason.trim()), (r) => ({ tone: c.amber, text: r.consequence }));
  };

  const onReactivate = () => {
    if (!window.confirm(`Switch ${client.businessName} back on?`)) return;
    act(() => reactivate(client.tenantId), (r) => ({ tone: c.emerald, text: r.consequence }));
  };

  return (
    <div data-testid={`client-${client.tenantId}`} style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{client.businessName}</span>
          <span style={{ marginLeft: 10, fontSize: 11, padding: '2px 8px', borderRadius: 999, background: tone + '22', color: tone, textTransform: 'uppercase', letterSpacing: 0.5 }}>{client.status}</span>
          {/* An active client whose number cannot send is paying for silence —
              as loud as the status, not a footnote. */}
          {!client.canSend && (
            <span style={{ marginLeft: 8, fontSize: 11, color: c.red }} title={client.sendBlocker}>⛔ can't send — {client.sendBlocker}</span>
          )}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: client.owed > 0 ? c.amber : c.muted }}>
          {client.owed > 0 ? `owes ${rand(client.owed)}` : 'nothing owed'}
        </div>
      </div>

      <div style={{ fontSize: 12, color: c.muted, marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <span>Monthly {rand(client.monthlyFee)}</span>
        {client.openInvoices.length > 0 && <span>Open: {client.openInvoices.map((i) => `${i.invoiceNumber} (${rand(i.total)})`).join(', ')}</span>}
        <span>{client.lastPayment
          ? `Last paid ${rand(client.lastPayment.amount)} by ${client.lastPayment.method} on ${day(client.lastPayment.at)}`
          : 'No payment recorded'}</span>
        {client.status === 'suspended' && client.suspendReason && <span>Suspended: {client.suspendReason}</span>}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        <button onClick={() => { setEftOpen((v) => !v); setResult(null); }} disabled={busy} style={btn(c.lime, busy)}>Record EFT</button>
        <button onClick={onPayNow} disabled={busy || !oldest} title={oldest ? '' : 'No open invoice to pay'} style={btn(c.cyan, busy || !oldest)}>Send Pay Now</button>
        {client.status === 'suspended'
          ? <button onClick={onReactivate} disabled={busy} style={btn(c.emerald, busy)}>Reactivate</button>
          : <button onClick={onSuspend} disabled={busy} style={btn(c.red, busy)}>Suspend</button>}
      </div>

      {eftOpen && (
        <EftForm
          client={client}
          onCancel={() => setEftOpen(false)}
          onDone={(r) => { setResult(r); if (!r.keepOpen) setEftOpen(false); }}
        />
      )}

      {result && (
        <div role="status" style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13, background: result.tone + '14', color: result.tone, border: '1px solid ' + result.tone + '33' }}>
          {result.text}
          {result.warnings?.map((w) => <div key={w} style={{ fontSize: 12, color: c.amber, marginTop: 4 }}>⚠ {w}</div>)}
        </div>
      )}
    </div>
  );
}

export default function BillingPanel() {
  const { data, isLoading, isError, refetch } = useClientBilling();

  const header = (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: 4, color: c.text }}>Billing</h1>
      <p style={{ color: c.muted, fontSize: 15 }}>What each client owes us — record a payment, send a Pay Now, suspend or reactivate.</p>
    </div>
  );

  if (isLoading) return <div>{header}<p style={{ color: c.muted, fontSize: 13 }}>Loading clients…</p></div>;

  // Never a zero: a failed load that rendered "nothing owed" would read as
  // every client being paid up.
  if (isError) {
    return (
      <div>{header}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', background: c.red + '11', border: '1px solid ' + c.red + '33', borderRadius: 12 }}>
          <span style={{ fontSize: 13, color: c.red }}>Couldn't load billing — this is not "nothing owed".</span>
          <button onClick={() => refetch?.()} style={btn(c.red, false)}>Retry</button>
        </div>
      </div>
    );
  }

  const clients = [...(data || [])].sort((a, b) =>
    (b.status === 'suspended') - (a.status === 'suspended') || (b.owed || 0) - (a.owed || 0) || a.businessName.localeCompare(b.businessName));
  const totalOwed = clients.reduce((a, cl) => a + (cl.owed || 0), 0);

  return (
    <div>
      {header}
      <p style={{ fontSize: 13, color: c.text, marginBottom: 14 }}>
        {clients.length} client{clients.length === 1 ? '' : 's'} · <strong style={{ color: totalOwed > 0 ? c.amber : c.muted }}>{rand(totalOwed)}</strong> owed in total
      </p>
      {clients.length === 0
        ? <p style={{ color: c.muted, fontSize: 13 }}>No clients yet.</p>
        : clients.map((cl) => <ClientRow key={cl.tenantId} client={cl} />)}
    </div>
  );
}
