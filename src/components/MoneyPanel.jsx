// src/components/MoneyPanel.jsx
//
// The money, on the screen. Phase 2 of the dashboard plan.
//
// The one number that decides whether a month was good has never been on this
// board — answering "how are we doing?" meant querying the database. Four
// figures, arranged so the reliable ones read first and the caveats read as
// caveats.

import Panel from './ui/Panel';
import StatTile from './ui/StatTile';
import Button from './ui/Button';

const rand = (n) =>
  typeof n === 'number'
    ? 'R' + n.toLocaleString('en-ZA', { maximumFractionDigits: 0 })
    : '—';

export default function MoneyPanel({ query }) {
  const { data, isLoading, isError, refetch } = query || {};

  if (isLoading) {
    return (
      <Panel title="Money">
        <div className="text-[13px] text-muted">Adding it up…</div>
      </Panel>
    );
  }

  // Money is the figure people act on, so a failed load must never render as
  // R0 — a zero here is indistinguishable from a bad month.
  if (isError) {
    return (
      <Panel title="Money">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red/20 bg-red/7 px-4 py-3">
          <span className="text-[13px] text-red">Couldn't load the figures — this is not R0.</span>
          <Button variant="danger" onClick={() => refetch?.()}>Retry</Button>
        </div>
      </Panel>
    );
  }

  if (!data) return null;

  const { collected, unconfirmed, outstanding, recurring } = data;
  const change = collected?.changePct;

  return (
    <Panel title="Money">
      <div className="flex flex-wrap gap-2.5">
        <StatTile
          label="Collected this month"
          value={rand(collected?.thisMonth)}
          // A percentage against a month with no revenue is noise dressed as
          // insight, so the server sends null and we say nothing rather than
          // inventing a baseline.
          note={
            change === null || change === undefined
              ? `${collected?.count || 0} payment${collected?.count === 1 ? '' : 's'}`
              : `${change >= 0 ? '+' : ''}${change}% vs same point last month`
          }
          noteTone={change === null || change === undefined ? 'muted' : change >= 0 ? 'good' : 'warn'}
        />

        <StatTile
          label="Recurring"
          value={rand(recurring?.mrr) + '/mo'}
          note={`${recurring?.tenants || 0} paying tenant${recurring?.tenants === 1 ? '' : 's'}`}
        />

        <StatTile
          label="Owed to us"
          value={rand(outstanding?.invoiced)}
          note={outstanding?.overdueCount ? `${rand(outstanding.overdueAmount)} overdue` : 'nothing overdue'}
          noteTone={outstanding?.overdueCount ? 'warn' : 'muted'}
        />

        {/* Never folded into "collected" — this is money that may or may not
            exist, and the moment it joins a revenue figure the figure stops
            being trustworthy. */}
        <StatTile
          label="Unconfirmed"
          value={rand(unconfirmed?.amount)}
          note={
            unconfirmed?.count
              ? `${unconfirmed.count} payment${unconfirmed.count === 1 ? '' : 's'} not confirmed`
              : 'all payments confirmed'
          }
          noteTone={unconfirmed?.count ? 'warn' : 'muted'}
        />
      </div>
    </Panel>
  );
}
