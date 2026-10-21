import { useState } from 'react';
import api from '../../api';
import Button from '../ui/Button';
import { Input } from '../ui/Field';

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

  const field = 'mb-2.5 bg-white/4';

  return (
    <div className="mt-4 rounded-[14px] border border-edge-live bg-ground p-5">
      <h4 className="mb-3.5 text-sm font-bold text-lime">📅 Schedule Viewing</h4>
      {error && <p className="mb-2.5 text-[13px] text-red">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="Viewing date" className={field} />
        <Input type="time" value={time} onChange={e => setTime(e.target.value)} aria-label="Viewing time" className={field} />
      </div>
      <Input mono={false} type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Property address (optional)" className={field} />
      <Input mono={false} type="text" value={agent}   onChange={e => setAgent(e.target.value)}   placeholder="Assign to agent (optional)"  className="mb-3.5 bg-white/4" />
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant="primary" className="flex-[2]" onClick={handleSave} disabled={saving}>
          {saving ? 'Scheduling...' : 'Confirm Viewing'}
        </Button>
      </div>
    </div>
  );
}
