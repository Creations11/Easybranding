// src/components/crm/LeadCard.jsx
// One lead on the board: who, what they last said, and the one thing that
// matters most about it right now (waiting on us, a follow-up due, hot).
import { c, INTENT, ago, who, followUpDue, STAGE_LABEL } from './crmHelpers';

export default function LeadCard({ lead, onOpen, showBusiness, now }) {
  const intent = INTENT[lead.intent];
  const due = followUpDue(lead, now);
  return (
    <button
      type="button"
      onClick={() => onOpen(lead.id)}
      data-testid={`lead-card-${lead.id}`}
      style={{
        width: '100%', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', display: 'block',
        background: c.card, borderRadius: 10, padding: '10px 12px', marginBottom: 8,
        border: '1px solid ' + (lead.waitingSince ? c.red + '66' : c.borderDim),
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
        <span style={{ color: c.text, fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{who(lead)}</span>
        <span style={{ color: c.muted, fontSize: 11, flexShrink: 0 }}>{ago(lead.lastActivityAt, now)}</span>
      </div>
      {showBusiness && lead.business && <div style={{ color: c.cyan, fontSize: 11, marginTop: 1 }}>{lead.business}</div>}
      {lead.lastText && (
        <div style={{ color: c.muted, fontSize: 12, marginTop: 4, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere' }}>
          {lead.lastText}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, fontSize: 11 }}>
        {lead.waitingSince && <span style={{ color: c.red, fontWeight: 700 }}>⏳ waiting {ago(lead.waitingSince, now)}</span>}
        {due && <span style={{ color: c.amber, fontWeight: 700 }}>⏰ follow-up due</span>}
        {intent && <span style={{ color: intent.tint }}>{intent.icon} {intent.label}</span>}
        {lead.stage && lead.bucket !== 'lost' && <span style={{ color: c.muted }}>{STAGE_LABEL[lead.stage] || lead.stage}</span>}
        {lead.takenOver && <span style={{ color: c.orange }}>👤 taken over</span>}
        {lead.fromAd && <span style={{ color: c.muted }}>ad</span>}
        {lead.notesCount > 0 && <span style={{ color: c.muted }}>📝 {lead.notesCount}</span>}
        {lead.closeReason && <span style={{ color: c.muted }}>{lead.closeReason.replace(/^Lost:\s*/, '')}</span>}
      </div>
    </button>
  );
}
