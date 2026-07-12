// src/components/AgentManager.jsx
// Standalone component for viewing a tenant's authorized agents
// (tenant.agentPhones) — agents who can text Command Centre
// commands (LEADS, TAKEOVER, etc.) directly to the business
// WhatsApp number from their own personal phone.
//
// Adding an agent happens via the WhatsApp ADDAGENT command (owner
// only) — there is no HTTP invite endpoint wired up on the backend,
// so this component only reads/removes via the tenant record.
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const tenantRes = await api.get(`/tenants/${tenantId}`);
      setAgents(tenantRes.data.data?.tenant?.agentPhones || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) loadData();
  }, [tenantId]);

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

      <div style={{ background: `${c.amber}0c`, border: `1px solid ${c.amber}22`, borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
        <p style={{ color: c.amber, fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>To add an agent</p>
        <p style={{ color: c.muted, fontSize: '13px', fontFamily: 'monospace' }}>
          ADDAGENT [Name] [Phone] — sent from the owner's WhatsApp to the business number
        </p>
      </div>

      {loading ? (
        <p style={{ color: c.muted, fontSize: '14px' }}>Loading...</p>
      ) : (
        <>
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
    </div>
  );
}