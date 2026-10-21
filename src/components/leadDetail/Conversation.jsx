// The tone of a marker in the thread (a payment, an invoice, a pause), as
// whole class names so Tailwind can see them.
const MARKER_TONE = { good: 'text-lime', warn: 'text-orange', bad: 'text-red' };

// Our side right on a lime-tinted bubble, theirs left on grey: the same as
// the WhatsApp API inbox, so a conversation reads the same in both places.
const bubble = (outbound) => `whitespace-pre-wrap px-3.5 py-2.5 text-[13px] leading-normal text-ink [overflow-wrap:anywhere] ${
  outbound ? 'rounded-[14px_14px_4px_14px] border border-lime/20 bg-lime/10' : 'rounded-[14px_14px_14px_4px] bg-raise'
}`;

const Stamp = ({ at, outbound, manual }) => (
  <div className={`mt-[3px] font-mono text-[10px] text-muted ${outbound ? 'text-right' : 'text-left'}`}>
    {new Date(at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
    {manual && <span className="ml-1.5 text-orange">· manual</span>}
  </div>
);

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
          <p className="mt-10 text-center text-muted">Nothing recorded yet.</p>
        ) : events.map((e, i) => {
          const isMessage = e.type === 'message_in' || e.type === 'message_out';
          const outbound = e.type === 'message_out';

          // Non-message events, and system notices, read as centred markers
          // in the flow — they are things that happened, not things said.
          if (!isMessage || e.system) {
            const label = isMessage ? (e.detail || '').replace('[SYSTEM] ', '') : e.title;
            return (
              <div key={i} className="my-0.5 w-full self-center text-center">
                <span className={`inline-block rounded-full bg-edge px-3 py-[3px] text-[11px] ${MARKER_TONE[e.tone] || 'text-muted'}`}>
                  {label}
                  {!isMessage && e.detail && <span className="text-muted"> · {e.detail}</span>}
                </span>
              </div>
            );
          }

          return (
            <div key={i} className={`max-w-[75%] ${outbound ? 'self-end' : 'self-start'}`}>
              <div className={bubble(outbound)}>{e.detail}</div>
              <Stamp at={e.at} outbound={outbound} manual={e.manual} />
            </div>
          );
        })
      )}

      {/* Fallback for a backend that predates `events`. */}
      {!events && (
        timeline.length === 0 ? (
          <p className="mt-10 text-center text-muted">No messages yet.</p>
        ) : timeline.map((msg, i) => (
          <div key={i} className={`max-w-[75%] ${msg.direction === 'outbound' ? 'self-end' : 'self-start'}`}>
            {msg.system ? (
              <div className="w-full self-center text-center">
                <span className="rounded-full bg-edge px-3 py-[3px] text-[11px] text-muted">{msg.body.replace('[SYSTEM] ', '')}</span>
              </div>
            ) : (
              <>
                <div className={bubble(msg.direction === 'outbound')}>{msg.body}</div>
                <Stamp at={msg.timestamp} outbound={msg.direction === 'outbound'} manual={msg.manual} />
              </>
            )}
          </div>
        ))
      )}
    </>
  );
}
