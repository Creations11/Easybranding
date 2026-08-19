// src/components/ChatTab.jsx
// ─────────────────────────────────────────────────────────────
// A WhatsApp-shaped inbox for the dashboard.
//
// ── Why this exists ───────────────────────────────────────────
//
// Baltmore (SendUs, highest-volume tenant): "it's still difficult for me to
// chat with my clients ... was expecting the view like business whatsapp.
// Very easy to access from my side."
//
// The pieces already existed — LeadDetailModal renders a merged timeline and
// can send — but it is an admin record with a message list inside it, opened
// from a kanban board. That is not what someone means when they say they want
// their WhatsApp back. This is: a list of conversations newest-first, tap one,
// read the thread, type, send.
//
// ── Deliberate shape ──────────────────────────────────────────
//
// Two panes on a desktop, one at a time on a phone — list, then the thread
// fills the screen with a back arrow, exactly like the app it is imitating.
//
// Outbound sits right on a green bubble, inbound left on a grey one, because
// that is the convention every WhatsApp user already reads without thinking.
// Getting the sides right matters more than getting the colours exact.
//
// ── The one rule that is not cosmetic ─────────────────────────
//
// You cannot type into a conversation the bot still owns. Sending while the
// assistant is mid-flow means two voices answering the same customer, which
// is the bug class this codebase keeps hitting. So the composer is replaced
// by a Take Over button until the takeover is real, and the send path stays
// the one the backend already guards.
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';
import useMediaQuery, { MOBILE_QUERY } from '../hooks/useMediaQuery';
import { colors } from '../utils/theme';

// WhatsApp's own bubble colours, dark theme.
const BUBBLE_OUT = '#005C4B';
const BUBBLE_IN  = '#202C33';
const CHAT_BG    = '#0B141A';
const PANEL_BG   = '#111B21';

const initials = (name, phone) => {
  const src = (name && name !== 'Unknown') ? name : (phone || '?');
  return src.replace(/[^A-Za-z0-9 ]/g, '').trim().split(/\s+/).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase() || '#';
};

const timeOf = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit' });
};

const preview = (m) => {
  if (!m) return 'No messages yet';
  const body = String(m.body || '').replace(/\s+/g, ' ').trim();
  const tick = m.direction === 'outbound' ? '✓ ' : '';
  if (!body && m.mediaContentType) return tick + kindOf(m.mediaContentType).label;
  return tick + (body.slice(0, 42) || '📎 Attachment');
};

// What a customer actually sends: a photo of the part they need, a voice note
// explaining the job, a proof of payment. Each wants a different control —
// an <img> for a photo, a player for audio, a link for anything else.
const kindOf = (contentType = '') => {
  const t = String(contentType);
  if (/image/i.test(t)) return { kind: 'image', label: '📷 Photo' };
  if (/audio|voice|ogg|mpeg|mp3|amr|opus/i.test(t)) return { kind: 'audio', label: '🎤 Voice note' };
  if (/pdf/i.test(t)) return { kind: 'file', label: '📄 Document' };
  if (/video/i.test(t)) return { kind: 'video', label: '🎬 Video' };
  return { kind: 'file', label: '📎 Attachment' };
};

// Lead.messages.body is `required` on the API side, so a caption-less photo is
// stored with a stand-in body — "📷 Photo", "🎤 Voice note" — put there purely
// so the write does not fail validation (leadMessageLog.describeMedia).
// Showing that word under the photo it describes is the one thing WhatsApp
// never does, so drop it once the real attachment is on screen.
const PLACEHOLDER = /^(📷 Photo|🎤 Voice note|🎥 Video|👤 Contact card|📎 (Document|Attachment))( \(\+\d+ more\))?$/;

const caption = (m) => {
  const body = String(m.body || '').trim();
  if (m.mediaPath && PLACEHOLDER.test(body)) return '';
  // No media to show and no words either — say so rather than render nothing.
  if (!body && !m.mediaPath) return '📎 Attachment';
  return body;
};

/**
 * Renders one attachment.
 *
 * `src` goes through the API rather than at Twilio directly: inbound media
 * URLs are credential-protected and 401 in a browser, so the bytes are
 * proxied under the session the dashboard already has. api.defaults.baseURL
 * is reused so this follows whatever environment the rest of the app targets.
 */
