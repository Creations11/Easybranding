import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const colors = {
  lime: '#a3e635',
  emerald: '#34d399',
  text: '#f5f5f0',
  muted: '#a1a1aa',
  card: '#121210',
  border: 'rgba(163,230,53,0.22)',
};

const statusConfig = {
  awaiting_menu: { label: 'Awaiting Reply', color: '#eab308', bg: 'rgba(234,179,8,0.15)' },
  escalated: { label: 'Escalated', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  closed: { label: 'Closed', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  active: { label: 'Active', color: colors.lime, bg: 'rgba(163,230,53,0.15)' },
};

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/leads')
      .then(res => {
        setLeads(res.data.data?.leads || res.data.data || []);
      })
      .catch(() => setError('Failed to load leads'))
      .finally(() => setLoading(false));
  }, []);

  const getStatusStyle = (status) => statusConfig[status] || { label: status, color: '#888', bg: '#222' };

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: colors.text, padding: '100px 40px 80px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '48px', fontWeight: '900' }}>Operations Center</h1>
            <p style={{ color: colors.muted, fontSize: '20px' }}>Live WhatsApp Leads & Conversations</p>
          </div>
          <button onClick={() => navigate('/')} style={{ color: colors.muted, background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>← Back to Home</button>
        </div>

        {loading && <p>Loading leads...</p>}
        {error && <p style={{ color: '#ef4444' }}>{error}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '32px' }}>
          {/* Leads List */}
          <div style={{ background: colors.card, borderRadius: '24px', padding: '24px', border: `1px solid ${colors.border}` }}>
            <h3 style={{ marginBottom: '20px' }}>Recent Leads ({leads.length})</h3>
            {leads.length === 0 ? (
              <p>No leads yet. Send a WhatsApp message to start.</p>
            ) : (
              leads.map(lead => {
                const status = getStatusStyle(lead.workflowStatus);
                return (
                  <div
                    key={lead._id}
                    onClick={() => setSelectedLead(lead)}
                    style={{
                      padding: '18px',
                      marginBottom: '12px',
                      background: selectedLead?._id === lead._id ? '#1C1C19' : '#0F0F0D',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      border: selectedLead?._id === lead._id ? `2px solid ${colors.lime}` : '1px solid transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{lead.phone}</strong>
                      <span style={{ color: status.color, fontSize: '13px', fontWeight: '600' }}>{status.label}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: colors.muted, marginTop: '4px' }}>
                      {lead.lastMessageAt ? new Date(lead.lastMessageAt).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Conversation View */}
          <div style={{ background: colors.card, borderRadius: '24px', padding: '32px', border: `1px solid ${colors.border}` }}>
            {selectedLead ? (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <h3>Conversation with {selectedLead.phone}</h3>
                  <div style={{ display: 'inline-block', padding: '6px 16px', background: getStatusStyle(selectedLead.workflowStatus).bg, color: getStatusStyle(selectedLead.workflowStatus).color, borderRadius: '999px', fontSize: '14px', marginTop: '8px' }}>
                    {getStatusStyle(selectedLead.workflowStatus).label}
                  </div>
                </div>

                <div style={{ height: '420px', background: '#0A0A08', borderRadius: '16px', padding: '20px', overflowY: 'auto', marginBottom: '20px' }}>
                  <p style={{ color: colors.muted, textAlign: 'center', marginTop: '100px' }}>
                    Conversation history will appear here once the backend endpoint is connected.<br />
                    Current status: <strong>{selectedLead.workflowStatus}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <input type="text" placeholder="Type reply as agent..." style={{ flex: 1, padding: '16px', background: '#1C1C19', border: `1px solid ${colors.border}`, borderRadius: '999px', color: colors.text }} />
                  <button style={{ padding: '0 32px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '999px', fontWeight: '700' }}>Send Reply</button>
                </div>
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.muted, textAlign: 'center' }}>
                Select a lead from the left to view conversation
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}