// src/components/LeadTrend.jsx
//
// New leads per day for two weeks, with the qualified share stacked inside.
// Phase 3 of the dashboard plan — the second of the "few good charts".
//
// The revenue trend answers "did the month pay". This answers "is the top of
// the funnel working", which is the thing that moves first when a flow breaks,
// a number goes quiet, or a campaign lands.
//
// ── Why stacked rather than side by side ────────────────────────────────
//
// Qualified leads are a SUBSET of that day's leads, not a separate quantity.
// Two adjacent bars would invite reading them as independent series and make
// a day with 4 leads and 4 qualified look like 8 arrivals. Stacking encodes
// the containment, so the comparison you can make by eye is the true one.
//
// Same rules as RevenueTrend, on purpose: every day present even at zero, the
// incomplete final bucket drawn differently, and no charting library. Two
// charts on one page that treated gaps and part-periods differently would be
// a worse problem than either chart solves.

export default function LeadTrend({ query, colors }) {
  const c = colors;
  const data = query?.data;
  const days = data?.days;

  if (!days?.length) return null;

  const peak = Math.max(...days.map((d) => d.leads), 0);
  // Nothing arrived in two weeks. A row of empty bars would imply the chart
  // is broken; saying it plainly is both shorter and true.
  if (peak === 0) {
    return (
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: c.text }}>New leads, 14 days</h3>
        <div style={{
          padding: '12px 16px', background: c.card, border: '1px solid ' + c.borderDim,
          borderRadius: 12, fontSize: 13, color: c.amber,
        }}>
          No new leads in the last two weeks.
        </div>
      </div>
    );
  }

  const { leads = 0, qualified = 0, qualifiedPct } = data.totals || {};

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: c.text }}>New leads, 14 days</h3>
        <span style={{ fontSize: 12, color: c.muted }}>
          {/* null means "nothing to divide" — different from 0%, and it must
              not be rendered as though the funnel converted nobody. */}
          {qualifiedPct === null || qualifiedPct === undefined
            ? `${leads} lead${leads === 1 ? '' : 's'}`
            : `${qualified} of ${leads} qualified · ${qualifiedPct}%`}
        </span>
      </div>

      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 4,
        padding: '14px 14px 8px', background: c.card,
        border: '1px solid ' + c.borderDim, borderRadius: 12,
      }}>
        {days.map((d) => {
          const total = Math.max(3, Math.round((d.leads / peak) * 80));
          const qual = d.leads > 0 ? Math.round((d.qualified / d.leads) * total) : 0;

          return (
            <div key={d.date} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
              <div
                title={`${d.label}: ${d.leads} lead${d.leads === 1 ? '' : 's'}, ${d.qualified} qualified${d.partial ? ' so far' : ''}`}
                style={{
                  height: total, borderRadius: '3px 3px 0 0',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  // Today is incomplete: outlined rather than filled, so it is
                  // different in FORM and survives a bad phone screen.
                  background: d.partial ? 'transparent' : c.cyan + '44',
                  border: d.partial ? '1px dashed ' + c.cyan : 'none',
                  overflow: 'hidden',
                }}
              >
                {/* The qualified share sits INSIDE the day's bar — it is a
                    subset, and the drawing should not allow any other reading. */}
                {qual > 0 && (
                  <div style={{ height: qual, background: d.partial ? c.lime + '55' : c.lime }} />
                )}
              </div>
              <div style={{ fontSize: 9, color: d.partial ? c.cyan : c.muted, marginTop: 4 }}>
                {d.weekday}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11, color: c.muted, flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: c.cyan + '44', marginRight: 5 }} />arrived</span>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: c.lime, marginRight: 5 }} />qualified</span>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, border: '1px dashed ' + c.cyan, marginRight: 5 }} />today, still counting</span>
      </div>
    </div>
  );
}
