// src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const colors = {
  lime:    '#a3e635',
  emerald: '#34d399',
  red:     '#f87171',
  amber:   '#fbbf24',
  text:    '#f5f5f0',
  muted:   '#a1a1aa',
  card:    '#121210',
  surface: '#0A0A08',
  border:  'rgba(163,230,53,0.22)',
  borderDim: 'rgba(255,255,255,0.08)',
};

const STATUS_COLORS = {
  qualified:                 '#a3e635',
  not_qualified:             '#f87171',
  taken_over:                '#f97316',
  capture_name:              '#22d3ee',
  capture_property_interest: '#22d3ee',
  capture_budget:            '#22d3ee',
  capture_move_in_date:      '#22d3ee',
  capture_employment_type:   '#22d3ee',
  capture_monthly_income:    '#22d3ee',
  awaiting_menu:             '#fbbf24',
  closed:                    '#a1a1aa',
};

export default function Dashboard() {
  const [leads,        setLeads]        = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [timeline,     setTimeline]     = useState([]);
  const [message,      setMessage]      = useState('');
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingChat,  setLoadingChat]  = useState(false);
  const [sending,      setSending]      = useState(false);
  const [takingOver,   setTakingOver]   = useState(false);
  const [resuming,     setResuming]     = useState(false);
  const [actionMsg,    setActionMsg]    = useState('');
  const [error,        setError]        = useState('');
  const bottomRef = useRef(null);
  const navigate  = useNavigate();

  // Load leads list
  useEffect(() => {
    api.get('/leads')
      .then(res => setLeads(res.data.data?.leads || []))
      .catch(() => setError('Failed to load leads'))
      .finally(() => setLoadingLeads(false));
  }, []);

  // Load timeline when lead selected
  useEffect(() => {
    if (!selectedLead) return;
    setLoadingChat(true);
    setTimeline([]);
    api.get(`/admin-ops/leads/${selectedLead._id}/timeline`)
      .then(res => setTimeline(res.data.data?.timeline || []))
      .catch(() => setTimeline([]))
      .finally(() => setLoadingChat(false));
  }, [selectedLead]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline]);

  const refreshLead = async () => {
    const res = await api.get('/leads');
    const updated = res.data.data?.leads || [];
    setLeads(updated);
    if (selectedLead) {
      const fresh = updated.find(l => l._id === selectedLead._id);
      if (fresh) setSelectedLead(fresh);
    }
  };

  const handleTakeover = async () => {
    setTakingOver(true);
    setActionMsg('');
    try {
      await api.post(`/admin-ops/leads/${selectedLead._id}/takeover`);
      setActionMsg('✅ Conversation taken over — bot paused');
      await refreshLead();
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Takeover failed'}`);
    } finally {
      setTakingOver(false);
    }
  };

  const handleResume = async () => {
    setResuming(true);
    setActionMsg('');
    try {
      await api.post(`/admin-ops/leads/${selectedLead._id}/resume`, {
        resumeAtStage: selectedLead.previousWorkflowStatus || 'awaiting_menu',
      });
      setActionMsg('✅ Automation resumed — bot active');
      await refreshLead();
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Resume failed'}`);
    } finally {
      setResuming(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setActionMsg('');
    try {
      await api.post(`/admin-ops/leads/${selectedLead._id}/message`, { message: message.trim() });
      setMessage('');
      // Reload timeline
      const res = await api.get(`/admin-ops/leads/${selectedLead._id}/timeline`);
      setTimeline(res.data.data?.timeline || []);
      setActionMsg('✅ Message sent');
      setTimeout(() => setActionMsg(''), 2000);
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Send failed'}`);
    } finally {
      setSending(false);
    }
  };

  const isTakenOver = selectedLead?.workflowStatus === 'taken_over';

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: colors.text, padding: '100px 40px 80px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '48px', fontWeight: '900' }}>Operations Center</h1>
            <p style={{ color: colors.muted, fontSize: '20px' }}>Live WhatsApp Leads & Conversations</p>
          </div>
          <button onClick={() => navigate('/')} style={{ color: colors.muted, background: 'none', border: 'none', cursor: 'pointer' }}>← Home</button>
        </div>

        {loadingLeads && <p style={{ color: colors.muted }}>Loading leads...</p>}
        {error && <p style={{ color: colors.red }}>{error}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>

          {/* ── Leads List ─────────────────────────────────── */}
          <div style={{ background: colors.card, borderRadius: '24px', padding: '24px', border: `1px solid ${colors.border}`, height: 'fit-content' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Recent Leads ({leads.length})</h3>
            {leads.length === 0 && !loadingLeads && (
              <p style={{ color: colors.muted, textAlign: 'center', padding: '40px 0', fontSize: '14px' }}>
                No leads yet.
              </p>
            )}
            {leads.map(lead => (
              <div
                key={lead._id}
                onClick={() => { setSelectedLead(lead); setActionMsg(''); }}
                style={{
                  padding: '16px',
                  marginBottom: '10px',
                  background: selectedLead?._id === lead._id ? '#1C1C19' : '#0F0F0D',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  border: selectedLead?._id === lead._id ? `2px solid ${colors.lime}` : `1px solid ${colors.borderDim}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '15px' }}>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                  {lead.workflowStatus === 'taken_over' && (
                    <span style={{ fontSize: '10px', background: '#f9731622', color: '#f97316', padding: '2px 8px', borderRadius: '999px' }}>TAKEN OVER</span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: colors.muted, marginTop: '2px' }}>{lead.phone}</div>
                <div style={{ marginTop: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: `${STATUS_COLORS[lead.workflowStatus] || colors.muted}22`,
                    color: STATUS_COLORS[lead.workflowStatus] || colors.muted,
                    fontWeight: '600',
                  }}>
                    {lead.workflowStatus?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Conversation Panel ──────────────────────────── */}
          <div style={{ background: colors.card, borderRadius: '24px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
            {selectedLead ? (
              <>
                {/* Lead header */}
                <div style={{ padding: '24px 28px', borderBottom: `1px solid ${colors.borderDim}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ marginBottom: '2px' }}>{selectedLead.name !== 'Unknown' ? selectedLead.name : selectedLead.phone}</h3>
                      <p style={{ color: colors.muted, fontSize: '13px' }}>{selectedLead.phone}</p>
                      {selectedLead.propertyInterest && (
                        <p style={{ color: colors.muted, fontSize: '12px', marginTop: '4px' }}>
                          {selectedLead.propertyInterest}
                          {selectedLead.monthlyBudget ? ` · R${selectedLead.monthlyBudget}/mo` : ''}
                          {selectedLead.moveInDate ? ` · ${selectedLead.moveInDate}` : ''}
                          {selectedLead.employmentType ? ` · ${selectedLead.employmentType}` : ''}
                          {selectedLead.monthlyIncome ? ` · R${selectedLead.monthlyIncome} income` : ''}
                        </p>
                      )}
                    </div>

                    {/* Bot status + controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '12px',
                        padding: '6px 14px',
                        borderRadius: '999px',
                        background: isTakenOver ? '#f9731622' : '#a3e63522',
                        color: isTakenOver ? '#f97316' : colors.lime,
                        fontWeight: '600',
                      }}>
                        {isTakenOver ? '🟡 Bot Paused' : '🟢 Bot Active'}
                      </span>

                      {!isTakenOver ? (
                        <button
                          onClick={handleTakeover}
                          disabled={takingOver}
                          style={{
                            padding: '8px 18px',
                            background: 'rgba(249,115,22,0.15)',
                            color: '#f97316',
                            border: '1px solid rgba(249,115,22,0.3)',
                            borderRadius: '10px',
                            cursor: takingOver ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            opacity: takingOver ? 0.6 : 1,
                          }}
                        >
                          {takingOver ? 'Taking over...' : 'Take Over'}
                        </button>
                      ) : (
                        <button
                          onClick={handleResume}
                          disabled={resuming}
                          style={{
                            padding: '8px 18px',
                            background: 'rgba(163,230,53,0.15)',
                            color: colors.lime,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '10px',
                            cursor: resuming ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            opacity: resuming ? 0.6 : 1,
                          }}
                        >
                          {resuming ? 'Resuming...' : 'Resume Bot'}
                        </button>
                      )}
                    </div>
                  </div>

                  {actionMsg && (
                    <p style={{ marginTop: '10px', fontSize: '13px', color: actionMsg.startsWith('✅') ? colors.lime : colors.red }}>
                      {actionMsg}
                    </p>
                  )}
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '300px', maxHeight: '420px' }}>
                  {loadingChat ? (
                    <p style={{ color: colors.muted, textAlign: 'center', marginTop: '60px' }}>Loading conversation...</p>
                  ) : timeline.length === 0 ? (
                    <p style={{ color: colors.muted, textAlign: 'center', marginTop: '60px' }}>No messages yet.</p>
                  ) : (
                    timeline.map((msg, i) => (
                      <div key={i} style={{ alignSelf: msg.direction === 'outbound' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: msg.direction === 'outbound' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: msg.direction === 'outbound' ? colors.lime : '#1C1C19',
                          color: msg.direction === 'outbound' ? '#050505' : colors.text,
                          fontSize: '14px',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap',
                        }}>
                          {msg.body}
                        </div>
                        <div style={{ fontSize: '11px', color: colors.muted, marginTop: '4px', textAlign: msg.direction === 'outbound' ? 'right' : 'left' }}>
                          {new Date(msg.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                          {msg.manual && <span style={{ marginLeft: '6px', color: '#f97316' }}>· manual</span>}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Message input — only when taken over */}
                <div style={{ padding: '20px 28px', borderTop: `1px solid ${colors.borderDim}` }}>
                  {isTakenOver ? (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Type a message to send via WhatsApp..."
                        style={{
                          flex: 1,
                          padding: '14px 18px',
                          borderRadius: '999px',
                          background: '#1C1C19',
                          border: `1px solid ${colors.border}`,
                          color: colors.text,
                          fontSize: '14px',
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={handleSend}
                        disabled={sending || !message.trim()}
                        style={{
                          padding: '14px 28px',
                          background: sending || !message.trim() ? 'rgba(163,230,53,0.3)' : colors.lime,
                          color: '#050505',
                          border: 'none',
                          borderRadius: '999px',
                          fontWeight: '700',
                          cursor: sending || !message.trim() ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        {sending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  ) : (
                    <p style={{ color: colors.muted, fontSize: '13px', textAlign: 'center' }}>
                      Click <strong style={{ color: '#f97316' }}>Take Over</strong> to send manual messages and pause the bot.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.muted }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '48px', marginBottom: '16px' }}>💬</p>
                  <p style={{ fontSize: '18px' }}>Select a lead to view conversation</p>
                  <p style={{ fontSize: '13px', marginTop: '8px' }}>Take over to send manual messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}