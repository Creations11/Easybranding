// src/components/BulkClientActions.jsx
import { useState } from 'react';
import api from '../api';

const c = {
  surface: '#0D110C', lime: '#B8F040', cyan: '#22d3ee',
  amber: '#fbbf24', red: '#f87171', text: '#EEF0E8',
  muted: '#8A9080', border: 'rgba(184,240,64,0.12)',
  borderDim: 'rgba(255,255,255,0.06)',
};

export default function BulkClientActions({ selectedIds, tenants, onAction, onClose }) {
  const [action, setAction] = useState('suspend');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedTenants = tenants.filter(t => selectedIds.includes(t._id));
  const activeCount = selectedTenants.filter(t => t.status === 'active').length;
  const suspendedCount = selectedTenants.filter(t => t.status === 'suspended').length;

  const handleApply = async () => {
    if (!selectedIds.length) return;
    setLoading(true);
    setError('');

    try {
      if (action === 'delete') {
        if (!confirm('Delete ' + selectedIds.length + ' clients? This cannot be undone.')) {
          setLoading(false);
          return;
        }
        for (const id of selectedIds) {
          await api.delete('/tenants/' + id).catch(() => {});
        }
      } else {
        const newStatus = action === 'suspend' ? 'suspended' : 'active';
        for (const id of selectedIds) {
          await api.put('/tenants/' + id, { status: newStatus }).catch(() => {});
        }
      }
      onAction();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440, background: c.surface, borderRadius: 20, border: '1px solid ' + c.border, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 900, color: c.lime }}>Bulk Actions</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        <p style={{ color: c.muted, fontSize: 14, marginBottom: 16 }}>
          {selectedIds.length} client{selectedIds.length !== 1 ? 's' : ''} selected
          {activeCount > 0 && <span style={{ color: c.lime }}> · {activeCount} active</span>}
          {suspendedCount > 0 && <span style={{ color: c.amber }}> · {suspendedCount} suspended</span>}
        </p>

        {error && <div style={{ background: c.red + '18', border: '1px solid ' + c.red + '33', borderRadius: 10, padding: '10px 14px', color: c.red, fontSize: 13, marginBottom: 14 }}>{error}</div>}

        <p style={{ color: c.muted, fontSize: 12, marginBottom: 6 }}>Action</p>
        <select value={action} onChange={e => setAction(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, background: '#1C1C19', border: '1px solid ' + c.borderDim, color: c.text, fontSize: 14, marginBottom: 20, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          <option value="suspend">⏸ Suspend all selected</option>
          <option value="activate">▶ Activate all selected</option>
          <option value="delete">🗑 Delete all selected</option>
        </select>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '11px 20px', background: 'transparent', border: '1px solid ' + c.borderDim, color: c.muted, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleApply} disabled={loading} style={{ padding: '11px 24px', background: action === 'delete' ? c.red : c.lime, color: action === 'delete' ? '#fff' : '#050505', border: 'none', borderRadius: 10, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}>
            {loading ? 'Applying...' : 'Apply to ' + selectedIds.length + ' client' + (selectedIds.length !== 1 ? 's' : '')}
          </button>
        </div>
      </div>
    </div>
  );
}