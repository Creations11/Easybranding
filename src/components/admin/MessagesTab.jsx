export default function MessagesTab({ recentMessages, setLeadDetailId }) {
  return (
    <div>
      {/* One card per sender, their recent messages inside it, ordered
          by who spoke last. The flat version gave every message its own
          card, so one person sending six things in a row filled the
          screen and quieter people dropped off the bottom. */}
      <h2 className="mb-5 text-xl">Recent Messages ({recentMessages.length} {recentMessages.length === 1 ? 'conversation' : 'conversations'})</h2>
      {recentMessages.length === 0 ? (
        <p className="py-[60px] text-center text-muted">No messages yet.</p>
      ) : recentMessages.map((convo) => {
        const thread = convo.messages || [];
        const latest = thread[thread.length - 1];
        const hidden = (convo.totalMessages || thread.length) - thread.length;
        return (
          <div key={convo.leadId} onClick={() => setLeadDetailId(convo.leadId)}
            className="mb-2.5 cursor-pointer rounded-xl border border-edge bg-card px-[18px] py-3.5 hover:bg-raise">

            {/* The sender, once */}
            <div className={`flex items-center justify-between gap-2.5 ${thread.length ? 'mb-2.5' : ''}`}>
              <div className="flex min-w-0 items-center gap-2.5">
                <strong className="text-sm">{convo.name && convo.name !== 'Unknown' ? convo.name : convo.phone}</strong>
                {convo.takenOver && <span className="shrink-0 rounded-full bg-amber/15 px-2 py-0.5 text-[10px] text-amber">taken over</span>}
                <span className="shrink-0 font-mono text-[11px] text-muted">{convo.totalMessages || thread.length} msgs</span>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-muted">
                {latest ? new Date(latest.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>

            {/* …then the messages, oldest first so it reads like a chat */}
            {hidden > 0 && (
              <p className="mb-1.5 text-[11px] text-muted">+{hidden} earlier — open to read the rest</p>
            )}
            {thread.map((msg, j) => (
              <div key={j} className="flex items-start gap-2 py-[3px]">
                <span className="shrink-0 text-xs opacity-80">{msg.direction === 'inbound' ? '📱' : '🤖'}</span>
                <p className={`min-w-0 flex-1 truncate text-[13px] ${msg.direction === 'inbound' ? 'text-ink' : 'text-muted'}`}>{msg.body}</p>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
