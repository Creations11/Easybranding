// src/components/LeadDetailModal.jsx
// ─────────────────────────────────────────────────────────────
// Full lead detail modal for admin dashboard.
// Shows conversation history + all operator controls.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
// The phone layout switches through useMediaQuery rather than a CSS
// breakpoint so it changes at exactly MOBILE_QUERY, the line every other
// screen in the console uses, and because the placeholder text changes too.
import useMediaQuery, { MOBILE_QUERY } from '../hooks/useMediaQuery';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { useCrmActions, useLeadNotes, crmError } from '../hooks/useCrm';
import { STAGE_LABEL, INTENT, nextStagesFor, canonical } from './crm/crmHelpers';

import NotesTab from './leadDetail/NotesTab';
import ViewingScheduler from './leadDetail/ViewingScheduler';
import { loadLeadDetail } from './leadDetail/loadLeadDetail';
import Conversation from './leadDetail/Conversation';
import DetailsTab from './leadDetail/DetailsTab';
import HistoryTab from './leadDetail/HistoryTab';

// The tabs, the viewing scheduler and the data loader live in ./leadDetail/.

// Badge tones (ui/Badge.jsx) for the sales intent crmHelpers' INTENT names.
const INTENT_TONE = { hot: 'bad', warm: 'warn', cool: 'system', lost: 'neutral' };

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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/88">
      <p className="text-muted">Loading...</p>
    </div>
  );

  const pad = isMobile ? 'px-3.5' : 'px-6';
  const intent = INTENT[lead?.salesIntent];

  return (
    // On a phone this is the whole screen, not a card floating in a dark
    // overlay: a 20px inset plus a 24px radius on a 390px device wastes most
    // of the width, and the conversation is the only thing the owner came
    // for. Uses 100dvh rather than 100vh — on mobile Safari 100vh is the
    // UNCOLLAPSED viewport, so the composer at the bottom sits under the
    // browser chrome and cannot be tapped, which is the classic way a mobile
    // chat ships broken.
    <div className={`fixed inset-0 z-[1000] flex justify-center bg-black/88 ${isMobile ? 'items-stretch p-0' : 'items-center p-5'}`}>
      <div className={`flex w-full flex-col overflow-hidden bg-card ${
        isMobile ? 'h-dvh max-h-dvh max-w-full rounded-none border-0' : 'max-h-[92vh] max-w-[780px] rounded-3xl border border-edge-live'
      }`}>

        {/* Header */}
        <div className={`flex items-start justify-between gap-2 border-b border-edge ${isMobile ? 'p-3.5' : 'px-6 py-5'}`}>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2.5">
              <h3 className="text-lg font-bold">{lead?.name !== 'Unknown' ? lead?.name : lead?.phone}</h3>
              {/* The sales stage, as on the board. A lead the agent never
                  staged is New; the bot's internal status (awaiting_menu…)
                  means nothing to a person working sales. */}
              {lead?.salesStage
                ? <Badge tone="system">{STAGE_LABEL[canonical(lead.salesStage)] || lead.salesStage}</Badge>
                : <Badge tone={isClosed ? 'neutral' : 'warn'}>{isClosed ? 'Closed' : 'New'}</Badge>}
              {intent && <Badge tone={INTENT_TONE[lead.salesIntent] || 'neutral'}>{intent.icon} {intent.label}</Badge>}
              {isTakenOver && <span className="inline-flex items-center rounded-full border border-orange/30 bg-orange/12 px-[11px] py-[5px] text-xs font-semibold text-orange">🟡 Bot Paused</span>}
              {!isTakenOver && !isClosed && <Badge tone="live">🟢 Bot Active</Badge>}
            </div>
            <p className="text-[13px] text-muted">
              <span className="font-mono">{lead?.phone}</span>
              {lead?.nextFollowUpAt ? ` · follow up ${new Date(lead.nextFollowUpAt).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
              {isClosed && lead?.closeReason ? ` · ${lead.closeReason}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            className="min-h-[44px] min-w-[44px] shrink-0 cursor-pointer text-2xl text-muted">×</button>
        </div>

        {/* Operator controls */}
        {!isClosed && (
          // On a phone the actions are one row you swipe along, each still a 44px
          // target: wrapped, seven of them took half the screen from the chat.
          <div className={`flex items-center gap-2 border-b border-edge py-3 ${pad} ${isMobile ? 'flex-nowrap overflow-x-auto [&>*]:shrink-0' : 'flex-wrap'}`}>
            {!isTakenOver ? (
              <Button variant="attention" onClick={() => doAction('takeover', { reason: 'Admin intervention' }, 'Conversation taken over')} disabled={actionLoading === 'takeover'}>
                {actionLoading === 'takeover' ? 'Taking over...' : '🎯 Take Over'}
              </Button>
            ) : (
              <Button variant="live" onClick={() => doAction('resume', { resumeAtStage: lead?.previousWorkflowStatus || 'awaiting_menu' }, 'Automation resumed')} disabled={actionLoading === 'resume'}>
                {actionLoading === 'resume' ? 'Resuming...' : '▶ Resume Bot'}
              </Button>
            )}
            {isQualified && !lead?.viewingRequested && (
              <Button variant="good" onClick={() => setShowViewing(v => !v)}>
                📅 Schedule Viewing
              </Button>
            )}
            {lead?.viewingRequested && (
              <span className="rounded-lg bg-emerald/10 px-3.5 py-2 text-xs text-emerald">✅ Viewing Scheduled</span>
            )}
            {isTakenOver && (
              <Button variant="warn" onClick={() => doAction('force-release', { reason: 'Admin force release' }, 'Takeover force released')}
                disabled={actionLoading === 'force-release'}>
                {actionLoading === 'force-release' ? 'Releasing...' : '⚡ Force Release'}
              </Button>
            )}
            <Button variant="system" onClick={() => doAction('followup', { hours: 16 }, 'AI follow-up armed (~16h)')} disabled={actionLoading === 'followup'}>
              {actionLoading === 'followup' ? 'Arming...' : '⏰ AI Follow-up'}
            </Button>
            <Button variant="good" onClick={() => doAction('allocate', {}, 'Allocated to a sales rep — both messaged')} disabled={actionLoading === 'allocate'}>
              {actionLoading === 'allocate' ? 'Allocating...' : '🤝 Allocate Rep'}
            </Button>
            {/* Forward only, conversation stages only: quoted, link sent and
                paid are earned by a real quote, link or payment. */}
            {nextStagesFor(lead?.salesStage).length > 0 && (
              <select
                aria-label="Move to stage"
                value=""
                onChange={(e) => moveTo(e.target.value)}
                disabled={actionLoading === 'stage'}
                className="min-h-[44px] cursor-pointer rounded-lg border border-cyan/20 bg-cyan/10 px-2.5 text-xs text-cyan focus:outline-none"
              >
                <option value="">{actionLoading === 'stage' ? 'Moving…' : '➜ Move to…'}</option>
                {nextStagesFor(lead?.salesStage).map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
              </select>
            )}
            <Button variant="danger" onClick={markLost} disabled={actionLoading === 'lost'}>
              {actionLoading === 'lost' ? 'Saving...' : '✕ Mark lost'}
            </Button>

            {/* Spam. Marking removes the lead from leads, conversations, the
                counts and the "Needs you" rail — the conversation is kept,
                just hidden — so it asks once, then offers the undo. */}
            {lead?.spamMarkedAt ? (
              <Button variant="attention" onClick={clearSpam} disabled={actionLoading === 'unspam'}
                title={lead.spamReason ? `Marked as spam: ${lead.spamReason}` : 'Marked as spam'}>
                {actionLoading === 'unspam' ? 'Restoring...' : '↩ Not spam'}
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={() => {
                  if (!spamConfirm) { setSpamConfirm(true); return; }
                  setSpamConfirm(false);
                  doAction('spam', { reason: 'Marked from dashboard' }, 'Marked as spam — removed from live work');
                }}
                onBlur={() => setSpamConfirm(false)}
                disabled={actionLoading === 'spam'}
                title="Removes this lead from your leads, conversations and the Needs-you rail. The conversation is kept."
                // The second press is the real one, so it looks it.
                className={spamConfirm ? 'font-bold ring-1 ring-red' : ''}>
                {actionLoading === 'spam' ? 'Marking...' : spamConfirm ? 'Confirm — mark as spam?' : '🚫 Mark as Spam'}
              </Button>
            )}
            {actionMsg && <span className={`ml-1 text-xs ${actionMsg.startsWith('✅') ? 'text-lime' : 'text-red'}`}>{actionMsg}</span>}
          </div>
        )}

        {/* A closed lead: say why, and offer the way back. */}
        {isClosed && (
          <div className={`flex flex-wrap items-center gap-2.5 border-b border-edge py-3 ${pad}`}>
            <span className="text-xs text-muted">Closed{lead?.closeReason ? `: ${lead.closeReason}` : ''}.</span>
            <Button variant="live" onClick={reopen} disabled={actionLoading === 'reopen'}>
              {actionLoading === 'reopen' ? 'Reopening…' : '↩ Reopen'}
            </Button>
            {actionMsg && <span className={`text-xs ${actionMsg.startsWith('✅') ? 'text-lime' : 'text-red'}`}>{actionMsg}</span>}
          </div>
        )}

        {/* Viewing scheduler */}
        {showViewing && (
          <div className={pad}>
            <ViewingScheduler lead={lead} onScheduled={() => { setShowViewing(false); load(); if (onUpdate) onUpdate(); }} onClose={() => setShowViewing(false)} />
          </div>
        )}

        {/* Tabs */}
        <div className={`flex gap-1 overflow-x-auto border-b border-edge ${pad}`}>
          {['conversation', 'details', 'notes', 'history'].map(tab => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={`-mb-px min-h-[44px] cursor-pointer whitespace-nowrap border-b-2 px-4 text-[13px] capitalize ${
                activeTab === tab ? 'border-lime font-semibold text-lime' : 'border-transparent text-muted hover:text-ink'
              }`}>
              {tab}{tab === 'notes' && notesCount ? ` (${notesCount})` : ''}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={`flex min-h-[200px] flex-1 flex-col gap-2 overflow-y-auto py-4 ${pad}`}>

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
          <div className={`flex gap-2.5 border-t border-edge ${isMobile ? 'px-3 pt-2.5' : 'px-6 py-3.5'}`}
            // Keeps the composer clear of the iPhone home indicator.
            style={isMobile ? { paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' } : undefined}>
            <input
              value={message} onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={isMobile ? 'Message…' : 'Type a message to send via WhatsApp...'}
              aria-label="Message"
              // Chat composer, so: no autocapitalise fighting the sender, no
              // autocorrect mangling names, and enterKeyHint puts "send" on
              // the on-screen keyboard instead of a newline arrow.
              enterKeyHint="send"
              autoCapitalize="sentences"
              autoCorrect="off"
              // 16px on mobile is not a style choice: iOS Safari zooms the
              // whole page in when a focused input is under 16px, and the
              // user is then stranded zoomed-in with no way back.
              className={`min-h-[44px] min-w-0 flex-1 rounded-full border border-edge bg-white/4 px-4 text-ink focus:border-lime focus:outline-none ${isMobile ? 'text-base' : 'text-sm'}`}
            />
            {/* 44px minimum touch target — below that it is a coin flip
                whether a thumb hits it. */}
            <button type="button" onClick={handleSend} disabled={actionLoading === 'message' || !message.trim()}
              className={`min-h-[44px] min-w-16 shrink-0 rounded-full px-5 font-bold text-[#080A06] ${isMobile ? 'text-[15px]' : 'text-sm'} ${
                !message.trim() || actionLoading === 'message' ? 'cursor-not-allowed bg-lime/30' : 'cursor-pointer bg-lime'
              }`}>
              {actionLoading === 'message' ? '...' : 'Send'}
            </button>
          </div>
        )}
        {!isTakenOver && !isClosed && (
          <div className="border-t border-edge px-6 py-3">
            <p className="text-center text-xs text-muted">
              Click <strong className="text-orange">Take Over</strong> to send manual messages and pause the bot.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
