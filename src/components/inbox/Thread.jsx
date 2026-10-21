// The middle pane of the inbox: one conversation, which keeps itself fresh
// (useThread polls while it is open), and the box to answer in.
//
// ── The one rule that is not cosmetic ─────────────────────────
//
// You cannot type into a conversation the bot still owns. Sending while the
// assistant is mid-flow means two voices answering the same customer, which
// is the bug class this codebase keeps hitting. So the composer is replaced
// by a Take Over button until the takeover is real, and the send path stays
// the one the backend already guards. (Carried over from ChatTab.jsx.)
import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import { useThread, useInboxActions, useSavedReplies } from '../../hooks/useInbox';
import { initials, timeOf, caption } from './chatText';
import Media from './Media';
import SavedReplies from './SavedReplies';

export default function Thread({ leadId, isMobile, onBack, onDetails, business }) {
  const thread = useThread(leadId);
  const actions = useInboxActions();
  const saved = useSavedReplies();
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState([]); // sent, not yet back from the server
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const endRef = useRef(null);

  const lead = thread.data?.lead || null;
  const timeline = thread.data?.timeline;
  const messages = [...(timeline || []), ...pending];
  const isTakenOver = lead?.workflowStatus === 'taken_over';
  const isClosed = lead?.workflowStatus === 'closed';
  const name = lead?.name && lead.name !== 'Unknown' ? lead.name : null;

  // Open at the newest message, and follow new ones as they arrive, the way a
  // chat app does. Keyed on the count, so a refresh with nothing new does not
  // pull you down while you are reading further up.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, leadId]);

  const send = async () => {
    const body = message.trim();
    if (!body || sending) return;
    setSending(true);
    setErr('');
    // Optimistic: a chat that waits for a round trip before showing your own
    // words feels broken, and this one is used on a phone signal.
    const optimistic = { direction: 'outbound', body, timestamp: new Date().toISOString(), pending: true };
    setPending((p) => [...p, optimistic]);
    setMessage('');
    try {
      // Out of window the server either HOLDS this (and nudges them) or
      // refuses outright. Either way "sent" would be a lie, so say what
      // actually happened.
      const notice = await actions.send(leadId, body);
      await thread.refetch();
      setPending((p) => p.filter((m) => m !== optimistic));
      if (notice) setErr(notice);
    } catch (e) {
      setErr(e.response?.data?.message || 'Message did not send.');
      // Put it back in the box rather than losing what they typed.
      setPending((p) => p.filter((m) => m !== optimistic));
      setMessage(body);
    } finally {
      setSending(false);
    }
  };

  const takeOver = async () => {
    setSending(true);
    setErr('');
    try {
      await actions.takeOver(leadId);
      await thread.refetch();
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not take over.');
    } finally { setSending(false); }
  };

  const composer = (
    <div className="shrink-0 border-t border-edge bg-surface" style={isMobile ? { paddingBottom: 'env(safe-area-inset-bottom)' } : undefined}>
      {lead?.inWindow === false && (
        /* Outside the 24-hour window — but the composer stays. The server
           sends a re-engagement template now and HOLDS this message until
           they reply, because a template does not reopen the window, only
           their answer does. */
        <p className="px-3.5 pt-2.5 text-center text-xs leading-normal text-muted">
          They haven't written in 24 hours. Send anyway — we'll nudge them and your message goes the moment they reply.
        </p>
      )}
      <SavedReplies saved={saved} current={message} onPick={(t) => setMessage((m) => (m.trim() ? `${m.trim()} ${t}` : t))} />
      <div className="flex items-end gap-2 p-2.5">
        <textarea
          value={message} onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={isMobile ? 'Type a message' : 'Type a message (Shift+Enter for a new line)'}
          rows={1} enterKeyHint="send" autoCorrect="off" aria-label="Message"
          // 16px on a phone, or iOS zooms the page on focus and strands the user.
          className="max-h-32 min-h-[44px] min-w-0 flex-1 resize-none rounded-2xl border border-white/12 bg-ground px-4 py-2.5 text-base text-ink focus:border-lime focus:outline-none md:text-sm"
        />
        <button
          type="button" onClick={send} disabled={sending || !message.trim()} aria-label="Send"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg ${message.trim() ? 'cursor-pointer bg-lime text-ground' : 'cursor-not-allowed bg-white/8 text-muted'}`}
        >➤</button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-ground">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-edge bg-surface px-3.5 py-2.5"
        style={isMobile ? { paddingTop: 'calc(10px + env(safe-area-inset-top))' } : undefined}>
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Back to conversations"
            className="min-h-11 min-w-10 shrink-0 cursor-pointer text-2xl text-ink">‹</button>
        )}
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white/8 text-[13px] font-bold text-ink">
          {initials(lead?.name, lead?.phone)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink">{name || lead?.phone || '…'}</p>
          {/* The number is tappable: on a phone the point of having it here
              is being able to ring them. */}
          <p className="truncate text-xs text-muted">
            {name && lead?.phone && (
              <><a href={`tel:${lead.phone}`} className="font-mono text-muted no-underline">{lead.phone}</a><span className="opacity-50"> · </span></>
            )}
            {business && <><span className="text-cyan">{business}</span><span className="opacity-50"> · </span></>}
            {isClosed ? 'Closed' : isTakenOver ? 'You are replying' : 'Assistant is answering'}
          </p>
        </div>
        {onDetails && <Button variant="secondary" onClick={onDetails}>Details</Button>}
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3.5">
        {thread.isPending && <p className="text-center text-[13px] text-muted">Loading…</p>}
        {thread.isError && !timeline && (
          <p className="text-center text-[13px] text-red">{thread.error?.response?.data?.message || 'Could not load this conversation.'}</p>
        )}
        {timeline && messages.length === 0 && <p className="mt-8 text-center text-[13px] text-muted">No messages yet.</p>}
        {messages.map((m, i) => {
          const out = m.direction === 'outbound';
          return (
            <div key={i} className={`mb-1.5 flex ${out ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-lg px-2.5 pt-[7px] pb-1.5 ${out ? 'rounded-tr-sm border border-lime/20 bg-lime/10' : 'rounded-tl-sm bg-raise'} ${m.pending ? 'opacity-60' : ''}`}>
                {m.mediaPath && <Media msg={m} />}
                {caption(m) && (
                  <p className={`whitespace-pre-wrap break-words text-[14.5px] leading-snug text-ink ${m.mediaPath ? 'mt-1' : ''}`}>{caption(m)}</p>
                )}
                <p className="mt-0.5 text-right font-mono text-[11px] text-muted">
                  {timeOf(m.timestamp)}{out && (m.pending ? ' ○' : ' ✓')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {err && <p className="px-3.5 py-1.5 text-xs text-red">{err}</p>}

      {/* Composer — or the reason there isn't one */}
      {!lead ? null : isClosed ? (
        <div className="border-t border-edge bg-surface p-3.5">
          <p className="text-center text-xs text-muted">This conversation is closed.</p>
        </div>
      ) : isTakenOver ? composer : (
        // The bot still owns this thread. Typing here would put two voices in
        // front of the same customer.
        <div className="border-t border-edge bg-surface p-3">
          <Button variant="warn" className="w-full" onClick={takeOver} disabled={sending}>
            {sending ? 'Taking over…' : '🎯 Take over to reply'}
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted">
            The assistant is answering this one. Take over to pause it and reply yourself.
          </p>
        </div>
      )}
    </div>
  );
}
