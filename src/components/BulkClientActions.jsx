// src/components/BulkClientActions.jsx
//
// Suspend or switch back on several clients at once.
//
// Rewritten 2026-10-08. It used to open on "Suspend all selected" and apply
// with no question, ignore every failure and close as if all had worked, and
// offer "Delete all selected", which erased clients for good. Now:
//   - no delete: closing a client is one at a time, with the name typed back;
//   - suspending needs a reason (it silences their customers), through the
//     same Billing endpoint the Billing tab uses;
//   - every client's outcome is shown, and the box stays open when any failed.
import { useState } from 'react';
import { useBillingActions, billingErrorMessage } from '../hooks/useClientBilling';

const c = {
  surface: '#0D110C', lime: '#B8F040', cyan: '#22d3ee',
  amber: '#fbbf24', red: '#f87171', text: '#EEF0E8',
  muted: '#8A9080', border: 'rgba(184,240,64,0.12)',
  borderDim: 'rgba(255,255,255,0.06)',
};

export default function BulkClientActions({ selectedIds, tenants, onAction, onClose }) {
  const { suspend, reactivate } = useBillingActions();
  const [action, setAction] = useState('suspend');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const selectedTenants = tenants.filter(t => selectedIds.includes(t._id));
  const activeCount = selectedTenants.filter(t => t.status === 'active').length;
  const suspendedCount = selectedTenants.filter(t => t.status === 'suspended').length;
  const n = selectedTenants.length;
  const plural = n === 1 ? '' : 's';
  const needsReason = action === 'suspend' && !reason.trim();

  const handleApply = async () => {
    if (!n || needsReason) return;
    const question = action === 'suspend'
      ? `Suspend ${n} client${plural}? Their customers get no reply until they are switched back on.`
      : `Switch ${n} client${plural} back on?`;
    if (!window.confirm(question)) return;

    setLoading(true);
    const out = [];
    for (const t of selectedTenants) {
      try {
        if (action === 'suspend') await suspend(t._id, reason.trim());
        else await reactivate(t._id);
        out.push({ id: t._id, name: t.businessName, ok: true });
      } catch (err) {
        out.push({ id: t._id, name: t.businessName, ok: false, error: billingErrorMessage(err) });
      }
    }
    setLoading(false);
    setResults(out);
    onAction();
    if (out.every(r => r.ok)) onClose();
  };

  const failures = results?.filter(r => !r.ok) || [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440, background: c.surface, borderRadius: 20, border: '1px solid ' + c.border, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 900, color: c.lime }}>Bulk Actions</h3>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        <p style={{ color: c.muted, fontSize: 14, marginBottom: 16 }}>
          {n} client{plural} selected
          {activeCount > 0 && <span style={{ color: c.lime }}> · {activeCount} active</span>}
          {suspendedCount > 0 && <span style={{ color: c.amber }}> · {suspendedCount} suspended</span>}
        </p>

        {failures.length > 0 && (
          <div role="alert" style={{ background: c.red + '18', border: '1px solid ' + c.red + '33', borderRadius: 10, padding: '10px 14px', color: c.red, fontSize: 13, marginBottom: 14 }}>
            {failures.length} of {results.length} did not change:
            {failures.map(f => <div key={f.id} style={{ marginTop: 4 }}>{f.name}: {f.error}</div>)}
          </div>
        )}

        <p style={{ color: c.muted, fontSize: 12, marginBottom: 6 }}>Action</p>
        <select aria-label="Action" value={action} onChange={e => setAction(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, background: '#1C1C19', border: '1px solid ' + c.borderDim, color: c.text, fontSize: 14, marginBottom: 14, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          <option value="suspend">⏸ Suspend all selected</option>
          <option value="activate">▶ Switch all selected back on</option>
        </select>

        {action === 'suspend' && (
          <>
            <p style={{ color: c.muted, fontSize: 12, marginBottom: 6 }}>Why? Kept with each account.</p>
            <input aria-label="Reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. September unpaid"
              style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 10, background: '#1C1C19', border: '1px solid ' + c.borderDim, color: c.text, fontSize: 14, marginBottom: 20, outline: 'none', fontFamily: 'inherit' }} />
          </>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '11px 20px', background: 'transparent', border: '1px solid ' + c.borderDim, color: c.muted, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleApply} disabled={loading || needsReason} style={{ padding: '11px 24px', background: action === 'suspend' ? c.amber : c.lime, color: '#050505', border: 'none', borderRadius: 10, fontWeight: 700, cursor: loading || needsReason ? 'not-allowed' : 'pointer', opacity: loading || needsReason ? 0.6 : 1, fontFamily: 'inherit' }}>
            {loading ? 'Applying...' : `Apply to ${n} client${plural}`}
          </button>
        </div>
      </div>
    </div>
  );
}
