// src/components/LeadDetailModal.jsx
// ─────────────────────────────────────────────────────────────
// Full lead detail modal for admin dashboard.
// Shows conversation history + all operator controls.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
// Styling here is inline (1,678 style props across src against 75
// classNames), and inline styles cannot carry a media query — so the
// responsive switch has to be a JS one, through useMediaQuery.
import useMediaQuery, { MOBILE_QUERY } from '../hooks/useMediaQuery';
import { useCrmActions, useLeadNotes, crmError } from '../hooks/useCrm';
import { STAGE_LABEL, INTENT, nextStagesFor, canonical } from './crm/crmHelpers';

import { t } from './leadDetail/tokens';
import NotesTab from './leadDetail/NotesTab';
import ViewingScheduler from './leadDetail/ViewingScheduler';
import { loadLeadDetail } from './leadDetail/loadLeadDetail';
import Conversation from './leadDetail/Conversation';
import DetailsTab from './leadDetail/DetailsTab';
import HistoryTab from './leadDetail/HistoryTab';

// The tabs, the viewing scheduler and the data loader live in ./leadDetail/.

const NO_TIMELINE = [];
const NO_HISTORY = [];

export default function LeadDetailModal({ leadId, onClose, onUpdate }) {
  const detail = useQuery({ queryKey: ['lead-detail', leadId], queryFn: () => loadLeadDetail(leadId) });
  const lead            = detail.data?.lead ?? null;
  const timeline        = detail.data?.timeline ?? NO_TIMELINE;
  const events          = detail.data?.events ?? null;
  const takeoverHistory = detail.data?.takeoverHistory ?? NO_HISTORY;
  const loading         = detail.isPending;
  const load            = () => detail.refetch();
  // Spam takes the lead out of every live view, so it asks once first. A
  // stray click on a dashboard is far easier than mistyping "SPAM 3" on a
  // phone, and this is cheaper than a modal.
  const [spamConfirm, setSpamConfirm] = useState(false);
  const [message,       setMessage]       = useState('');
  const [activeTab,     setActiveTab]     = useState('conversation');
  const [showViewing,   setShowViewing]   = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [actionMsg,     setActionMsg]     = useState('');
  const bottomRef = useRef(null);
  const crm = useCrmActions();
  const notesCount = useLeadNotes(leadId).data?.length || 0;
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [timeline, events]);

  // The CRM's own actions: move the sales stage forward, mark lost (a close
  // with the reason), reopen. Each reports the API's own sentence on failure.
  const crmAct = async (key, fn, ok) => {
    setActionLoading(key); setActionMsg('');
    try {
      await fn();
      setActionMsg(`✅ ${ok}`);
      await load();
      if (onUpdate) onUpdate();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setActionMsg(`❌ ${crmError(err)}`);
    } finally { setActionLoading(''); }
  };
  const moveTo = (stage) => stage && crmAct('stage', () => crm.moveStage(leadId, stage), `Moved to ${STAGE_LABEL[stage] || stage}`);
  const markLost = () => {
    const reason = window.prompt('Why was this lead lost? (e.g. went with someone else, no budget, not interested)');
    if (!reason || !reason.trim()) return;
    crmAct('lost', () => crm.markLost(leadId, reason.trim()), 'Marked lost');
  };
  const reopen = () => crmAct('reopen', () => crm.reopen(leadId), 'Reopened');

  const doAction = async (action, payload = {}, successMsg) => {
    setActionLoading(action); setActionMsg('');
    try {
      // Force release uses takeover route not admin-ops; followup and
      // allocate live under the automation namespace (backend 2026-07-19)
      const url = action === 'force-release'
        ? `/takeover/${leadId}/force-release`
        : action === 'followup' || action === 'allocate'
          ? `/admin-ops/automation/leads/${leadId}/${action}`
          : `/admin-ops/leads/${leadId}/${action}`;
      await api.post(url, payload);
      setActionMsg(`✅ ${successMsg}`);
      await load();
      if (onUpdate) onUpdate();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Action failed'}`);
    } finally { setActionLoading(''); }
  };

  // Clearing a spam mark is a DELETE on the same path, which doAction (POST
  // only) cannot express — so it gets its own small handler rather than a
  // method argument threaded through every other action.
  const clearSpam = async () => {
    setActionLoading('unspam'); setActionMsg('');
    try {
      const { data } = await api.delete(`/admin-ops/leads/${leadId}/spam`);
      setActionMsg(`✅ Spam mark removed — back in as "${data?.data?.restoredTo || 'active'}"`);
      setSpamConfirm(false);
      await load();
      if (onUpdate) onUpdate();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setActionMsg(`❌ ${err.response?.data?.message || 'Could not clear the spam mark'}`);
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

  const isMobile = useMediaQuery(MOBILE_QUERY);
  const isTakenOver = lead?.workflowStatus === 'taken_over';
  const isQualified = lead?.workflowStatus === 'qualified';
  const isClosed    = lead?.workflowStatus === 'closed';

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <p style={{ color: t.muted }}>Loading...</p>
    </div>
  );

  return (
    // On a phone this is the whole screen, not a card floating in a dark
    // overlay: a 20px inset plus a 24px radius on a 390px device wastes most
    // of the width, and the conversation is the only thing the owner came
    // for. Uses 100dvh rather than 100vh — on mobile Safari 100vh is the
    // UNCOLLAPSED viewport, so the composer at the bottom sits under the
    // browser chrome and cannot be tapped, which is the classic way a mobile
    // chat ships broken.
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex',
      alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'center',
      zIndex: 1000, padding: isMobile ? 0 : '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '780px',
        height: isMobile ? '100dvh' : undefined,
        maxHeight: isMobile ? '100dvh' : '92vh',
        background: t.card,
        borderRadius: isMobile ? 0 : '24px',
        border: isMobile ? 'none' : `1px solid ${t.border}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: isMobile ? '14px 14px' : '20px 24px', borderBottom: `1px solid ${t.borderDim}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{lead?.name !== 'Unknown' ? lead?.name : lead?.phone}</h3>
              {/* The sales stage, as on the board. A lead the agent never
                  staged is New; the bot's internal status (awaiting_menu…)
                  means nothing to a person working sales. */}
              {lead?.salesStage
                ? <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${t.cyan}18`, color: t.cyan, fontWeight: '600' }}>{STAGE_LABEL[canonical(lead.salesStage)] || lead.salesStage}</span>
                : <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${isClosed ? t.muted : t.amber}18`, color: isClosed ? t.muted : t.amber, fontWeight: '600' }}>{isClosed ? 'Closed' : 'New'}</span>}
              {INTENT[lead?.salesIntent] && (
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${INTENT[lead.salesIntent].tint}18`, color: INTENT[lead.salesIntent].tint, fontWeight: '600' }}>
                  {INTENT[lead.salesIntent].icon} {INTENT[lead.salesIntent].label}
                </span>
              )}
              {isTakenOver && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${t.orange}18`, color: t.orange }}>🟡 Bot Paused</span>}
              {!isTakenOver && !isClosed && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${t.lime}18`, color: t.lime }}>🟢 Bot Active</span>}
            </div>
            <p style={{ color: t.muted, fontSize: '13px' }}>
              {lead?.phone}
              {lead?.nextFollowUpAt ? ` · follow up ${new Date(lead.nextFollowUpAt).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
              {isClosed && lead?.closeReason ? ` · ${lead.closeReason}` : ''}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ fontSize: '24px', background: 'none', border: 'none', color: t.muted, cursor: 'pointer',
                     padding: isMobile ? '0 8px' : '4px', minWidth: isMobile ? 44 : undefined, minHeight: isMobile ? 44 : undefined, flexShrink: 0 }}>×</button>
        </div>

        {/* Operator controls */}
        {!isClosed && (
          <div style={{ padding: isMobile ? '10px 14px' : '12px 24px', borderBottom: `1px solid ${t.borderDim}`, display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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
            {isTakenOver && (
              <button onClick={() => doAction('force-release', { reason: 'Admin force release' }, 'Takeover force released')}
                disabled={actionLoading === 'force-release'}
                style={{ padding: '8px 16px', background: `${t.amber}18`, color: t.amber, border: `1px solid ${t.amber}33`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', opacity: actionLoading === 'force-release' ? 0.6 : 1 }}>
                {actionLoading === 'force-release' ? 'Releasing...' : '⚡ Force Release'}
              </button>
            )}
            <button onClick={() => doAction('followup', { hours: 16 }, 'AI follow-up armed (~16h)')} disabled={actionLoading === 'followup'}
              style={{ padding: '8px 16px', background: `${t.cyan}18`, color: t.cyan, border: `1px solid ${t.cyan}33`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', opacity: actionLoading === 'followup' ? 0.6 : 1 }}>
              {actionLoading === 'followup' ? 'Arming...' : '⏰ AI Follow-up'}
            </button>
            <button onClick={() => doAction('allocate', {}, 'Allocated to a sales rep — both messaged')} disabled={actionLoading === 'allocate'}
              style={{ padding: '8px 16px', background: `${t.emerald}18`, color: t.emerald, border: `1px solid ${t.emerald}33`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', opacity: actionLoading === 'allocate' ? 0.6 : 1 }}>
              {actionLoading === 'allocate' ? 'Allocating...' : '🤝 Allocate Rep'}
            </button>
            {/* Forward only, conversation stages only: quoted, link sent and
                paid are earned by a real quote, link or payment. */}
            {nextStagesFor(lead?.salesStage).length > 0 && (
              <select
                aria-label="Move to stage"
                value=""
                onChange={(e) => moveTo(e.target.value)}
                disabled={actionLoading === 'stage'}
                style={{ padding: '8px 10px', background: `${t.cyan}18`, color: t.cyan, border: `1px solid ${t.cyan}33`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}
              >
                <option value="">{actionLoading === 'stage' ? 'Moving…' : '➜ Move to…'}</option>
                {nextStagesFor(lead?.salesStage).map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
              </select>
            )}
            <button onClick={markLost} disabled={actionLoading === 'lost'}
              style={{ padding: '8px 16px', background: `${t.red}18`, color: t.red, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', opacity: actionLoading === 'lost' ? 0.6 : 1 }}>
              {actionLoading === 'lost' ? 'Saving...' : '✕ Mark lost'}
            </button>

            {/* Spam. Marking removes the lead from leads, conversations, the
                counts and the "Needs you" rail — the conversation is kept,
                just hidden — so it asks once, then offers the undo. */}
            {lead?.spamMarkedAt ? (
              <button onClick={clearSpam} disabled={actionLoading === 'unspam'}
                title={lead.spamReason ? `Marked as spam: ${lead.spamReason}` : 'Marked as spam'}
                style={{ padding: '8px 16px', background: `${t.orange}18`, color: t.orange, border: `1px solid ${t.orange}33`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', opacity: actionLoading === 'unspam' ? 0.6 : 1 }}>
                {actionLoading === 'unspam' ? 'Restoring...' : '↩ Not spam'}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!spamConfirm) { setSpamConfirm(true); return; }
                  setSpamConfirm(false);
                  doAction('spam', { reason: 'Marked from dashboard' }, 'Marked as spam — removed from live work');
                }}
                onBlur={() => setSpamConfirm(false)}
                disabled={actionLoading === 'spam'}
                title="Removes this lead from your leads, conversations and the Needs-you rail. The conversation is kept."
                style={{ padding: '8px 16px', background: `${t.red}18`, color: t.red, border: `1px solid ${spamConfirm ? t.red : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: spamConfirm ? '700' : '400', opacity: actionLoading === 'spam' ? 0.6 : 1 }}>
                {actionLoading === 'spam' ? 'Marking...' : spamConfirm ? 'Confirm — mark as spam?' : '🚫 Mark as Spam'}
              </button>
            )}
            {actionMsg && <span style={{ fontSize: '12px', color: actionMsg.startsWith('✅') ? t.lime : t.red, marginLeft: '4px' }}>{actionMsg}</span>}
          </div>
        )}

        {/* A closed lead: say why, and offer the way back. */}
        {isClosed && (
          <div style={{ padding: isMobile ? '10px 14px' : '12px 24px', borderBottom: `1px solid ${t.borderDim}`, display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: t.muted, fontSize: 12 }}>Closed{lead?.closeReason ? `: ${lead.closeReason}` : ''}.</span>
            <button onClick={reopen} disabled={actionLoading === 'reopen'}
              style={{ padding: '7px 14px', background: `${t.lime}18`, color: t.lime, border: `1px solid ${t.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
              {actionLoading === 'reopen' ? 'Reopening…' : '↩ Reopen'}
            </button>
            {actionMsg && <span style={{ fontSize: '12px', color: actionMsg.startsWith('✅') ? t.lime : t.red }}>{actionMsg}</span>}
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
          {['conversation', 'details', 'notes', 'history'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '10px 16px', background: 'none', border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${t.lime}` : '2px solid transparent',
              color: activeTab === tab ? t.lime : t.muted,
              cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab ? '600' : '400',
              textTransform: 'capitalize', marginBottom: '-1px',
            }}>
              {tab}{tab === 'notes' && notesCount ? ` (${notesCount})` : ''}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '200px' }}>

          {activeTab === 'conversation' && <Conversation events={events} timeline={timeline} />}
          <div ref={bottomRef} />

          {/* ── Details tab ─── */}
          {activeTab === 'details' && <DetailsTab lead={lead} />}

          {/* ── Notes tab ─── shared with everyone who can see the lead */}
          {activeTab === 'notes' && <NotesTab leadId={leadId} />}

          {/* ── History tab ─── */}
          {activeTab === 'history' && <HistoryTab takeoverHistory={takeoverHistory} />}
        </div>

        {/* Message input — only when taken over */}
        {isTakenOver && !isClosed && (
          <div style={{
            padding: isMobile ? '10px 12px' : '14px 24px',
            borderTop: `1px solid ${t.borderDim}`, display: 'flex', gap: '10px',
            // Keeps the composer clear of the iPhone home indicator.
            paddingBottom: isMobile ? 'calc(10px + env(safe-area-inset-bottom))' : '14px',
          }}>
            <input
              value={message} onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={isMobile ? 'Message…' : 'Type a message to send via WhatsApp...'}
              // Chat composer, so: no autocapitalise fighting the sender, no
              // autocorrect mangling names, and enterKeyHint puts "send" on
              // the on-screen keyboard instead of a newline arrow.
              enterKeyHint="send"
              autoCapitalize="sentences"
              autoCorrect="off"
              style={{
                flex: 1, minWidth: 0,
                padding: isMobile ? '11px 14px' : '12px 16px',
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${t.borderDim}`,
                borderRadius: '999px', color: t.text,
                // 16px on mobile is not a style choice: iOS Safari zooms the
                // whole page in when a focused input is under 16px, and the
                // user is then stranded zoomed-in with no way back.
                fontSize: isMobile ? '16px' : '14px',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button onClick={handleSend} disabled={actionLoading === 'message' || !message.trim()}
              style={{
                // 44px minimum touch target — below that it is a coin flip
                // whether a thumb hits it.
                padding: isMobile ? '0 18px' : '12px 24px',
                minWidth: isMobile ? '64px' : undefined,
                minHeight: isMobile ? '44px' : undefined,
                background: !message.trim() || actionLoading === 'message' ? `${t.lime}44` : t.lime,
                color: '#080A06', border: 'none', borderRadius: '999px', fontWeight: '700',
                cursor: !message.trim() || actionLoading === 'message' ? 'not-allowed' : 'pointer',
                fontSize: isMobile ? '15px' : '14px', fontFamily: 'inherit', flexShrink: 0,
              }}>
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
