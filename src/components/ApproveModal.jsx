// src/components/ApproveModal.jsx
import { useState } from 'react';
import api from '../api';

const c = {
  surface: '#0D110C', lime: '#B8F040', cyan: '#22d3ee',
  amber: '#fbbf24', red: '#f87171', text: '#EEF0E8',
  muted: '#8A9080', border: 'rgba(184,240,64,0.12)',
  borderDim: 'rgba(255,255,255,0.06)',
};

export default function ApproveModal({ user, tenants, onClose, onApproved }) {
  const [role, setRole] = useState('agent');
  const [tenantId, setTenantId] = useState(user.tenantId || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    setSaving(true);
    try {
      await api.post('/users/' + user._id + '/approve', { role, tenantId: tenantId || null });
      onApproved();
    } catch (err) {
      setError(err.response?.data?.message || 'Approval failed');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ width: '100%', maxWidth: '460px', background: c.surface, borderRadius: '24px', border: '1px solid ' + c.border, padding: '32px' }}>
      <h3 style={{ color: c.lime, marginBottom: '8px' }}>Approve User</h3>
      <p style={{ color: c.muted, fontSize: '14px', marginBottom: '4px' }}>{user.fullName} · {user.email}</p>
      {user.requestedPlan && (
        <div style={{ background: c.lime + '12', border: '1px solid ' + c.lime + '33', borderRadius: '10px', padding: '10px 14px', margin: '12px 0', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Requested plan</p>
            <p style={{ color: c.lime, fontWeight: '700', textTransform: 'capitalize' }}>{user.requestedPlan}</p>
          </div>
          <p style={{ color: c.lime, fontWeight: '700' }}>
            {user.requestedPlan === 'starter' ? 'R950/mo' : user.requestedPlan === 'growth' ? 'R2,450/mo' : 'Custom'}
          </p>
        </div>
      )}
      {error && <p style={{ color: c.red, fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
      <p style={{ color: c.muted, fontSize: '12px', marginBottom: '6px' }}>Role</p>
      <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#1C1C19', border: '1px solid ' + c.borderDim, color: c.text, fontSize: '14px', marginBottom: '14px', outline: 'none', fontFamily: 'inherit' }}>
        <option value="agent">agent — Rental agent (tenant)</option>
        <option value="admin">admin — Agency manager (tenant)</option>
        <option value="eb_agent">eb_agent — EB Sales agent</option>
        <option value="eb_manager">eb_manager — EB Manager</option>
        <option value="borrower">borrower — Pending</option>
      </select>
      <p style={{ color: c.muted, fontSize: '12px', marginBottom: '6px' }}>
        Assign to Client
        {user.tenantId && <span style={{ color: c.lime, marginLeft: '8px' }}>· Pre-filled from invite</span>}
      </p>
      <select value={tenantId} onChange={e => setTenantId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#1C1C19', border: '1px solid ' + c.borderDim, color: c.text, fontSize: '14px', marginBottom: '20px', outline: 'none', fontFamily: 'inherit' }}>
        <option value="">Platform level (EB staff — no tenant)</option>
        {tenants.map(t => <option key={t._id} value={t._id}>{t.businessName} ({t.plan} · {t.status})</option>)}
      </select>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '11px 22px', background: 'transparent', border: '1px solid ' + c.borderDim, color: c.muted, borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        <button onClick={handleApprove} disabled={saving} style={{ padding: '11px 24px', background: c.lime, color: '#050505', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
          {saving ? 'Approving...' : 'Approve Access'}
        </button>
      </div>
    </div>
  );
}