function Media({ msg }) {
  // Optional-chained: api.defaults is always present under axios, but a
  // thrown TypeError here would take the whole thread down over an
  // attachment, which is the wrong trade for a preview.
  const src = `${api.defaults?.baseURL || ''}${msg.mediaPath}`;
  const { kind, label } = kindOf(msg.mediaContentType);
  const [failed, setFailed] = useState(false);

  // A broken image icon inside a chat bubble reads as a bug in the product.
  // A labelled link reads as a file the browser could not preview, which is
  // what actually happened.
  if (failed || kind === 'file') {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                 background: 'rgba(255,255,255,0.06)', borderRadius: 6, color: '#E9EDEF',
                 fontSize: 13.5, textDecoration: 'none', minHeight: 40 }}>
        {label} <span style={{ opacity: 0.6, fontSize: 12 }}>open</span>
      </a>
    );
  }

  if (kind === 'image') {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
        <img src={src} alt={label} onError={() => setFailed(true)}
          style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 6, display: 'block' }} />
      </a>
    );
  }

  if (kind === 'video') {
    return <video src={src} controls onError={() => setFailed(true)}
      style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 6, display: 'block' }} />;
  }

  // Voice notes are the case this whole path exists for — a customer's
  // explanation that nobody on the platform could hear.
  return (
    <audio src={src} controls onError={() => setFailed(true)}
      style={{ width: '100%', minWidth: 210, height: 38 }} />
  );
}

