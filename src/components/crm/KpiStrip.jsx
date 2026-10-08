// src/components/crm/KpiStrip.jsx
// The numbers that say whether today is under control, each one a shortcut
// to the leads behind it. Flex rather than grid: the dashboard forces every
// grid to one column on a phone, which turns six numbers into a page.
import { c } from './crmHelpers';

function Kpi({ label, value, tint, hint, onClick, active }) {
  return (
    <button type="button" onClick={onClick} title={hint} style={{
      flex: '1 1 92px', minWidth: 0, textAlign: 'left', cursor: onClick ? 'pointer' : 'default', fontFamily: 'inherit',
      background: active ? tint + '14' : c.card, border: '1px solid ' + (active ? tint : c.borderDim), borderRadius: 12, padding: '8px 10px',
    }}>
      <div style={{ color: c.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ color: tint, fontSize: 21, fontWeight: 800, fontFamily: "'Fraunces', serif", lineHeight: 1.15 }}>{value ?? '—'}</div>
    </button>
  );
}

export default function KpiStrip({ summary, onPick, active }) {
  const s = summary || {};
  const b = s.byBucket || {};
  const open = (b.new || 0) + (b.talking || 0) + (b.offered || 0) + (b.committed || 0) + (b.link_sent || 0);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
      <Kpi label="Waiting on us" value={s.waiting} tint={s.waiting ? c.red : c.emerald} hint="Their last message is newer than our last reply" onClick={() => onPick('waiting')} active={active === 'waiting'} />
      <Kpi label="Follow-ups due" value={s.followUpsDue} tint={s.followUpsDue ? c.amber : c.muted} onClick={() => onPick('due')} active={active === 'due'} />
      <Kpi label="Hot" value={s.hot} tint={c.red} hint="Open leads the agent judged hot" onClick={() => onPick('hot')} active={active === 'hot'} />
      <Kpi label="Open pipeline" value={summary ? open : null} tint={c.cyan} hint="Everyone not yet paid or lost" />
      <Kpi label="Link sent" value={b.link_sent} tint={c.lime} hint="A payment link went out; not paid yet" onClick={() => onPick('link_sent')} active={active === 'link_sent'} />
      <Kpi label="Paid" value={b.won} tint={c.emerald} />
      <Kpi label="New this week" value={s.newThisWeek} tint={c.text} />
    </div>
  );
}
