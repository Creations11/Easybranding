// src/components/AgentManager.jsx
// Standalone component for managing a tenant's authorized agents
// (tenant.agentPhones) — agents who can text Command Centre
// commands (LEADS, TAKEOVER, etc.) directly to the business
// WhatsApp number from their own personal phone.
//
// FIX APPLIED (26 June 2026):
// Originally wrote directly to tenant.agentPhones via PUT
// /tenants/:id — meaning a typo'd phone number would silently grant
// a stranger full Command Centre access immediately. Now calls the
// dedicated invite endpoint, matching the WhatsApp ADDAGENT
// command's confirmation flow exactly: a pending invite is created
// and the new number gets a WhatsApp message asking them to reply
// YES. They only appear in the confirmed agent list after that.
//
// Usage: <AgentManager tenantId={tenant._id} />
import { useState, useEffect } from 'react';
import api from '../api';

const c = {
  card: '#121710', lime: '#B8F040', muted: '#8A9080',
  text: '#EEF0E8', borderDim: 'rgba(255,255,255,0.06)',
  red: '#f87171', emerald: '#34d399', amber: '#fbbf24',
};

export default function AgentManager({ tenantId }) {
  const [agents, setAgents] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [tenantRes, invitesRes] = await Promise.all([
        api.get(`/tenants/${tenantId}`),
        api.get(`/tenants/${tenantId}/agent-invites`),
      ]);
      setAgents(tenantRes.data.data?.tenant?.agentPhones || []);
      setPendingInvites(invitesRes.data.data?.invites || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) loadData();
  }, [tenantId]);

  const handleInvite = async () => {
    setError('');
    setSuccess('');

    const trimmedName = newName.trim();
    if (!trimmedName || !newPhone.trim()) {
      setError('Please enter both a name and phone number.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post(`/tenants/${tenantId}/agent-invites`, { name: trimmedName, phone: newPhone });
      setSuccess(res.data.message || `Invite sent to ${trimmedName}.`);
      setNewName('');
      setNewPhone('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send invite');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelInvite = async (inviteId) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/tenants/${tenantId}/agent-invites/${inviteId}`);
      setSuccess('Invite cancelled.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel invite');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAgent = async (phoneToRemove) => {
    setError('');
    setSuccess('');
    const updatedAgents = agents.filter(a => a.phone !== phoneToRemove);

    setSaving(true);
    try {
      await api.put(`/tenants/${tenantId}`, { agentPhones: updatedAgents });
      setAgents(updatedAgents);
      setSuccess('Agent removed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove agent');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '10px',
    background: '#0D110C',
    border: `1px solid ${c.borderDim}`,
    color: c.text,
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    minWidth: '120px',
  };

  return (
    <div style={{ background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '16px', padding: '24px' }}>
      <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px', color: c.text }}>
        👤 Authorized Agents
      </h3>
      <p style={{ color: c.muted, fontSize: '13px', marginBottom: '20px' }}>
        Agents can text commands (LEADS, TAKEOVER, etc.) directly to your business WhatsApp number from their own phone, once they confirm.
      </p>

      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: `1px solid ${c.red}33`, borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', color: c.red, fontSize: '13px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(52,211,153,0.1)', border: `1px solid ${c.emerald}33`, borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', color: c.emerald, fontSize: '13px' }}>
          {success}
        </div>
      )}

      {/* Invite agent form */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Agent name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={inputStyle}
        />
        <input
          type="tel"
          placeholder="Phone number"
          value={newPhone}
          onChange={e => setNewPhone(e.target.value)}
          style={inputStyle}
        />
        <button
          onClick={handleInvite}
          disabled={saving}
          style={{
            padding: '10px 20px',
            background: c.lime,
            color: '#06080A',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {saving ? 'Sending...' : '📨 Send Invite'}
        </button>
      </div>

      {loading ? (
        <p style={{ color: c.muted, fontSize: '14px' }}>Loading...</p>
      ) : (
        <>
          {/* Pending invites */}
          {pendingInvites.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: c.amber, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Pending confirmation
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendingInvites.map(invite => (
                  <div
                    key={invite._id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: '10px',
                      background: `${c.amber}0c`, border: `1px solid ${c.amber}22`,
                    }}
                  >
                    <div>
                      <p style={{ color: c.text, fontWeight: '600', fontSize: '14px', margin: 0 }}>{invite.name}</p>
                      <p style={{ color: c.muted, fontSize: '12px', margin: '2px 0 0', fontFamily: 'monospace' }}>
                        {invite.phone} · awaiting YES
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelInvite(invite._id)}
                      disabled={saving}
                      style={{
                        background: 'transparent', border: `1px solid ${c.red}44`, color: c.red,
                        borderRadius: '8px', padding: '6px 12px', fontSize: '12px',
                        cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmed agents */}
          {agents.length === 0 ? (
            <p style={{ color: c.muted, fontSize: '14px' }}>No confirmed agents yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {agents.map((agent, i) => (
                <div
                  key={agent.phone}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', borderRadius: '10px',
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  }}
                >
                  <div>
                    <p style={{ color: c.text, fontWeight: '600', fontSize: '14px', margin: 0 }}>{agent.name || 'Unnamed'}</p>
                    <p style={{ color: c.muted, fontSize: '12px', margin: '2px 0 0', fontFamily: 'monospace' }}>{agent.phone}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveAgent(agent.phone)}
                    disabled={saving}
                    style={{
                      background: 'transparent', border: `1px solid ${c.red}44`, color: c.red,
                      borderRadius: '8px', padding: '6px 12px', fontSize: '12px',
                      cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <p style={{ color: c.muted, fontSize: '12px', marginTop: '16px', fontStyle: 'italic' }}>
        Agents can also be invited directly via WhatsApp: ADDAGENT [Name] [Phone] (owner only)
      </p>
    </div>
  );
}