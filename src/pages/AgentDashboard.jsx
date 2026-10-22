// src/pages/AgentDashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import StatTile from '../components/ui/StatTile';
import { Input } from '../components/ui/Field';

// Module scope, like App.jsx's getUser(): loadData reads the role through
// this rather than closing over component state, so the mount effect stays
// dependency-free.
const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('eb_user') || '{}'); }
  catch { return {}; }
};

// A lead's workflow status, as a chip: whole class names so Tailwind sees them.
const STATUS_CLASS = {
  qualified:                 'bg-lime/15 text-lime',
  not_qualified:             'bg-red/15 text-red',
  taken_over:                'bg-orange/15 text-orange',
  capture_name:              'bg-cyan/15 text-cyan',
  capture_property_interest: 'bg-cyan/15 text-cyan',
  capture_budget:            'bg-cyan/15 text-cyan',
  capture_move_in_date:      'bg-cyan/15 text-cyan',
  capture_employment_type:   'bg-cyan/15 text-cyan',
  capture_monthly_income:    'bg-cyan/15 text-cyan',
  awaiting_menu:             'bg-amber/15 text-amber',
  closed:                    'bg-muted/15 text-muted',
};

// A bot-state chip in the take-over orange, which ui/Badge has no tone for.
const OrangeChip = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-orange/30 bg-orange/12 px-[11px] py-[5px] text-xs font-semibold text-orange">{children}</span>
);

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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-4">
      <div className="w-full max-w-[480px] rounded-3xl border border-edge-live bg-surface p-8 max-sm:p-5">
        <h3 className="mb-2 text-lime">Schedule Viewing</h3>
        <p className="mb-6 text-sm text-muted">
          {lead.name} · <span className="font-mono">{lead.phone}</span> · {lead.propertyInterest || 'Property'}
        </p>
        {error && <p className="mb-4 text-sm text-red">{error}</p>}

        <Input type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="Viewing date" className="mb-3 bg-[#1C1C19]" />
        <Input type="time" value={time} onChange={e => setTime(e.target.value)} aria-label="Viewing time" className="mb-3 bg-[#1C1C19]" />
        <Input mono={false} type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Property address (optional)" className="mb-6 bg-[#1C1C19]" />

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSchedule} disabled={saving}>
            {saving ? 'Scheduling...' : 'Confirm Viewing'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── The page's data ───────────────────────────────────────────
//
// Was a mount effect that set five pieces of state; a query since 2026-10-05.
// A refresh now keeps the panels on screen while it runs, and the selected
// lead's conversation is keyed by the lead, so a slow answer for one lead can
// never land in another lead's chat.
const AGENT_DASHBOARD_KEY = ['agent-dashboard'];
const NO_DATA = { overview: null, leads: [], viewings: [], queue: null, alerts: [] };
// One shared empty list: a fresh [] on every render would re-run the
// scroll-to-bottom effect that watches the timeline.
const NO_TIMELINE = [];

async function loadAgentData() {
  // /admin-ops/alerts is verifyAdmin-gated and an "agent" is deliberately
  // not an admin role, so it 403s for the very users this page is for.
  // Under the old Promise.all that one rejection took the four /agent/*
  // calls down with it and the catch only console.error'd — an agent saw an
  // empty dashboard and no reason why (fixed 2026-08-07). Alerts are only
  // requested by roles that may actually have them, and allSettled keeps one
  // failing panel from emptying the rest.
  const canSeeAdminAlerts = ['admin', 'super_admin', 'eb_manager'].includes(getStoredUser().role);

  const results = await Promise.allSettled([
    api.get('/agent/overview'),
    api.get('/agent/leads'),
    api.get('/agent/viewings'),
    api.get('/agent/takeover-queue'),
    canSeeAdminAlerts ? api.get('/admin-ops/alerts') : Promise.resolve(null),
  ]);

  const [ovRes, leadsRes, viewRes, queueRes, alertRes] =
    results.map(r => (r.status === 'fulfilled' ? r.value : null));

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length) console.error('Some agent panels failed to load', failed.map(f => f.reason));

  return {
    overview: ovRes?.data.data?.overview ?? null,
    leads: leadsRes?.data.data?.leads || [],
    viewings: viewRes?.data.data?.viewings || [],
    queue: queueRes?.data.data ?? null,
    alerts: alertRes?.data.data?.alerts || [],
  };
}

const loadConversation = (leadId) =>
  api.get(`/agent/leads/${leadId}/conversation`).then((res) => res.data.data?.timeline || []);

