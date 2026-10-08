// src/components/prospecting/ContactList.jsx
// Everyone on the prospect list: find them, see what happened to the last
// message (Meta's own word, including a decline), and record how it went.
import { useMemo, useState } from 'react';
import { useProspectingActions, prospectingError } from '../../hooks/useProspecting';
import { Card, Pill, Empty, Notice } from './ui';
import { c, input, day, displayName } from './helpers';

const STATUS = {
  pending: ['not messaged', c.muted], sent: ['sent', c.cyan], delivered: ['delivered', c.emerald],
  replied: ['replied', c.lime], not_interested: ['not interested', c.red], no_reply: ['no reply', c.muted],
  converted: ['converted', c.lime], demo_booked: ['demo booked', c.earth],
};

const FILTERS = [
  ['all', 'All', () => true],
  ['pending', 'Not messaged', (p) => p.status === 'pending'],
  ['sent', 'Messaged', (p) => !!p.sentAt],
  ['replied', 'Replied', (p) => p.status === 'replied'],
  ['declined', 'Not delivered', (p) => p.deliveryStatus === 'failed'],
  ['won', 'Converted', (p) => p.outcome === 'converted' || p.status === 'converted'],
];

const OUTCOMES = [['', 'How did it go?'], ['hot_lead', 'Hot lead'], ['warm_lead', 'Warm lead'], ['demo_booked', 'Demo booked'], ['converted', 'Converted'], ['not_interested', 'Not interested'], ['no_reply', 'No reply']];

/** What Meta said about the last message, in words. */
const delivery = (p) => {
  if (p.deliveryStatus === 'read') return ['read', c.emerald];
  if (p.deliveryStatus === 'delivered') return ['delivered', c.emerald];
  if (p.deliveryStatus === 'failed') {
    const declined = /131049|130472/.test(p.deliveryError || '');
    return [declined ? 'declined by Meta' : 'not delivered', c.red, p.deliveryError];
  }
  return null;
};

function Row({ p, canManage }) {
  const { setOutcome, remove } = useProspectingActions();
  const [problem, setProblem] = useState('');
  const [label, tint] = STATUS[p.status] || [p.status, c.muted];
  const d = delivery(p);

  const onOutcome = async (e) => {
    setProblem('');
    try { await setOutcome(p._id, e.target.value || null); } catch (err) { setProblem(prospectingError(err)); }
  };
  const onRemove = async () => {
    if (!window.confirm(`Remove ${displayName(p)} from the prospect list?`)) return;
    try { await remove(p._id); } catch (err) { setProblem(prospectingError(err)); }
  };

  return (
    <div data-testid={`contact-${p._id}`} style={{ padding: '12px 4px', borderBottom: '1px solid ' + c.borderDim }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: c.text }}>{displayName(p)}</div>
          <div style={{ fontSize: 12, color: c.muted }}>{p.phone}{p.agencyName ? ' · ' + p.agencyName : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* While the last message is the whole story, Meta's receipt says it
              better than "sent"; once they reply or decline, the status leads. */}
          {!(d && ['sent', 'delivered'].includes(p.status)) && <Pill text={label} tint={tint} />}
          {d && <Pill text={d[0]} tint={d[1]} title={d[2] || ''} />}
          {p.sentAt && <span style={{ fontSize: 11, color: c.muted }}>{day(p.sentAt)}</span>}
          <select aria-label={`Outcome for ${displayName(p)}`} value={p.outcome || ''} onChange={onOutcome} style={{ ...input, width: 'auto', padding: '5px 8px', fontSize: 12 }}>
            {OUTCOMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {canManage && (
            <button type="button" onClick={onRemove} aria-label={`Remove ${displayName(p)}`} style={{ background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontSize: 15 }}>✕</button>
          )}
        </div>
      </div>
      {p.replyText && <div style={{ fontSize: 12, color: c.text, marginTop: 6, fontStyle: 'italic', overflowWrap: 'anywhere' }}>“{p.replyText}”</div>}
      {d?.[2] && <div style={{ fontSize: 11, color: c.red, marginTop: 4 }}>{d[2]}</div>}
      {problem && <div style={{ fontSize: 12, color: c.red, marginTop: 4 }}>{problem}</div>}
    </div>
  );
}

export default function ContactList({ prospects, canManage, onAdd }) {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  const counts = useMemo(() => Object.fromEntries(FILTERS.map(([k, , test]) => [k, prospects.filter(test).length])), [prospects]);
  const shown = useMemo(() => {
    const test = FILTERS.find(([k]) => k === filter)[2];
    const needle = q.trim().toLowerCase();
    return prospects.filter(test).filter((p) => !needle || [p.name, p.phone, p.agencyName, p.replyText].some((v) => v && String(v).toLowerCase().includes(needle)));
  }, [prospects, filter, q]);

  if (!prospects.length) {
    return (
      <Empty icon="📇">
        No contacts yet.{' '}
        <button type="button" onClick={onAdd} style={{ background: 'none', border: 'none', color: c.lime, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', padding: 0 }}>Add your first ones</button>.
      </Empty>
    );
  }

  return (
    <Card>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {FILTERS.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setFilter(k)} style={{
            padding: '6px 12px', borderRadius: 999, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
            background: filter === k ? c.lime + '1A' : 'transparent', color: filter === k ? c.lime : c.muted, border: '1px solid ' + (filter === k ? c.lime : c.borderDim),
          }}>{l} ({counts[k]})</button>
        ))}
      </div>
      <input aria-label="Find a contact" placeholder="Find by name, number, business or reply" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...input, marginBottom: 8 }} />
      {counts.declined > 0 && filter !== 'declined' && (
        <Notice tone="warn">{counts.declined} message{counts.declined === 1 ? ' was' : 's were'} not delivered. Meta declines some marketing messages per person; the reason is on each contact.</Notice>
      )}
      {shown.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: c.muted, fontSize: 13 }}>Nobody matches that.</div>
        : shown.map((p) => <Row key={p._id} p={p} canManage={canManage} />)}
    </Card>
  );
}
