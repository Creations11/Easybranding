// src/components/crm/LeadsList.jsx
// Every lead as a sortable list: the view for finding someone, or for working
// down "waiting on us" one by one. Rows are flex, not a table or a grid, so
// they reflow on a phone into two lines instead of scrolling sideways.
import { useMemo, useState } from 'react';
import { c, BUCKET_TINT, INTENT, STAGE_LABEL, ago, day, who, followUpDue, byUrgency } from './crmHelpers';

const PAGE = 50;
const SORTS = [
  ['urgency', 'Most urgent'],
  ['recent', 'Latest activity'],
  ['oldest', 'Oldest activity'],
  ['name', 'Name'],
];

export default function LeadsList({ leads, buckets, onOpen, showBusiness, now }) {
  const [sort, setSort] = useState('urgency');
  const [limit, setLimit] = useState(PAGE);
  const label = Object.fromEntries(buckets.map((b) => [b.key, b.label]));

  const sorted = useMemo(() => {
    const list = [...leads];
    if (sort === 'urgency') return list.sort(byUrgency(now));
    if (sort === 'recent') return list.sort((a, b) => new Date(b.lastActivityAt || 0) - new Date(a.lastActivityAt || 0));
    if (sort === 'oldest') return list.sort((a, b) => new Date(a.lastActivityAt || 0) - new Date(b.lastActivityAt || 0));
    return list.sort((a, b) => who(a).localeCompare(who(b)));
  }, [leads, sort, now]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
        <span style={{ color: c.muted, fontSize: 12 }}>{leads.length} lead{leads.length === 1 ? '' : 's'}</span>
        <label style={{ fontSize: 12, color: c.muted, display: 'flex', gap: 6, alignItems: 'center' }}>
          Sort
          <select aria-label="Sort leads" value={sort} onChange={(e) => setSort(e.target.value)} style={{ background: c.card, color: c.text, border: '1px solid ' + c.borderDim, borderRadius: 8, padding: '5px 8px', fontFamily: 'inherit', fontSize: 12 }}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>
      <div style={{ border: '1px solid ' + c.borderDim, borderRadius: 12, overflow: 'hidden' }}>
        {sorted.length === 0 && <div style={{ padding: 28, textAlign: 'center', color: c.muted, fontSize: 13 }}>Nobody matches these filters.</div>}
        {sorted.slice(0, limit).map((l) => {
          const intent = INTENT[l.intent];
          const tint = BUCKET_TINT[l.bucket];
          return (
            <button key={l.id} type="button" onClick={() => onOpen(l.id)} data-testid={`lead-row-${l.id}`} style={{
              width: '100%', display: 'flex', flexWrap: 'wrap', gap: '4px 14px', alignItems: 'center', textAlign: 'left',
              padding: '11px 14px', background: l.waitingSince ? c.red + '0A' : 'transparent', border: 'none',
              borderBottom: '1px solid ' + c.borderDim, cursor: 'pointer', fontFamily: 'inherit', color: c.text,
            }}>
              <span style={{ flex: '1 1 200px', minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{who(l)}</span>
                <span style={{ display: 'block', fontSize: 12, color: c.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.name ? l.phone : ''}{showBusiness && l.business ? `${l.name ? ' · ' : ''}${l.business}` : ''}
                </span>
              </span>
              <span style={{ flex: '0 0 auto', fontSize: 11, fontWeight: 700, color: tint, background: tint + '14', border: '1px solid ' + tint + '33', borderRadius: 999, padding: '3px 9px' }}>
                {label[l.bucket]}{l.stage && STAGE_LABEL[l.stage] && STAGE_LABEL[l.stage] !== label[l.bucket] ? ` · ${STAGE_LABEL[l.stage]}` : ''}
              </span>
              <span style={{ flex: '0 0 64px', fontSize: 12, color: intent ? intent.tint : c.muted }}>{intent ? `${intent.icon} ${intent.label}` : '—'}</span>
              <span style={{ flex: '0 0 130px', fontSize: 12, color: l.waitingSince ? c.red : followUpDue(l, now) ? c.amber : c.muted, fontWeight: l.waitingSince ? 700 : 400 }}>
                {l.waitingSince ? `waiting ${ago(l.waitingSince, now)}` : followUpDue(l, now) ? 'follow-up due' : l.followUpAt && l.bucket !== 'lost' && l.bucket !== 'won' ? `follow up ${day(l.followUpAt)}` : ''}
              </span>
              <span style={{ flex: '0 0 56px', fontSize: 12, color: c.muted, textAlign: 'right' }}>{ago(l.lastActivityAt, now)}</span>
            </button>
          );
        })}
      </div>
      {sorted.length > limit && (
        <button type="button" onClick={() => setLimit((n) => n + PAGE)} style={{ marginTop: 10, width: '100%', padding: 10, background: 'transparent', border: '1px dashed ' + c.borderDim, color: c.muted, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
          Show {Math.min(PAGE, sorted.length - limit)} more
        </button>
      )}
    </div>
  );
}