// ── Main Agent Dashboard ──────────────────────────────────────
export default function AgentDashboard() {
  const [selectedLead, setSelectedLead] = useState(null);
  const [message,      setMessage]      = useState('');
  const [tab,          setTab]          = useState('leads');   // leads | viewings | queue | alerts
  const [sending,      setSending]      = useState(false);
  const [takingOver,   setTakingOver]   = useState(false);
  const [resuming,     setResuming]     = useState(false);
  const [viewingModal, setViewingModal] = useState(null);
  const [actionMsg,    setActionMsg]    = useState('');
  const bottomRef = useRef(null);
  const navigate  = useNavigate();
  const user      = getStoredUser();

  const dash = useQuery({ queryKey: AGENT_DASHBOARD_KEY, queryFn: loadAgentData });
  const { overview, leads, viewings, queue, alerts } = dash.data ?? NO_DATA;
  const loading = dash.isPending;
  const loadData = () => dash.refetch();

  // A failed conversation load shows an empty chat, as it always did.
  const chat = useQuery({
    queryKey: ['agent-conversation', selectedLead?._id],
    queryFn: () => loadConversation(selectedLead._id),
    enabled: !!selectedLead,
  });
  const timeline = chat.data ?? NO_TIMELINE;
  const loadingChat = !!selectedLead && chat.isPending && chat.fetchStatus !== 'idle';

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [timeline]);

  const handleTakeover = async () => {
    setTakingOver(true); setActionMsg('');
    try {
      await api.post(`/takeover/${selectedLead._id}/initiate`, {
        reason: 'Agent manual intervention',
        notifyLead: false,
      });
      setActionMsg('✅ Conversation taken over');
      const { data: fresh } = await loadData();
      const updated = fresh?.leads.find(l => l._id === selectedLead._id);
      if (updated) setSelectedLead(updated);
      // The takeover note is in the conversation. Swapping in a fresh lead
      // object used to refetch it as a side effect of the old effect; keyed by
      // id, the query does not, so it is asked for explicitly.
      chat.refetch();
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
      await chat.refetch();
      setActionMsg('✅ Sent');
      setTimeout(() => setActionMsg(''), 2000);
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Send failed'}`);
    } finally { setSending(false); }
  };

  const isTakenOver = selectedLead?.workflowStatus === 'taken_over';

  if (loading) return (
    <div className="p-[140px] text-center text-muted max-sm:px-4">
      Loading your workspace...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] px-[clamp(16px,4vw,40px)] pt-[clamp(80px,10vw,100px)] pb-10 text-ink">
      <div className="mx-auto max-w-[1400px]">

        {/* Header */}
        <div className="mb-10 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="mb-1.5 text-[clamp(24px,6vw,44px)] font-black">Agent Workspace</h1>
            <p className="text-lg text-muted">Welcome, {user.fullName || 'Agent'}</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')}>← Home</Button>
        </div>

        {/* Stats */}
        {overview && (
          <div className="mb-10 flex flex-wrap gap-4">
            <StatTile label="Assigned Leads"  value={overview.assignedTotal}     highlight tone="ink" />
            <StatTile label="Active"          value={overview.assignedActive}    highlight tone="cyan" />
            <StatTile label="Qualified"       value={overview.assignedQualified} highlight tone="lime" />
            <StatTile label="In My Queue"     value={overview.takenOverByMe}     highlight tone="amber" />
            <StatTile label="Viewings Set"    value={overview.viewingsScheduled} highlight tone="emerald" />
          </div>
        )}

        {/* Tabs */}
        <div className="mb-7 flex gap-2 overflow-x-auto border-b border-edge">
          {['leads', 'viewings', 'queue', 'alerts'].map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`-mb-px min-h-[44px] cursor-pointer whitespace-nowrap border-b-2 bg-transparent px-6 text-[15px] capitalize ${
                tab === t ? 'border-lime font-semibold text-lime' : 'border-transparent text-muted hover:text-ink'
              }`}>
              {t === 'queue' ? 'Takeover Queue' : t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'alerts' && alerts.length > 0 && (
                <span className="ml-1.5 rounded-full bg-red px-1.5 py-0.5 font-mono text-[10px] text-white">{alerts.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Leads Tab ─────────────────────────────────────── */}
        {/* Two columns on a desktop; stacked on a phone, where a fixed 340px
            column beside the chat used to push the page sideways. */}
        {tab === 'leads' && (
          <div className="grid grid-cols-[340px_1fr] gap-6 max-lg:grid-cols-1">

            {/* Lead list */}
            <div className="rounded-3xl border border-edge-live bg-card p-5">
              <h3 className="mb-4 text-base">My Leads ({leads.length})</h3>
              {leads.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="mb-4 text-sm text-muted">No leads assigned yet.</p>
                  <Button
                    variant="live"
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
                    }}>
                    + Claim an unassigned lead
                  </Button>
                </div>
              ) : leads.map(lead => (
                <div key={lead._id} onClick={() => { setSelectedLead(lead); setActionMsg(''); }}
                  className={`mb-2 cursor-pointer rounded-[14px] p-3.5 ${selectedLead?._id === lead._id ? 'border-2 border-lime bg-[#1C1C19]' : 'border border-edge bg-[#0F0F0D] hover:bg-raise'}`}>
                  <div className="flex justify-between gap-2">
                    <strong className="text-sm">{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                    {lead.workflowStatus === 'taken_over' && (
                      <span className="rounded-full bg-orange/15 px-2 py-0.5 text-[10px] text-orange">ACTIVE</span>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-muted">{lead.phone}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2 py-[3px] text-[11px] font-semibold ${STATUS_CLASS[lead.workflowStatus] || 'bg-muted/15 text-muted'}`}>
                      {lead.workflowStatus?.replace(/_/g, ' ')}
                    </span>
                    {lead.workflowStatus === 'qualified' && (
                      <span className="rounded-full bg-emerald/15 px-2 py-[3px] font-mono text-[11px] text-emerald">
                        R{lead.monthlyBudget}/mo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Conversation panel */}
            <div className="flex min-h-[580px] min-w-0 flex-col rounded-3xl border border-edge-live bg-card">
              {selectedLead ? (
                <>
                  {/* Lead header */}
                  <div className="border-b border-edge px-6 py-5 max-sm:px-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="mb-0.5 text-lg">{selectedLead.name !== 'Unknown' ? selectedLead.name : selectedLead.phone}</h3>
                        <p className="font-mono text-[13px] text-muted">{selectedLead.phone}</p>
                        {selectedLead.propertyInterest && (
                          <p className="mt-1 text-xs text-muted">
                            {selectedLead.propertyInterest}
                            {selectedLead.monthlyBudget ? ` · R${selectedLead.monthlyBudget}/mo` : ''}
                            {selectedLead.moveInDate ? ` · ${selectedLead.moveInDate}` : ''}
                            {selectedLead.monthlyIncome ? ` · R${selectedLead.monthlyIncome} income` : ''}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {isTakenOver ? <OrangeChip>🟡 Bot Paused</OrangeChip> : <Badge tone="live">🟢 Bot Active</Badge>}

                        {selectedLead.workflowStatus === 'qualified' && !selectedLead.viewingRequested && (
                          <Button variant="good" onClick={() => setViewingModal(selectedLead)}>
                            📅 Schedule Viewing
                          </Button>
                        )}

                        {selectedLead.viewingRequested && (
                          <Badge tone="good">✅ Viewing Scheduled</Badge>
                        )}

                        {!isTakenOver ? (
                          <Button variant="attention" onClick={handleTakeover} disabled={takingOver}>
                            {takingOver ? 'Taking over...' : 'Take Over'}
                          </Button>
                        ) : (
                          <Button variant="live" onClick={handleResume} disabled={resuming}>
                            {resuming ? 'Resuming...' : 'Resume Bot'}
                          </Button>
                        )}
                      </div>
                    </div>
                    {actionMsg && <p className={`mt-2 text-[13px] ${actionMsg.startsWith('✅') ? 'text-lime' : 'text-red'}`}>{actionMsg}</p>}
                  </div>

                  {/* Messages */}
                  <div className="flex max-h-[380px] flex-1 flex-col gap-2.5 overflow-y-auto p-5 max-sm:p-3">
                    {loadingChat ? (
                      <p className="mt-[60px] text-center text-muted">Loading...</p>
                    ) : timeline.length === 0 ? (
                      <p className="mt-[60px] text-center text-muted">No messages yet.</p>
                    ) : timeline.map((msg, i) => (
                      <div key={i} className={`max-w-[75%] ${msg.direction === 'outbound' ? 'self-end' : 'self-start'}`}>
                        {msg.system ? (
                          <div className="my-1 w-full self-center text-center">
                            <span className="inline-block rounded-full bg-white/5 px-3.5 py-1 text-[11px] text-muted">
                              {msg.body.replace('[SYSTEM] ', '')}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className={`whitespace-pre-wrap px-[15px] py-[11px] text-sm leading-normal [overflow-wrap:anywhere] ${
                              msg.direction === 'outbound' ? 'rounded-[16px_16px_4px_16px] bg-lime text-[#050505]' : 'rounded-[16px_16px_16px_4px] bg-[#1C1C19] text-ink'
                            }`}>
                              {msg.body}
                            </div>
                            <div className={`mt-[3px] font-mono text-[11px] text-muted ${msg.direction === 'outbound' ? 'text-right' : 'text-left'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                              {msg.manual && !msg.system && <span className="ml-1.5 text-orange">· manual</span>}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>

                  {/* Message input */}
                  <div className="border-t border-edge px-6 py-4 max-sm:px-3">
                    {isTakenOver ? (
                      <div className="flex gap-2.5">
                        <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                          placeholder="Type a message..."
                          aria-label="Message"
                          className="min-h-[44px] min-w-0 flex-1 rounded-full border border-edge-live bg-[#1C1C19] px-4 text-base text-ink focus:border-lime focus:outline-none md:text-sm" />
                        <button type="button" onClick={handleSend} disabled={sending || !message.trim()}
                          className={`min-h-[44px] shrink-0 rounded-full px-6 text-sm font-bold text-[#050505] ${!message.trim() || sending ? 'cursor-not-allowed bg-lime/30' : 'cursor-pointer bg-lime'}`}>
                          {sending ? '...' : 'Send'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-center text-[13px] text-muted">
                        Click <strong className="text-orange">Take Over</strong> to send manual messages.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-muted">
                  <div className="text-center">
                    <p className="mb-4 text-5xl">💬</p>
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
            <h2 className="mb-6 text-[22px]">Upcoming Viewings ({viewings.length})</h2>
            {viewings.length === 0 ? (
              <div className="py-20 text-center text-muted">
                <p className="mb-4 text-[40px]">📅</p>
                <p>No viewings scheduled yet.</p>
              </div>
            ) : viewings.map(v => (
              <div key={v._id} className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-edge bg-card px-6 py-5">
                <div>
                  <strong className="text-base">{v.name || v.phone}</strong>
                  <p className="mt-1 font-mono text-[13px] text-muted">{v.phone}</p>
                  {v.propertyAddress && <p className="text-[13px] text-muted">📍 {v.propertyAddress}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lime">
                    {new Date(v.viewingScheduledAt).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  <p className="font-mono text-[13px] text-muted">
                    {new Date(v.viewingScheduledAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className="mt-1.5 inline-block rounded-full bg-emerald/15 px-2.5 py-[3px] text-[11px] text-emerald">
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
            <h2 className="mb-6 text-[22px]">
              Active Takeovers ({queue?.active?.count || 0})
            </h2>
            {queue?.active?.leads?.length === 0 ? (
              <div className="py-[60px] text-center text-muted">
                <p className="mb-4 text-[40px]">🌿</p>
                <p>No active takeovers.</p>
              </div>
            ) : queue?.active?.leads?.map(lead => (
              <div key={lead._id} className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-edge bg-card px-6 py-5">
                <div>
                  <strong>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                  <p className="mt-1 font-mono text-[13px] text-muted">{lead.phone}</p>
                  {lead.takenOverReason && <p className="text-xs text-muted">Reason: {lead.takenOverReason}</p>}
                </div>
                <div className="text-right">
                  <OrangeChip>🟡 Taken Over</OrangeChip>
                  <p className="mt-1.5 font-mono text-xs text-muted">
                    {new Date(lead.takenOverAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts Tab ─────────────────────────────────── */}
        {/* Inside the page's width now, with the other tabs; it used to sit
            after the container closed and ran edge to edge. */}
        {tab === 'alerts' && (
          <div>
            <h2 className="mb-6 text-[22px]">
              Alerts
              {alerts.length > 0 && (
                <span className="ml-2.5 rounded-full bg-red px-2.5 py-[3px] font-mono text-xs text-white">{alerts.length}</span>
              )}
            </h2>
            {alerts.length === 0 ? (
              <div className="py-20 text-center text-muted">
                <p className="mb-4 text-[40px]">✅</p>
                <p>No alerts. All conversations are active.</p>
              </div>
            ) : alerts.map((alert, i) => (
              <div key={i} className={`mb-2.5 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border bg-card px-6 py-[18px] ${alert.severity === 'high' ? 'border-red/25' : 'border-amber/25'}`}>
                <div>
                  <strong>{alert.lead.name !== 'Unknown' ? alert.lead.name : alert.lead.phone}</strong>
                  <p className="mt-1 text-[13px] text-muted">{alert.message}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Last active: {new Date(alert.lead.lastMessageAt).toLocaleString('en-ZA')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge tone={alert.severity === 'high' ? 'bad' : 'warn'}><span className="uppercase">{alert.severity}</span></Badge>
                  <span className="text-[11px] text-muted">{alert.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
