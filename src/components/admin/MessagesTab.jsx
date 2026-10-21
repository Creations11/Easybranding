import { colors } from '../../utils/theme';

export default function MessagesTab({ recentMessages, setLeadDetailId }) {
  return (
    <div>
      {/* One card per sender, their recent messages inside it, ordered
          by who spoke last. The flat version gave every message its own
          card, so one person sending six things in a row filled the
          screen and quieter people dropped off the bottom. */}
      <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Recent Messages ({recentMessages.length} {recentMessages.length === 1 ? 'conversation' : 'conversations'})</h2>
      {recentMessages.length === 0 ? (
        <p style={{ color: colors.muted, textAlign: 'center', padding: '60px 0' }}>No messages yet.</p>
      ) : recentMessages.map((convo) => {
        const thread = convo.messages || [];
        const latest = thread[thread.length - 1];
        const hidden = (convo.totalMessages || thread.length) - thread.length;
        return (
          <div key={convo.leadId} onClick={() => setLeadDetailId(convo.leadId)}
            style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '12px', padding: '14px 18px', marginBottom: '10px', cursor: 'pointer' }}>

            {/* The sender, once */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: thread.length ? '10px' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <strong style={{ fontSize: '14px' }}>{convo.name && convo.name !== 'Unknown' ? convo.name : convo.phone}</strong>
                {convo.takenOver && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: `${colors.amber}22`, color: colors.amber, flexShrink: 0 }}>taken over</span>}
                <span style={{ fontSize: '11px', color: colors.muted, flexShrink: 0 }}>{convo.totalMessages || thread.length} msgs</span>
              </div>
              <span style={{ fontSize: '11px', color: colors.muted, flexShrink: 0 }}>
                {latest ? new Date(latest.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>

            {/* …then the messages, oldest first so it reads like a chat */}
            {hidden > 0 && (
              <p style={{ fontSize: '11px', color: colors.muted, marginBottom: '6px' }}>+{hidden} earlier — open to read the rest</p>
            )}
            {thread.map((msg, j) => (
              <div key={j} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '3px 0' }}>
                <span style={{ fontSize: '12px', flexShrink: 0, opacity: 0.8 }}>{msg.direction === 'inbound' ? '📱' : '🤖'}</span>
                <p style={{ color: msg.direction === 'inbound' ? colors.text : colors.muted, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>{msg.body}</p>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
