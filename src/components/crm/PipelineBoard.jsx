// src/components/crm/PipelineBoard.jsx
// The pipeline as columns, one per sales stage. Each column is sorted the way
// it is worked: whoever has waited longest for us first. Columns scroll
// sideways on a phone rather than squeezing; Lost folds away unless asked.
import { useState } from 'react';
import LeadCard from './LeadCard';
import { c, BUCKET_TINT, byUrgency } from './crmHelpers';

const PAGE = 40;

function Column({ bucket, leads, onOpen, showBusiness, now }) {
  const [limit, setLimit] = useState(PAGE);
  const tint = BUCKET_TINT[bucket.key] || c.muted;
  const waiting = leads.filter((l) => l.waitingSince).length;
  return (
    <section aria-label={bucket.label} style={{ flex: '0 0 272px', minWidth: 0, display: 'flex', flexDirection: 'column', maxHeight: '72vh' }}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', marginBottom: 8,
        background: tint + '12', border: '1px solid ' + tint + '33', borderRadius: 10,
      }}>
        <span style={{ color: tint, fontWeight: 800, fontSize: 13 }}>{bucket.label}</span>
        <span style={{ fontSize: 12, color: c.muted }}>
          {waiting > 0 && <span style={{ color: c.red, fontWeight: 700, marginRight: 6 }}>{waiting} waiting</span>}
          {leads.length}
        </span>
      </header>
      <div style={{ overflowY: 'auto', paddingRight: 2 }}>
        {leads.length === 0
          ? <div style={{ color: c.muted, fontSize: 12, textAlign: 'center', padding: '18px 8px', border: '1px dashed ' + c.borderDim, borderRadius: 10 }}>Nobody here</div>
          : leads.slice(0, limit).map((l) => <LeadCard key={l.id} lead={l} onOpen={onOpen} showBusiness={showBusiness} now={now} />)}
        {leads.length > limit && (
          <button type="button" onClick={() => setLimit((n) => n + PAGE)} style={{ width: '100%', padding: 8, background: 'transparent', border: '1px dashed ' + c.borderDim, color: c.muted, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
            Show {Math.min(PAGE, leads.length - limit)} more
          </button>
        )}
      </div>
    </section>
  );
}

export default function PipelineBoard({ buckets, leads, onOpen, showBusiness, showClosed, now }) {
  const sort = byUrgency(now);
  const shown = buckets.filter((b) => showClosed || b.key !== 'lost');
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, alignItems: 'flex-start' }}>
      {shown.map((b) => (
        <Column key={b.key} bucket={b} leads={leads.filter((l) => l.bucket === b.key).sort(sort)} onOpen={onOpen} showBusiness={showBusiness} now={now} />
      ))}
    </div>
  );
}