export default function ChatTab({ conversations = [], onRefresh, onExit }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [selectedId, setSelectedId] = useState(null);
  const [lead, setLead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const [query, setQuery] = useState('');
  const endRef = useRef(null);

  const openThread = useCallback(async (id) => {
    setSelectedId(id);
    setLoading(true);
    setErr('');
    try {
      const res = await api.get(`/admin-ops/leads/${id}/timeline`);
      setLead(res.data.data?.lead || null);
      setMessages(res.data.data?.timeline || []);
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not load this conversation.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Jump to the newest message whenever the thread changes, the way a chat
  // app opens at the bottom rather than the top.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, selectedId]);

  const isTakenOver = lead?.workflowStatus === 'taken_over';
  const isClosed    = lead?.workflowStatus === 'closed';

  const send = async () => {
    const body = message.trim();
    if (!body || sending) return;
    setSending(true);
    setErr('');
    // Optimistic: a chat that waits for a round trip before showing your own
    // words feels broken, and this one is being used on a phone signal.
    const optimistic = { direction: 'outbound', body, timestamp: new Date().toISOString(), pending: true };
    setMessages(prev => [...prev, optimistic]);
    setMessage('');
    try {
      await api.post(`/admin-ops/leads/${selectedId}/message`, { message: body });
      await openThread(selectedId);
      onRefresh?.();
    } catch (e) {
      setErr(e.response?.data?.message || 'Message did not send.');
      // Put it back in the box rather than losing what they typed.
      setMessages(prev => prev.filter(m => m !== optimistic));
      setMessage(body);
    } finally {
      setSending(false);
    }
  };

  const takeOver = async () => {
    setSending(true);
    try {
      await api.post(`/admin-ops/leads/${selectedId}/takeover`, { reason: 'Chat' });
      await openThread(selectedId);
      onRefresh?.();
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not take over.');
    } finally { setSending(false); }
  };

  const list = conversations.filter(c => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
  });

  // ── Conversation list ──────────────────────────────────────
  const ListPane = (
    <div style={{
      width: isMobile ? '100%' : 340, flexShrink: 0, background: PANEL_BG,
      borderRight: isMobile ? 'none' : `1px solid ${colors.borderDim}`,
      display: 'flex', flexDirection: 'column', minHeight: 0,
    }}>
      <div style={{ padding: 12, borderBottom: `1px solid ${colors.borderDim}` }}>
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search name or number"
          style={{
            width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)',
            border: 'none', borderRadius: 999, color: colors.text,
            fontSize: isMobile ? 16 : 14, outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {list.length === 0 && (
          <p style={{ color: colors.muted, fontSize: 13, textAlign: 'center', padding: '28px 16px' }}>
            {query ? 'Nobody matches that.' : 'No conversations yet.'}
          </p>
        )}
        {list.map(c => (
          <button key={c._id} onClick={() => openThread(c._id)}
            style={{
              width: '100%', textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center',
              padding: '12px 14px', background: selectedId === c._id ? 'rgba(255,255,255,0.06)' : 'transparent',
              border: 'none', borderBottom: `1px solid ${colors.borderDim}`,
              cursor: 'pointer', fontFamily: 'inherit', minHeight: 64,
            }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.08)', color: colors.text,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700,
            }}>{initials(c.name, c.phone)}</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: colors.text, fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.name && c.name !== 'Unknown' ? c.name : c.phone}
                </span>
                <span style={{ color: colors.muted, fontSize: 11, flexShrink: 0 }}>{timeOf(c.lastMessageAt)}</span>
              </div>
              {/* The number, always — not only when the name is missing.
                  Baltmore asked for this: a WhatsApp profile name is whatever
                  the customer typed into their own phone, so two "Thabo"s are
                  indistinguishable, and the number is what he calls back on.
                  Shown only when it adds something the line above doesn't. */}
              {c.name && c.name !== 'Unknown' && c.phone && (
                <div style={{ color: colors.muted, fontSize: 11.5, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {c.phone}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
                <span style={{ color: colors.muted, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {preview(c.lastMessage)}
                </span>
                {/* Waiting on a human is the only badge worth a colour here. */}
                {c.awaitingReply && (
                  <span style={{ flexShrink: 0, minWidth: 20, height: 20, borderRadius: 999, background: colors.lime,
                                 color: '#050505', fontSize: 11, fontWeight: 800, display: 'flex',
                                 alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>!</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Thread ─────────────────────────────────────────────────
  const ThreadPane = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, background: CHAT_BG }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
        background: PANEL_BG, borderBottom: `1px solid ${colors.borderDim}`, flexShrink: 0,
        paddingTop: isMobile ? 'calc(10px + env(safe-area-inset-top))' : 10,
      }}>
        {isMobile && (
          <button onClick={() => { setSelectedId(null); setLead(null); setMessages([]); }}
            aria-label="Back"
            style={{ background: 'none', border: 'none', color: colors.text, fontSize: 22,
                     cursor: 'pointer', minWidth: 40, minHeight: 40, flexShrink: 0 }}>‹</button>
        )}
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
          {initials(lead?.name, lead?.phone)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ color: colors.text, fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {lead?.name && lead.name !== 'Unknown' ? lead.name : lead?.phone}
          </p>
          {/* Number alongside the status, and tappable — on a phone the whole
              point of having it here is being able to ring them. */}
          <p style={{ color: colors.muted, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {lead?.phone && lead?.name && lead.name !== 'Unknown' && (
              <>
                <a href={`tel:${lead.phone}`} style={{ color: colors.muted, textDecoration: 'none', fontVariantNumeric: 'tabular-nums' }}>
                  {lead.phone}
                </a>
                <span style={{ opacity: 0.5 }}> · </span>
              </>
            )}
            {isClosed ? 'Closed' : isTakenOver ? 'You are replying' : 'Assistant is answering'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', minHeight: 0 }}>
        {loading && <p style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>Loading…</p>}
        {!loading && messages.length === 0 && (
          <p style={{ color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 30 }}>No messages yet.</p>
        )}
        {messages.map((m, i) => {
          const out = m.direction === 'outbound';
          return (
            <div key={i} style={{ display: 'flex', justifyContent: out ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
              <div style={{
                maxWidth: '78%', padding: '7px 10px 6px',
                background: out ? BUBBLE_OUT : BUBBLE_IN,
                borderRadius: 8,
                borderTopRightRadius: out ? 2 : 8,
                borderTopLeftRadius: out ? 8 : 2,
                opacity: m.pending ? 0.6 : 1,
              }}>
                {m.mediaPath && <Media msg={m} />}
                {caption(m) && (
                  <p style={{ color: '#E9EDEF', fontSize: 14.5, lineHeight: 1.4, whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word', marginTop: m.mediaPath ? 5 : 0 }}>
                    {caption(m)}
                  </p>
                )}
                <p style={{ color: 'rgba(233,237,239,0.5)', fontSize: 11, textAlign: 'right', marginTop: 2 }}>
                  {timeOf(m.timestamp)}{out && (m.pending ? ' ○' : ' ✓')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {err && <p style={{ color: colors.red, fontSize: 12, padding: '6px 14px' }}>{err}</p>}

      {/* Composer — or the reason there isn't one */}
      {isClosed ? (
        <div style={{ padding: '14px', background: PANEL_BG, borderTop: `1px solid ${colors.borderDim}` }}>
          <p style={{ color: colors.muted, fontSize: 12, textAlign: 'center' }}>This conversation is closed.</p>
        </div>
      ) : isTakenOver ? (
        <div style={{
          display: 'flex', gap: 8, padding: 10, background: PANEL_BG,
          borderTop: `1px solid ${colors.borderDim}`, flexShrink: 0,
          paddingBottom: isMobile ? 'calc(10px + env(safe-area-inset-bottom))' : 10,
        }}>
          <input
            value={message} onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Type a message"
            enterKeyHint="send" autoCorrect="off"
            style={{
              flex: 1, minWidth: 0, padding: '11px 16px', background: BUBBLE_IN,
              border: 'none', borderRadius: 999, color: '#E9EDEF',
              // 16px or iOS zooms the page on focus and strands the user.
              fontSize: isMobile ? 16 : 14, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button onClick={send} disabled={sending || !message.trim()} aria-label="Send"
            style={{
              width: 46, height: 46, borderRadius: '50%', flexShrink: 0, border: 'none',
              background: message.trim() ? colors.lime : 'rgba(255,255,255,0.08)',
              color: message.trim() ? '#050505' : colors.muted,
              fontSize: 18, cursor: message.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            }}>➤</button>
        </div>
      ) : (
        // The bot still owns this thread. Typing here would put two voices in
        // front of the same customer.
        <div style={{ padding: 12, background: PANEL_BG, borderTop: `1px solid ${colors.borderDim}` }}>
          <button onClick={takeOver} disabled={sending}
            style={{
              width: '100%', minHeight: 46, borderRadius: 999, border: 'none',
              background: colors.amber, color: '#050505', fontWeight: 700,
              fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
            }}>
            {sending ? 'Taking over…' : '🎯 Take over to reply'}
          </button>
          <p style={{ color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
            The assistant is answering this one. Take over to pause it and reply yourself.
          </p>
        </div>
      )}
    </div>
  );

  const EmptyPane = (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: CHAT_BG }}>
      <p style={{ color: colors.muted, fontSize: 14 }}>Pick a conversation to read it.</p>
    </div>
  );

  // ── Phone: take the whole screen ───────────────────────────
  //
  // Sitting this inside the normal page means the stat cards, the header row
  // and the tab bar consume most of a 812px-tall phone before the first
  // message renders — and any `calc(100dvh - Npx)` guess at that chrome is
  // wrong the moment anything above it changes.
  //
  // A fixed overlay is what a phone chat app actually is: it owns the screen
  // until you leave it. It also means the composer's distance from the bottom
  // is exact rather than inherited, which is what keeps it above the keyboard.
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 900, background: CHAT_BG,
        display: 'flex', flexDirection: 'column', minHeight: 0,
      }}>
        {/* Only shown on the list; inside a thread the thread's own back
            arrow is the way out, exactly as in WhatsApp. */}
        {!selectedId && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            background: PANEL_BG, borderBottom: `1px solid ${colors.borderDim}`, flexShrink: 0,
            paddingTop: 'calc(10px + env(safe-area-inset-top))',
          }}>
            <button onClick={() => onExit?.()} aria-label="Back to dashboard"
              style={{ background: 'none', border: 'none', color: colors.text, fontSize: 22,
                       cursor: 'pointer', minWidth: 40, minHeight: 40, flexShrink: 0 }}>‹</button>
            <span style={{ color: colors.text, fontSize: 17, fontWeight: 700 }}>Chats</span>
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          {selectedId ? ThreadPane : ListPane}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 260px)',
      minHeight: 380,
      border: `1px solid ${colors.borderDim}`, borderRadius: 14, overflow: 'hidden',
    }}>
      {ListPane}
      {selectedId ? ThreadPane : EmptyPane}
    </div>
  );
}
