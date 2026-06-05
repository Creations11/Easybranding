// src/components/LeadDetailModal.jsx
// ─────────────────────────────────────────────────────────────
// Full lead detail modal for admin dashboard.
// Shows conversation history + all operator controls.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import api from '../api';

const t = {
  lime:      '#B8F040',
  emerald:   '#34d399',
  amber:     '#fbbf24',
  red:       '#f87171',
  orange:    '#f97316',
  cyan:      '#22d3ee',
  text:      '#EEF0E8',
  muted:     '#8A9080',
  card:      '#121210',
  surface:   '#0A0A08',
  border:    'rgba(184,240,64,0.15)',
  borderDim: 'rgba(255,255,255,0.06)',
};

const STATUS_COLORS = {
  qualified:                 t.lime,
  not_qualified:             t.red,
  taken_over:                t.orange,
  capture_name:              t.cyan,
  capture_property_interest: t.cyan,
  capture_budget:            t.cyan,
  capture_move_in_date:      t.cyan,
  capture_employment_type:   t.cyan,
  capture_monthly_income:    t.cyan,
  awaiting_menu:             t.amber,
  closed:                    t.muted,
};

function ViewingScheduler({ lead, onScheduled, onClose }) {
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

export default function LeadDetailModal({ leadId, onClose, onUpdate }) {
  const [lead,          setLead]          = useState(null);
  const [timeline,      setTimeline]      = useState([]);
  const [takeoverHistory, setTakeoverHistory] = useState([]);
  const [message,       setMessage]       = useState('');
  const [activeTab,     setActiveTab]     = useState('conversation');
  const [showViewing,   setShowViewing]   = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [actionMsg,     setActionMsg]     = useState('');
  const bottomRef = useRef(null);

  const load = async () => {
    try {
      const [timelineRes, historyRes] = await Promise.all([
        api.get(`/admin-ops/leads/${leadId}/timeline`),
        api.get(`/takeover/${leadId}/history`),
      ]);
      setLead(timelineRes.data.data?.lead);
      setTimeline(timelineRes.data.data?.timeline || []);
      setTakeoverHistory(historyRes.data.data?.takeoverHistory || []);
    } catch (err) {
      console.error('Lead detail load error', err);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [leadId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [timeline]);

  const doAction = async (action, payload = {}, successMsg) => {
    setActionLoading(action); setActionMsg('');
    try {
      await api.post(`/admin-ops/leads/${leadId}/${action}`, payload);
      setActionMsg(`✅ ${successMsg}`);
      await load();
      if (onUpdate) onUpdate();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Action failed'}`);
    } finally { setActionLoading(''); }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setActionLoading('message'); setActionMsg('');
    try {
      await api.post(`/admin-ops/leads/${leadId}/message`, { message: message.trim() });
      setMessage('');
      setActionMsg('✅ Message sent');
      await load();
      setTimeout(() => setActionMsg(''), 2000);
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Send failed'}`);
    } finally { setActionLoading(''); }
  };

  const isTakenOver = lead?.workflowStatus === 'taken_over';
  const isQualified = lead?.workflowStatus === 'qualified';
  const isClosed    = lead?.workflowStatus === 'closed';

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <p style={{ color: t.muted }}>Loading...</p>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '780px', maxHeight: '92vh', background: t.card, borderRadius: '24px', border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.borderDim}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{lead?.name !== 'Unknown' ? lead?.name : lead?.phone}</h3>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${STATUS_COLORS[lead?.workflowStatus] || t.muted}18`, color: STATUS_COLORS[lead?.workflowStatus] || t.muted, fontWeight: '600' }}>
                {lead?.workflowStatus?.replace(/_/g, ' ')}
              </span>
              {isTakenOver && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${t.orange}18`, color: t.orange }}>🟡 Bot Paused</span>}
              {!isTakenOver && !isClosed && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${t.lime}18`, color: t.lime }}>🟢 Bot Active</span>}
            </div>
            <p style={{ color: t.muted, fontSize: '13px' }}>
              {lead?.phone}
              {lead?.propertyInterest ? ` · ${lead.propertyInterest}` : ''}
              {lead?.monthlyBudget ? ` · R${lead.monthlyBudget}/mo` : ''}
              {lead?.moveInDate ? ` · ${lead.moveInDate}` : ''}
              {lead?.monthlyIncome ? ` · R${lead.monthlyIncome} income` : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ fontSize: '24px', background: 'none', border: 'none', color: t.muted, cursor: 'pointer', padding: '4px' }}>×</button>
        </div>

        {/* Operator controls */}
        {!isClosed && (
          <div style={{ padding: '12px 24px', borderBottom: `1px solid ${t.borderDim}`, display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {!isTakenOver ? (
              <button onClick={() => doAction('takeover', { reason: 'Admin intervention' }, 'Conversation taken over')} disabled={actionLoading === 'takeover'}
                style={{ padding: '8px 16px', background: `${t.orange}18`, color: t.orange, border: `1px solid ${t.orange}33`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', opacity: actionLoading === 'takeover' ? 0.6 : 1 }}>
                {actionLoading === 'takeover' ? 'Taking over...' : '🎯 Take Over'}
              </button>
            ) : (
              <button onClick={() => doAction('resume', { resumeAtStage: lead?.previousWorkflowStatus || 'awaiting_menu' }, 'Automation resumed')} disabled={actionLoading === 'resume'}
                style={{ padding: '8px 16px', background: `${t.lime}18`, color: t.lime, border: `1px solid ${t.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', opacity: actionLoading === 'resume' ? 0.6 : 1 }}>
                {actionLoading === 'resume' ? 'Resuming...' : '▶ Resume Bot'}
              </button>
            )}
            {isQualified && !lead?.viewingRequested && (
              <button onClick={() => setShowViewing(v => !v)}
                style={{ padding: '8px 16px', background: `${t.emerald}18`, color: t.emerald, border: `1px solid ${t.emerald}33`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                📅 Schedule Viewing
              </button>
            )}
            {lead?.viewingRequested && (
              <span style={{ fontSize: '12px', padding: '8px 14px', background: `${t.emerald}18`, color: t.emerald, borderRadius: '8px' }}>✅ Viewing Scheduled</span>
            )}
            <button onClick={() => doAction('close', { reason: 'Closed by admin' }, 'Lead closed')} disabled={actionLoading === 'close'}
              style={{ padding: '8px 16px', background: `${t.red}18`, color: t.red, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', opacity: actionLoading === 'close' ? 0.6 : 1 }}>
              {actionLoading === 'close' ? 'Closing...' : '✕ Close Lead'}
            </button>
            {actionMsg && <span style={{ fontSize: '12px', color: actionMsg.startsWith('✅') ? t.lime : t.red, marginLeft: '4px' }}>{actionMsg}</span>}
          </div>
        )}

        {/* Viewing scheduler */}
        {showViewing && (
          <div style={{ padding: '0 24px' }}>
            <ViewingScheduler lead={lead} onScheduled={() => { setShowViewing(false); load(); if (onUpdate) onUpdate(); }} onClose={() => setShowViewing(false)} />
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', padding: '0 24px', borderBottom: `1px solid ${t.borderDim}` }}>
          {['conversation', 'details', 'history'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '10px 16px', background: 'none', border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${t.lime}` : '2px solid transparent',
              color: activeTab === tab ? t.lime : t.muted,
              cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab ? '600' : '400',
              textTransform: 'capitalize', marginBottom: '-1px',
            }}>{tab}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '200px' }}>

          {/* ── Conversation tab ─── */}
          {activeTab === 'conversation' && (
            timeline.length === 0 ? (
              <p style={{ color: t.muted, textAlign: 'center', marginTop: '40px' }}>No messages yet.</p>
            ) : timeline.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.direction === 'outbound' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                {msg.system ? (
                  <div style={{ textAlign: 'center', width: '100%', alignSelf: 'center' }}>
                    <span style={{ fontSize: '11px', color: t.muted, background: t.borderDim, padding: '3px 12px', borderRadius: '999px' }}>{msg.body.replace('[SYSTEM] ', '')}</span>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '10px 14px', borderRadius: msg.direction === 'outbound' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: msg.direction === 'outbound' ? '#005c4b' : '#1C1C19', color: t.text, fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {msg.body}
                    </div>
                    <div style={{ fontSize: '10px', color: t.muted, marginTop: '3px', textAlign: msg.direction === 'outbound' ? 'right' : 'left' }}>
                      {new Date(msg.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                      {msg.manual && <span style={{ marginLeft: '6px', color: t.orange }}>· manual</span>}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />

          {/* ── Details tab ─── */}
          {activeTab === 'details' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Phone',        value: lead?.phone },
                { label: 'Name',         value: lead?.name },
                { label: 'Property',     value: lead?.propertyInterest },
                { label: 'Budget',       value: lead?.monthlyBudget ? `R${lead.monthlyBudget}/mo` : null },
                { label: 'Move-in',      value: lead?.moveInDate },
                { label: 'Employment',   value: lead?.employmentType },
                { label: 'Income',       value: lead?.monthlyIncome ? `R${lead.monthlyIncome}/mo` : null },
                { label: 'Status',       value: lead?.workflowStatus?.replace(/_/g, ' ') },
                { label: 'Tenant',       value: lead?.tenantId || 'default' },
                { label: 'Created',      value: lead?.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-ZA') : null },
                { label: 'Last Message', value: lead?.lastMessageAt ? new Date(lead.lastMessageAt).toLocaleDateString('en-ZA') : null },
                { label: 'Assigned To',  value: lead?.assignedAgent },
              ].filter(item => item.value).map((item, i) => (
                <div key={i} style={{ background: t.surface, borderRadius: '10px', padding: '12px 14px' }}>
                  <p style={{ color: t.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{item.label}</p>
                  <p style={{ color: t.text, fontSize: '14px', fontWeight: '500' }}>{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── History tab ─── */}
          {activeTab === 'history' && (
            takeoverHistory.length === 0 ? (
              <p style={{ color: t.muted, textAlign: 'center', marginTop: '40px' }}>No takeover history.</p>
            ) : takeoverHistory.map((event, i) => (
              <div key={i} style={{ background: t.surface, borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '999px', background: event.action === 'takeover' ? `${t.orange}18` : `${t.lime}18`, color: event.action === 'takeover' ? t.orange : t.lime, fontWeight: '600', marginRight: '10px', textTransform: 'capitalize' }}>{event.action}</span>
                  {event.reason && <span style={{ color: t.muted, fontSize: '13px' }}>{event.reason}</span>}
                </div>
                <p style={{ color: t.muted, fontSize: '12px' }}>{new Date(event.timestamp).toLocaleString('en-ZA')}</p>
              </div>
            ))
          )}
        </div>

        {/* Message input — only when taken over */}
        {isTakenOver && !isClosed && (
          <div style={{ padding: '14px 24px', borderTop: `1px solid ${t.borderDim}`, display: 'flex', gap: '10px' }}>
            <input
              value={message} onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message to send via WhatsApp..."
              style={{ flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${t.borderDim}`, borderRadius: '999px', color: t.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
            />
            <button onClick={handleSend} disabled={actionLoading === 'message' || !message.trim()}
              style={{ padding: '12px 24px', background: !message.trim() || actionLoading === 'message' ? `${t.lime}44` : t.lime, color: '#080A06', border: 'none', borderRadius: '999px', fontWeight: '700', cursor: !message.trim() || actionLoading === 'message' ? 'not-allowed' : 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>
              {actionLoading === 'message' ? '...' : 'Send'}
            </button>
          </div>
        )}
        {!isTakenOver && !isClosed && (
          <div style={{ padding: '12px 24px', borderTop: `1px solid ${t.borderDim}` }}>
            <p style={{ color: t.muted, fontSize: '12px', textAlign: 'center' }}>
              Click <strong style={{ color: t.orange }}>Take Over</strong> to send manual messages and pause the bot.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}