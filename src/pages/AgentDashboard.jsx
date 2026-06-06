// src/pages/AgentDashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const colors = {
  lime:      '#a3e635',
  emerald:   '#34d399',
  cyan:      '#22d3ee',
  amber:     '#fbbf24',
  red:       '#f87171',
  orange:    '#f97316',
  text:      '#f5f5f0',
  muted:     '#a1a1aa',
  card:      '#121210',
  surface:   '#0A0A08',
  border:    'rgba(163,230,53,0.22)',
  borderDim: 'rgba(255,255,255,0.08)',
};

const STATUS_COLORS = {
  qualified:                 colors.lime,
  not_qualified:             colors.red,
  taken_over:                colors.orange,
  capture_name:              colors.cyan,
  capture_property_interest: colors.cyan,
  capture_budget:            colors.cyan,
  capture_move_in_date:      colors.cyan,
  capture_employment_type:   colors.cyan,
  capture_monthly_income:    colors.cyan,
  awaiting_menu:             colors.amber,
  closed:                    colors.muted,
};

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '24px 28px' }}>
      <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      <p style={{ fontSize: '40px', fontWeight: '800', color: color || colors.text, lineHeight: 1 }}>{value}</p>
    </div>
  );
}

// ── Viewing Scheduler Modal ───────────────────────────────────
function ViewingModal({ lead, onClose, onScheduled }) {
  const [date,     setDate]     = useState('');
  const [time,     setTime]     = useState('');
  const [address,  setAddress]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const handleSchedule = async () => {
    if (!date || !time) { setError('Date and time are required'); return; }
    setSaving(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      await api.post(`/agent/leads/${lead._id}/viewing`, {
        scheduledAt,
        propertyAddress: address,
        agentName: JSON.parse(localStorage.getItem('eb_user') || '{}').fullName || 'Agent',
      });
      onScheduled();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule viewing');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ width: '100%', maxWidth: '480px', background: colors.surface, borderRadius: '24px', border: `1px solid ${colors.border}`, padding: '32px' }}>
        <h3 style={{ color: colors.lime, marginBottom: '8px' }}>Schedule Viewing</h3>
        <p style={{ color: colors.muted, fontSize: '14px', marginBottom: '24px' }}>
          {lead.name} · {lead.phone} · {lead.propertyInterest || 'Property'}
        </p>
        {error && <p style={{ color: colors.red, marginBottom: '16px', fontSize: '14px' }}>{error}</p>}

        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#1C1C19', border: `1px solid ${colors.borderDim}`, color: colors.text, marginBottom: '12px', fontSize: '15px' }} />
        <input type="time" value={time} onChange={e => setTime(e.target.value)}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#1C1C19', border: `1px solid ${colors.borderDim}`, color: colors.text, marginBottom: '12px', fontSize: '15px' }} />
        <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Property address (optional)"
          style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#1C1C19', border: `1px solid ${colors.borderDim}`, color: colors.text, marginBottom: '24px', fontSize: '15px' }} />

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '12px 24px', background: 'transparent', border: `1px solid ${colors.borderDim}`, color: colors.muted, borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSchedule} disabled={saving} style={{ padding: '12px 28px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Scheduling...' : 'Confirm Viewing'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Agent Dashboard ──────────────────────────────────────
export default function AgentDashboard() {
  const [overview,     setOverview]     = useState(null);
  const [leads,        setLeads]        = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [timeline,     setTimeline]     = useState([]);
  const [viewings,     setViewings]     = useState([]);
  const [queue,        setQueue]        = useState(null);
  const [alerts,       setAlerts]       = useState([]);
  const [message,      setMessage]      = useState('');
  const [tab,          setTab]          = useState('leads');   // leads | viewings | queue | alerts
  const [loading,      setLoading]      = useState(true);
  const [loadingChat,  setLoadingChat]  = useState(false);
  const [sending,      setSending]      = useState(false);
  const [takingOver,   setTakingOver]   = useState(false);
  const [resuming,     setResuming]     = useState(false);
  const [viewingModal, setViewingModal] = useState(null);
  const [actionMsg,    setActionMsg]    = useState('');
  const bottomRef = useRef(null);
  const navigate  = useNavigate();
  const user      = (() => { try { return JSON.parse(localStorage.getItem('eb_user') || '{}'); } catch { return {}; } })();

  const loadData = async () => {
    try {
      const [ovRes, leadsRes, viewRes, queueRes, alertRes] = await Promise.all([
        api.get('/agent/overview'),
        api.get('/agent/leads'),
        api.get('/agent/viewings'),
        api.get('/agent/takeover-queue'),
        api.get('/admin-ops/alerts'),
      ]);
      setOverview(ovRes.data.data?.overview);
      setLeads(leadsRes.data.data?.leads || []);
      setViewings(viewRes.data.data?.viewings || []);
      setQueue(queueRes.data.data);
      setAlerts(alertRes.data.data?.alerts || []);
    } catch (err) {
      console.error('Failed to load agent data', err);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!selectedLead) return;
    setLoadingChat(true);
    api.get(`/agent/leads/${selectedLead._id}/conversation`)
      .then(res => setTimeline(res.data.data?.timeline || []))
      .catch(() => setTimeline([]))
      .finally(() => setLoadingChat(false));
  }, [selectedLead]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [timeline]);

  const handleTakeover = async () => {
    setTakingOver(true); setActionMsg('');
    try {
      await api.post(`/takeover/${selectedLead._id}/initiate`, {
        reason: 'Agent manual intervention',
        notifyLead: false,
      });
      setActionMsg('✅ Conversation taken over');
      await loadData();
      const fresh = (await api.get('/agent/leads')).data.data?.leads || [];
      const updated = fresh.find(l => l._id === selectedLead._id);
      if (updated) setSelectedLead(updated);
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Takeover failed'}`);
    } finally { setTakingOver(false); }
  };

  const handleResume = async () => {
    setResuming(true); setActionMsg('');
    try {
      await api.post(`/takeover/${selectedLead._id}/resume`, {
        resumeAtStage: selectedLead.previousWorkflowStatus || 'awaiting_menu',
        notifyLead: false,
      });
      setActionMsg('✅ Automation resumed');
      await loadData();
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Resume failed'}`);
    } finally { setResuming(false); }
  };

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true); setActionMsg('');
    try {
      await api.post(`/takeover/${selectedLead._id}/send`, { message: message.trim() });
      setMessage('');
      const res = await api.get(`/agent/leads/${selectedLead._id}/conversation`);
      setTimeline(res.data.data?.timeline || []);
      setActionMsg('✅ Sent');
      setTimeout(() => setActionMsg(''), 2000);
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Send failed'}`);
    } finally { setSending(false); }
  };

  const isTakenOver = selectedLead?.workflowStatus === 'taken_over';

  if (loading) return (
    <div style={{ padding: '140px', textAlign: 'center', color: colors.muted }}>
      Loading your workspace...
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: colors.text, padding: '100px 40px 80px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '44px', fontWeight: '900', marginBottom: '6px' }}>Agent Workspace</h1>
            <p style={{ color: colors.muted, fontSize: '18px' }}>Welcome, {user.fullName || 'Agent'}</p>
          </div>
          <button onClick={() => navigate('/')} style={{ color: colors.muted, background: 'none', border: 'none', cursor: 'pointer' }}>← Home</button>
        </div>

        {/* Stats */}
        {overview && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '40px' }}>
            <StatCard label="Assigned Leads"  value={overview.assignedTotal}    />
            <StatCard label="Active"          value={overview.assignedActive}   color={colors.cyan} />
            <StatCard label="Qualified"       value={overview.assignedQualified} color={colors.lime} />
            <StatCard label="In My Queue"     value={overview.takenOverByMe}    color={colors.orange} />
            <StatCard label="Viewings Set"    value={overview.viewingsScheduled} color={colors.emerald} />
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', borderBottom: `1px solid ${colors.borderDim}`, paddingBottom: '0' }}>
          {['leads', 'viewings', 'queue', 'alerts'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '12px 24px', background: 'none', border: 'none',
              borderBottom: tab === t ? `2px solid ${colors.lime}` : '2px solid transparent',
              color: tab === t ? colors.lime : colors.muted,
              cursor: 'pointer', fontSize: '15px', fontWeight: tab === t ? '600' : '400',
              textTransform: 'capitalize', marginBottom: '-1px',
            }}>
              {t === 'queue' ? 'Takeover Queue' : t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'alerts' && alerts.length > 0 && (
                <span style={{ marginLeft: '6px', background: colors.red, color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '999px' }}>{alerts.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Leads Tab ─────────────────────────────────────── */}
        {tab === 'leads' && (
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>

            {/* Lead list */}
            <div style={{ background: colors.card, borderRadius: '24px', padding: '20px', border: `1px solid ${colors.border}` }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>My Leads ({leads.length})</h3>
              {leads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ color: colors.muted, fontSize: '14px', marginBottom: '16px' }}>No leads assigned yet.</p>
                  <button
                    onClick={async () => {
                      try {
                        // Get all unassigned qualified leads and self-assign first one
                        const res = await api.get('/leads?status=qualified');
                        const unassigned = (res.data.data?.leads || []).find(l => !l.assignedAgentId);
                        if (!unassigned) { alert('No unassigned leads available.'); return; }
                        await api.post(`/agent/leads/${unassigned._id}/assign`, { agentName: user.fullName });
                        loadData();
                      } catch (err) {
                        alert(err.response?.data?.message || 'Could not self-assign lead');
                      }
                    }}
                    style={{ padding: '10px 20px', background: `${colors.lime}22`, color: colors.lime, border: `1px solid ${colors.border}`, borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    + Claim an unassigned lead
                  </button>
                </div>
              ) : leads.map(lead => (
                <div key={lead._id} onClick={() => { setSelectedLead(lead); setActionMsg(''); }}
                  style={{ padding: '14px', marginBottom: '8px', background: selectedLead?._id === lead._id ? '#1C1C19' : '#0F0F0D', borderRadius: '14px', cursor: 'pointer', border: selectedLead?._id === lead._id ? `2px solid ${colors.lime}` : `1px solid ${colors.borderDim}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '14px' }}>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                    {lead.workflowStatus === 'taken_over' && (
                      <span style={{ fontSize: '10px', background: `${colors.orange}22`, color: colors.orange, padding: '2px 8px', borderRadius: '999px' }}>ACTIVE</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.muted, marginTop: '2px' }}>{lead.phone}</div>
                  <div style={{ marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '999px', background: `${STATUS_COLORS[lead.workflowStatus] || colors.muted}22`, color: STATUS_COLORS[lead.workflowStatus] || colors.muted, fontWeight: '600' }}>
                      {lead.workflowStatus?.replace(/_/g, ' ')}
                    </span>
                    {lead.workflowStatus === 'qualified' && (
                      <span style={{ marginLeft: '6px', fontSize: '11px', padding: '3px 8px', borderRadius: '999px', background: `${colors.emerald}22`, color: colors.emerald }}>
                        R{lead.monthlyBudget}/mo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Conversation panel */}
            <div style={{ background: colors.card, borderRadius: '24px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', minHeight: '580px' }}>
              {selectedLead ? (
                <>
                  {/* Lead header */}
                  <div style={{ padding: '20px 24px', borderBottom: `1px solid ${colors.borderDim}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ marginBottom: '2px', fontSize: '18px' }}>{selectedLead.name !== 'Unknown' ? selectedLead.name : selectedLead.phone}</h3>
                        <p style={{ color: colors.muted, fontSize: '13px' }}>{selectedLead.phone}</p>
                        {selectedLead.propertyInterest && (
                          <p style={{ color: colors.muted, fontSize: '12px', marginTop: '4px' }}>
                            {selectedLead.propertyInterest}
                            {selectedLead.monthlyBudget ? ` · R${selectedLead.monthlyBudget}/mo` : ''}
                            {selectedLead.moveInDate ? ` · ${selectedLead.moveInDate}` : ''}
                            {selectedLead.monthlyIncome ? ` · R${selectedLead.monthlyIncome} income` : ''}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '999px', background: isTakenOver ? `${colors.orange}22` : `${colors.lime}22`, color: isTakenOver ? colors.orange : colors.lime, fontWeight: '600' }}>
                          {isTakenOver ? '🟡 Bot Paused' : '🟢 Bot Active'}
                        </span>

                        {selectedLead.workflowStatus === 'qualified' && !selectedLead.viewingRequested && (
                          <button onClick={() => setViewingModal(selectedLead)}
                            style={{ padding: '7px 14px', background: `${colors.emerald}22`, color: colors.emerald, border: `1px solid ${colors.emerald}44`, borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                            📅 Schedule Viewing
                          </button>
                        )}

                        {selectedLead.viewingRequested && (
                          <span style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '999px', background: `${colors.emerald}22`, color: colors.emerald }}>
                            ✅ Viewing Scheduled
                          </span>
                        )}

                        {!isTakenOver ? (
                          <button onClick={handleTakeover} disabled={takingOver}
                            style={{ padding: '7px 14px', background: `${colors.orange}22`, color: colors.orange, border: `1px solid ${colors.orange}44`, borderRadius: '10px', cursor: takingOver ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600', opacity: takingOver ? 0.6 : 1 }}>
                            {takingOver ? 'Taking over...' : 'Take Over'}
                          </button>
                        ) : (
                          <button onClick={handleResume} disabled={resuming}
                            style={{ padding: '7px 14px', background: `${colors.lime}22`, color: colors.lime, border: `1px solid ${colors.border}`, borderRadius: '10px', cursor: resuming ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600', opacity: resuming ? 0.6 : 1 }}>
                            {resuming ? 'Resuming...' : 'Resume Bot'}
                          </button>
                        )}
                      </div>
                    </div>
                    {actionMsg && <p style={{ marginTop: '8px', fontSize: '13px', color: actionMsg.startsWith('✅') ? colors.lime : colors.red }}>{actionMsg}</p>}
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px' }}>
                    {loadingChat ? (
                      <p style={{ color: colors.muted, textAlign: 'center', marginTop: '60px' }}>Loading...</p>
                    ) : timeline.length === 0 ? (
                      <p style={{ color: colors.muted, textAlign: 'center', marginTop: '60px' }}>No messages yet.</p>
                    ) : timeline.map((msg, i) => (
                      <div key={i} style={{ alignSelf: msg.direction === 'outbound' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                        {msg.system ? (
                          <div style={{ alignSelf: 'center', width: '100%', textAlign: 'center', margin: '4px 0' }}>
                            <span style={{ fontSize: '11px', color: colors.muted, background: 'rgba(255,255,255,0.05)', padding: '4px 14px', borderRadius: '999px', display: 'inline-block' }}>
                              {msg.body.replace('[SYSTEM] ', '')}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div style={{ padding: '11px 15px', borderRadius: msg.direction === 'outbound' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.direction === 'outbound' ? colors.lime : '#1C1C19', color: msg.direction === 'outbound' ? '#050505' : colors.text, fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                              {msg.body}
                            </div>
                            <div style={{ fontSize: '11px', color: colors.muted, marginTop: '3px', textAlign: msg.direction === 'outbound' ? 'right' : 'left' }}>
                              {new Date(msg.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                              {msg.manual && !msg.system && <span style={{ marginLeft: '6px', color: colors.orange }}>· manual</span>}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>

                  {/* Message input */}
                  <div style={{ padding: '16px 24px', borderTop: `1px solid ${colors.borderDim}` }}>
                    {isTakenOver ? (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                          placeholder="Type a message..."
                          style={{ flex: 1, padding: '12px 16px', borderRadius: '999px', background: '#1C1C19', border: `1px solid ${colors.border}`, color: colors.text, fontSize: '14px', outline: 'none' }} />
                        <button onClick={handleSend} disabled={sending || !message.trim()}
                          style={{ padding: '12px 24px', background: !message.trim() || sending ? `${colors.lime}44` : colors.lime, color: '#050505', border: 'none', borderRadius: '999px', fontWeight: '700', cursor: !message.trim() || sending ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
                          {sending ? '...' : 'Send'}
                        </button>
                      </div>
                    ) : (
                      <p style={{ color: colors.muted, fontSize: '13px', textAlign: 'center' }}>
                        Click <strong style={{ color: colors.orange }}>Take Over</strong> to send manual messages.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.muted }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '48px', marginBottom: '16px' }}>💬</p>
                    <p>Select a lead to view conversation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Viewings Tab ───────────────────────────────────── */}
        {tab === 'viewings' && (
          <div>
            <h2 style={{ marginBottom: '24px', fontSize: '22px' }}>Upcoming Viewings ({viewings.length})</h2>
            {viewings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: colors.muted }}>
                <p style={{ fontSize: '40px', marginBottom: '16px' }}>📅</p>
                <p>No viewings scheduled yet.</p>
              </div>
            ) : viewings.map(v => (
              <div key={v._id} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '16px', padding: '20px 24px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '16px' }}>{v.name || v.phone}</strong>
                  <p style={{ color: colors.muted, fontSize: '13px', marginTop: '4px' }}>{v.phone}</p>
                  {v.propertyAddress && <p style={{ color: colors.muted, fontSize: '13px' }}>📍 {v.propertyAddress}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: colors.lime, fontWeight: '700' }}>
                    {new Date(v.viewingScheduledAt).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  <p style={{ color: colors.muted, fontSize: '13px' }}>
                    {new Date(v.viewingScheduledAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${colors.emerald}22`, color: colors.emerald, marginTop: '6px', display: 'inline-block' }}>
                    {v.viewingStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Queue Tab ──────────────────────────────────────── */}
        {tab === 'queue' && (
          <div>
            <h2 style={{ marginBottom: '24px', fontSize: '22px' }}>
              Active Takeovers ({queue?.active?.count || 0})
            </h2>
            {queue?.active?.leads?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: colors.muted }}>
                <p style={{ fontSize: '40px', marginBottom: '16px' }}>🌿</p>
                <p>No active takeovers.</p>
              </div>
            ) : queue?.active?.leads?.map(lead => (
              <div key={lead._id} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '16px', padding: '20px 24px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                  <p style={{ color: colors.muted, fontSize: '13px', marginTop: '4px' }}>{lead.phone}</p>
                  {lead.takenOverReason && <p style={{ color: colors.muted, fontSize: '12px' }}>Reason: {lead.takenOverReason}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', background: `${colors.orange}22`, color: colors.orange }}>
                    🟡 Taken Over
                  </span>
                  <p style={{ color: colors.muted, fontSize: '12px', marginTop: '6px' }}>
                    {new Date(lead.takenOverAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

        {/* ── Alerts Tab ─────────────────────────────────── */}
        {tab === 'alerts' && (
          <div>
            <h2 style={{ marginBottom: '24px', fontSize: '22px' }}>
              Alerts
              {alerts.length > 0 && (
                <span style={{ marginLeft: '10px', background: colors.red, color: '#fff', fontSize: '12px', padding: '3px 10px', borderRadius: '999px' }}>{alerts.length}</span>
              )}
            </h2>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: colors.muted }}>
                <p style={{ fontSize: '40px', marginBottom: '16px' }}>✅</p>
                <p>No alerts. All conversations are active.</p>
              </div>
            ) : alerts.map((alert, i) => (
              <div key={i} style={{
                background: colors.card,
                border: `1px solid ${alert.severity === 'high' ? colors.red : colors.amber}44`,
                borderRadius: '14px', padding: '18px 24px', marginBottom: '10px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <strong>{alert.lead.name !== 'Unknown' ? alert.lead.name : alert.lead.phone}</strong>
                  <p style={{ color: colors.muted, fontSize: '13px', marginTop: '4px' }}>{alert.message}</p>
                  <p style={{ color: colors.muted, fontSize: '12px', marginTop: '2px' }}>
                    Last active: {new Date(alert.lead.lastMessageAt).toLocaleString('en-ZA')}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span style={{
                    fontSize: '12px', padding: '4px 12px', borderRadius: '999px',
                    background: alert.severity === 'high' ? `${colors.red}22` : `${colors.amber}22`,
                    color: alert.severity === 'high' ? colors.red : colors.amber,
                    fontWeight: '600', textTransform: 'uppercase',
                  }}>{alert.severity}</span>
                  <span style={{ fontSize: '11px', color: colors.muted }}>{alert.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Viewing Modal */}
      {viewingModal && (
        <ViewingModal
          lead={viewingModal}
          onClose={() => setViewingModal(null)}
          onScheduled={() => { setViewingModal(null); loadData(); setActionMsg('✅ Viewing scheduled!'); }}
        />
      )}
    </div>
  );
}