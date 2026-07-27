// src/components/SalesFunnel.jsx
//
// Where deals stall. Fed by GET /admin-ops/sales-funnel.
//
// The milestone timestamps have been accumulating with nothing reading them.
// This is what makes follow-up tuning evidence-based rather than guesswork:
// optimising follow-up before you know where the funnel leaks is optimising
// the wrong stage.
//
// Stages this pipeline never uses are hidden rather than drawn as zero rows.
// Forward transitions are free by design, so most conversations skip several
// stages — a row of zeroes at `qualification` would read as total failure
// when qualification simply is not part of how this business sells.

const LABEL = {
  greeting: 'First contact',
  discovery: 'Discovery',
  qualification: 'Qualified',
  recommendation: 'Recommended',
  objection_handling: 'Objection raised',
  trial_close: 'Asked for the sale',
  commitment: 'They said yes',
  quote_generated: 'Quote sent',
  payment_sent: 'Payment link sent',
  payment_confirmed: 'Paid',
  onboarding: 'Onboarding',
};

const duration = (secs) => {
  if (secs === null || secs === undefined) return null;
  if (secs < 90) return `${secs}s`;
  if (secs < 5400) return `${Math.round(secs / 60)} min`;
  if (secs < 172800) return `${Math.round(secs / 3600)}h`;
  return `${Math.round(secs / 86400)} days`;
};

export default function SalesFunnel({ query, colors }) {
  const c = colors;
  const data = query?.data;
  if (!data?.funnel?.length || !data.entered) return null;

  const rows = data.funnel.filter((f) => f.used);
  const { biggestDropOff: leak, commitmentToCashPct, committed, paid } = data;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: c.text }}>Sales funnel</h3>
        <span style={{ fontSize: 12, color: c.muted }}>
          {data.entered} conversation{data.entered === 1 ? '' : 's'}, {data.windowDays} days
        </span>
      </div>

      {/* The one actionable sentence. Stated before the table, because it is
          the thing to act on and the table is the evidence for it. */}
      {leak && (
        <div style={{
          padding: '9px 14px', marginBottom: 10, borderRadius: 10,
          background: c.amber + '11', border: '1px solid ' + c.amber + '33',
          fontSize: 12, color: c.amber,
        }}>
          Biggest drop-off at <strong>{LABEL[leak.stage] || leak.stage}</strong> — {leak.lost} lost,
          only {leak.keptPct}% got through.
        </div>
      )}

      <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '10px 14px' }}>
        {rows.map((f) => {
          const width = Math.max(2, f.pctOfEntered ?? 0);
          const took = duration(f.medianSecondsFromPrevious);
          // System-owned milestones are facts, not the agent's read of the
          // conversation. Worth distinguishing: a leak before "Quote sent" is
          // a selling problem, after it is a payment problem.
          const tone = f.owner === 'system' ? c.cyan : c.lime;

          return (
            <div key={f.stage} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
              <span style={{ flex: '0 0 130px', fontSize: 12, color: c.text }}>{LABEL[f.stage] || f.stage}</span>
              <div style={{ flex: 1, minWidth: 30, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: width + '%', height: '100%', background: tone, borderRadius: 999 }} />
              </div>
              <span style={{ flex: '0 0 34px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: c.text }}>{f.count}</span>
              <span style={{ flex: '0 0 42px', textAlign: 'right', fontSize: 11, color: c.muted }}>
                {f.pctOfPrevious === null ? '' : f.pctOfPrevious + '%'}
              </span>
              <span style={{ flex: '0 0 58px', textAlign: 'right', fontSize: 11, color: c.muted }}>{took || ''}</span>
            </div>
          );
        })}
      </div>

      {/* Null when nobody has committed yet — different from 0%, which would
          say the closing works and the payment step doesn't. */}
      {commitmentToCashPct !== null && commitmentToCashPct !== undefined && (
        <div style={{ marginTop: 8, fontSize: 12, color: c.muted }}>
          {commitmentToCashPct}% of the {committed} customer{committed === 1 ? '' : 's'} who agreed
          actually paid ({paid}).
        </div>
      )}
    </div>
  );
}
