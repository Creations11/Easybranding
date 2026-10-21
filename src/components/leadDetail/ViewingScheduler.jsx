import { useState } from 'react';
import api from '../../api';
import { t } from './tokens';

export default function ViewingScheduler({ lead, onScheduled, onClose }) {
  const [date,    setDate]    = useState('');
  const [time,    setTime]    = useState('');
  const [address, setAddress] = useState('');
  const [agent,   setAgent]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const handleSave = async () => {
    if (!date || !time) { setError('Date and time are required'); return; }
    setSaving(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      await api.post(`/admin-ops/leads/${lead._id}/viewing`, {
        scheduledAt, agentName: agent, propertyAddress: address,
      });
      onScheduled();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule');
    } finally { setSaving(false); }
  };

  const iStyle = { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${t.borderDim}`, borderRadius: '10px', color: t.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', marginBottom: '10px' };

  return (
    <div style={{ marginTop: '16px', background: t.surface, borderRadius: '14px', padding: '20px', border: `1px solid ${t.border}` }}>
      <h4 style={{ color: t.lime, marginBottom: '14px', fontSize: '14px', fontWeight: '700' }}>📅 Schedule Viewing</h4>
      {error && <p style={{ color: t.red, fontSize: '13px', marginBottom: '10px' }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={iStyle} />
        <input type="time" value={time} onChange={e => setTime(e.target.value)} style={iStyle} />
      </div>
      <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Property address (optional)" style={iStyle} />
      <input type="text" value={agent}   onChange={e => setAgent(e.target.value)}   placeholder="Assign to agent (optional)"  style={{ ...iStyle, marginBottom: '14px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${t.borderDim}`, color: t.muted, borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px', background: t.lime, color: '#080A06', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Scheduling...' : 'Confirm Viewing'}
        </button>
      </div>
    </div>
  );
}
