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

import Panel from './ui/Panel';
import BarRow from './ui/BarRow';

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

export default function SalesFunnel({ query }) {
  const data = query?.data;
  if (!data?.funnel?.length || !data.entered) return null;

  const rows = data.funnel.filter((f) => f.used);
  const { biggestDropOff: leak, commitmentToCashPct, committed, paid } = data;

  return (
    <Panel
      title="Sales funnel"
      meta={`${data.entered} conversation${data.entered === 1 ? '' : 's'}, ${data.windowDays} days`}
    >
      {/* The one actionable sentence. Stated before the table, because it is
          the thing to act on and the table is the evidence for it. */}
      {leak && (
        <div className="mb-2.5 rounded-[10px] border border-amber/20 bg-amber/7 px-3.5 py-[9px] text-xs text-amber">
          Biggest drop-off at <strong>{LABEL[leak.stage] || leak.stage}</strong> — {leak.lost} lost,
          only {leak.keptPct}% got through.
        </div>
      )}

      <div className="rounded-xl border border-edge bg-card px-3.5 py-2.5">
        {rows.map((f) => {
          const took = duration(f.medianSecondsFromPrevious);
          // System-owned milestones are facts, not the agent's read of the
          // conversation. Worth distinguishing: a leak before "Quote sent" is
          // a selling problem, after it is a payment problem.
          const tone = f.owner === 'system' ? 'cyan' : 'lime';

          return (
            <BarRow
              key={f.stage}
              label={LABEL[f.stage] || f.stage}
              pct={Math.max(2, f.pctOfEntered ?? 0)}
              value={f.count}
              valueTone="ink"
              tone={tone}
              meta={[f.pctOfPrevious === null ? '' : f.pctOfPrevious + '%', took || '']}
            />
          );
        })}
      </div>

      {/* Null when nobody has committed yet — different from 0%, which would
          say the closing works and the payment step doesn't. */}
      {commitmentToCashPct !== null && commitmentToCashPct !== undefined && (
        <div className="mt-2 text-xs text-muted">
          {commitmentToCashPct}% of the {committed} customer{committed === 1 ? '' : 's'} who agreed
          actually paid ({paid}).
        </div>
      )}
    </Panel>
  );
}
