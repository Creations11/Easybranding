import { t } from './tokens';

/** The thread: what was said and what happened, oldest first. A fragment, so
 *  each bubble stays a direct child of the modal's scrolling column. */
export default function Conversation({ events, timeline }) {
  return (
    <>
      {/* ── Conversation tab ─── */}
      {/* When the API sends `events`, the thread shows what HAPPENED to
          this lead, not only what was said: the payment they started, the
          invoice they were sent, the moment their bot was paused. Reading
          a thread without those is misleading — a customer who "went
          quiet" reads as lost interest when the record may show they paid
          and the webhook never landed. */}
      {events && (
        events.length === 0 ? (
          <p style={{ color: t.muted, textAlign: 'center', marginTop: '40px' }}>Nothing recorded yet.</p>
        ) : events.map((e, i) => {
          const isMessage = e.type === 'message_in' || e.type === 'message_out';
          const outbound = e.type === 'message_out';

          // Non-message events, and system notices, read as centred markers
          // in the flow — they are things that happened, not things said.
          if (!isMessage || e.system) {
            const tone = { good: t.lime, warn: t.orange, bad: t.red }[e.tone] || t.muted;
            const label = isMessage ? (e.detail || '').replace('[SYSTEM] ', '') : e.title;
            return (
              <div key={i} style={{ textAlign: 'center', width: '100%', alignSelf: 'center', margin: '2px 0' }}>
                <span style={{
                  fontSize: '11px', color: tone, background: t.borderDim,
                  padding: '3px 12px', borderRadius: '999px', display: 'inline-block',
                }}>
                  {label}
                  {!isMessage && e.detail && <span style={{ color: t.muted }}> · {e.detail}</span>}
                </span>
              </div>
            );
          }

          return (
            <div key={i} style={{ alignSelf: outbound ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: outbound ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: outbound ? '#005c4b' : '#1C1C19', color: t.text,
                fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
              }}>
                {e.detail}
              </div>
              <div style={{ fontSize: '10px', color: t.muted, marginTop: '3px', textAlign: outbound ? 'right' : 'left' }}>
                {new Date(e.at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                {e.manual && <span style={{ marginLeft: '6px', color: t.orange }}>· manual</span>}
              </div>
            </div>
          );
        })
      )}

      {/* Fallback for a backend that predates `events`. */}
      {!events && (
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
                <div style={{ padding: '10px 14px', borderRadius: msg.direction === 'outbound' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: msg.direction === 'outbound' ? '#005c4b' : '#1C1C19', color: t.text, fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
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
    </>
  );
}
