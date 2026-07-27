// src/components/MoneyPanel.jsx
//
// The money, on the screen. Phase 2 of the dashboard plan.
//
// The one number that decides whether a month was good has never been on this
// board — answering "how are we doing?" meant querying the database. Four
// figures, arranged so the reliable ones read first and the caveats read as
// caveats.

const rand = (n) =>
  typeof n === 'number'
    ? 'R' + n.toLocaleString('en-ZA', { maximumFractionDigits: 0 })
    : '—';

export default function MoneyPanel({ query, colors }) {
  const c = colors;
  const { data, isLoading, isError, refetch } = query || {};

  const wrap = (children) => (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: c.text }}>Money</h3>
      {children}
    </div>
  );

  if (isLoading) return wrap(<div style={{ fontSize: 13, color: c.muted }}>Adding it up…</div>);

  // Money is the figure people act on, so a failed load must never render as
  // R0 — a zero here is indistinguishable from a bad month.
  if (isError) {
    return wrap(
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        background: c.red + '11', border: '1px solid ' + c.red + '33', borderRadius: 12,
      }}>
        <span style={{ fontSize: 13, color: c.red }}>Couldn't load the figures — this is not R0.</span>
        <button
          onClick={() => refetch?.()}
          style={{
            padding: '5px 12px', background: c.red + '22', color: c.red,
            border: '1px solid ' + c.red + '44', borderRadius: 8,
            cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { collected, unconfirmed, outstanding, recurring } = data;
  const change = collected?.changePct;

  const tile = (label, value, note, noteTone) => (
    <div style={{
      flex: '1 1 160px', minWidth: 150, background: c.card,
      border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '14px 16px',
    }}>
      <div style={{ fontSize: 11, color: c.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.text, lineHeight: 1.1 }}>{value}</div>
      {note && (
        <div style={{ fontSize: 11, color: noteTone || c.muted, marginTop: 5 }}>{note}</div>
      )}
    </div>
  );

  return wrap(
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {tile(
        'Collected this month',
        rand(collected?.thisMonth),
        // A percentage against a month with no revenue is noise dressed as
        // insight, so the server sends null and we say nothing rather than
        // inventing a baseline.
        change === null || change === undefined
          ? `${collected?.count || 0} payment${collected?.count === 1 ? '' : 's'}`
          : `${change >= 0 ? '+' : ''}${change}% vs same point last month`,
        change === null || change === undefined ? c.muted : change >= 0 ? c.sage : c.amber
      )}

      {tile('Recurring', rand(recurring?.mrr) + '/mo', `${recurring?.tenants || 0} paying tenant${recurring?.tenants === 1 ? '' : 's'}`)}

      {tile(
        'Owed to us',
        rand(outstanding?.invoiced),
        outstanding?.overdueCount
          ? `${rand(outstanding.overdueAmount)} overdue`
          : 'nothing overdue',
        outstanding?.overdueCount ? c.amber : c.muted
      )}

      {/* Never folded into "collected" — this is money that may or may not
          exist, and the moment it joins a revenue figure the figure stops
          being trustworthy. */}
      {tile(
        'Unconfirmed',
        rand(unconfirmed?.amount),
        unconfirmed?.count
          ? `${unconfirmed.count} payment${unconfirmed.count === 1 ? '' : 's'} not confirmed`
          : 'all payments confirmed',
        unconfirmed?.count ? c.amber : c.muted
      )}
    </div>
  );
}
