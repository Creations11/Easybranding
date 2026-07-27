// src/components/RevenueTrend.jsx
//
// Six months of collected revenue. Phase 3 of the dashboard plan — "three
// good charts beat a wall of tiles", and this is the first of them.
//
// Hand-drawn SVG rather than a charting library. The dependency would be
// larger than this file by two orders of magnitude, and every option a chart
// library gives you here is one this component should not have: the axis
// starts at zero, the scale is linear, and the bars are the same width. Those
// are the settings that make a bar chart honest, and they should not be
// adjustable.
//
// ── The one thing this chart must not do ────────────────────────────────
//
// The final bar is the CURRENT month, which is incomplete by definition. A
// part-month drawn identically to a full one reads as a collapse — the chart
// would be lying with entirely accurate data. It is drawn hollow and labelled
// "so far", so the shortfall is attributable rather than something the reader
// has to remember every time they look.

const rand = (n) =>
  'R' + (n || 0).toLocaleString('en-ZA', { maximumFractionDigits: 0 });

export default function RevenueTrend({ query, colors }) {
  const c = colors;
  const trend = query?.data?.trend;

  // Silent unless there is something real to draw. An empty chart frame is
  // decoration, and this panel is meant to earn its space.
  if (!trend?.length) return null;

  const peak = Math.max(...trend.map((m) => m.collected), 0);
  const complete = trend.filter((m) => !m.partial);
  const best = Math.max(...complete.map((m) => m.collected), 0);

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: c.text }}>Collected, 6 months</h3>
        {best > 0 && <span style={{ fontSize: 12, color: c.muted }}>best full month {rand(best)}</span>}
      </div>

      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 10,
        padding: '14px 16px 10px', background: c.card,
        border: '1px solid ' + c.borderDim, borderRadius: 12,
      }}>
        {trend.map((m) => {
          // Zero-height bars for empty months would look like missing data
          // rather than no revenue, so every bar keeps a visible baseline.
          const ratio = peak > 0 ? m.collected / peak : 0;
          const height = Math.max(3, Math.round(ratio * 90));

          return (
            <div key={m.month} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: c.muted, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {m.collected > 0 ? rand(m.collected) : '—'}
              </div>
              <div
                title={`${m.label}: ${rand(m.collected)}${m.partial ? ' so far' : ''}`}
                style={{
                  height, borderRadius: '4px 4px 0 0',
                  // Hollow for the incomplete month — different in FORM, not
                  // just colour, so it survives a phone screen in daylight.
                  background: m.partial ? 'transparent' : c.lime,
                  border: m.partial ? '1px dashed ' + c.lime : 'none',
                }}
              />
              <div style={{ fontSize: 11, color: m.partial ? c.lime : c.muted, marginTop: 5 }}>
                {m.label}
              </div>
              {m.partial && (
                <div style={{ fontSize: 9, color: c.muted }}>so far</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
