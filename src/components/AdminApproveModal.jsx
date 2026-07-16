// src/components/AdminApproveModal.jsx
// Extracted from AdminDashboard.jsx. Deliberately NOT named ApproveModal.jsx
// (or merged with it) — that file already exists and is a genuinely
// different component used by SuperAdminDashboard.jsx: 5 role options
// (agent/admin/eb_agent/eb_manager/borrower) vs. this one's 3
// (agent/admin/borrower — correct here since eb_agent/eb_manager are
// platform-staff roles that don't apply in this tenant-scoped context),
// and that one expects its parent to supply the overlay wrapper, while
// this one renders its own. Overwriting it would have broken
// SuperAdminDashboard.jsx.
import { useState } from 'react';
import api from '../api';
import { colors } from '../utils/theme';

export default function AdminApproveModal({ user, tenants, onClose, onApproved }) {
  const [role,     setRole]     = useState('agent');
  const [tenantId, setTenantId] = useState(user.tenantId || '');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const PLAN_COLORS = { starter: '#7A9E6E', growth: '#B8F040', enterprise: '#C4873A' };

  const handleApprove = async () => {
    setSaving(true);
    try {
      await api.post(`/users/${user._id}/approve`, {
        role,
        tenantId: tenantId || null,
      });
      onApproved();
    } catch (err) {
      setError(err.response?.data?.message || 'Approval failed');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ width: '100%', maxWidth: '460px', background: colors.surface, borderRadius: '24px', border: `1px solid ${colors.border}`, padding: '32px' }}>
        <h3 style={{ color: colors.lime, marginBottom: '8px' }}>Approve User</h3>
        <p style={{ color: colors.muted, fontSize: '14px', marginBottom: '4px' }}>{user.fullName} · {user.email}</p>
        <p style={{ color: colors.muted, fontSize: '12px', marginBottom: user.requestedPlan ? '12px' : '24px' }}>
          Registered {new Date(user.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>

        {/* Show requested plan prominently */}
        {user.requestedPlan && (
          <div style={{ background: `${PLAN_COLORS[user.requestedPlan] || colors.lime}12`, border: `1px solid ${PLAN_COLORS[user.requestedPlan] || colors.lime}33`, borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: colors.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Requested plan</p>
              <p style={{ color: PLAN_COLORS[user.requestedPlan] || colors.lime, fontWeight: '700', fontSize: '15px', textTransform: 'capitalize' }}>{user.requestedPlan}</p>
            </div>
            <p style={{ color: PLAN_COLORS[user.requestedPlan] || colors.lime, fontSize: '14px', fontWeight: '600' }}>
              {user.requestedPlan === 'starter' ? 'R950/mo' : user.requestedPlan === 'growth' ? 'R2,450/mo' : 'Custom'}
            </p>
          </div>
        )}

        {error && <p style={{ color: colors.red, fontSize: '14px', marginBottom: '12px' }}>{error}</p>}

        <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>Assign Role</p>
        <select value={role} onChange={e => setRole(e.target.value)}
          style={{ width: '100%', padding: '13px', borderRadius: '12px', background: '#1C1C19', border: `1px solid ${colors.borderDim}`, color: colors.text, fontSize: '14px', marginBottom: '16px', outline: 'none' }}>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
          <option value="borrower">Borrower (pending)</option>
        </select>

        <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>
          Assign to Client
          {user.tenantId && <span style={{ color: colors.lime, marginLeft: '8px' }}>· Pre-filled from invite link</span>}
        </p>
        <select value={tenantId} onChange={e => setTenantId(e.target.value)}
          style={{ width: '100%', padding: '13px', borderRadius: '12px', background: '#1C1C19', border: `1px solid ${colors.borderDim}`, color: colors.text, fontSize: '14px', marginBottom: '24px', outline: 'none' }}>
          <option value="">Platform level (no tenant)</option>
          {tenants.map(t => (
            <option key={t._id} value={t._id}>
              {t.businessName} ({t.plan} · {t.status})
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '12px 24px', background: 'transparent', border: `1px solid ${colors.borderDim}`, color: colors.muted, borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleApprove} disabled={saving} style={{ padding: '12px 28px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Approving...' : 'Approve Access'}
          </button>
        </div>
      </div>
    </div>
  );
}
