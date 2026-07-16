// src/components/AssignModal.jsx
// Extracted from AdminDashboard.jsx — assigns a lead to a team agent.
import { useState } from 'react';
import api from '../api';
import { colors } from '../utils/theme';

export default function AssignModal({ lead, agents, onClose, onAssigned }) {
  const [selectedAgent, setSelectedAgent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleAssign = async () => {
    if (!selectedAgent) { setError('Please select an agent'); return; }
    setSaving(true);
    try {
      const agent = agents.find(a => a._id === selectedAgent);
      await api.post(`/admin-ops/leads/${lead._id}/assign`, { agentId: selectedAgent, agentName: agent?.fullName });
      onAssigned();
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment failed');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ width: '100%', maxWidth: '440px', background: colors.surface, borderRadius: '24px', border: `1px solid ${colors.border}`, padding: '32px' }}>
        <h3 style={{ color: colors.lime, marginBottom: '8px' }}>Assign Lead</h3>
        <p style={{ color: colors.muted, fontSize: '14px', marginBottom: '24px' }}>{lead.name !== 'Unknown' ? lead.name : lead.phone} · {lead.phone}</p>
        {error && <p style={{ color: colors.red, fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
        <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#1C1C19', border: `1px solid ${colors.borderDim}`, color: colors.text, fontSize: '15px', marginBottom: '24px' }}>
          <option value="">Select an agent...</option>
          {agents.map(a => <option key={a._id} value={a._id}>{a.fullName} ({a.role})</option>)}
        </select>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '12px 24px', background: 'transparent', border: `1px solid ${colors.borderDim}`, color: colors.muted, borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleAssign} disabled={saving} style={{ padding: '12px 28px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
