// src/components/LadderConversion.jsx
//
// How each rung of the product ladder actually converts. Phase 3's third and
// last chart.
//
// The strategy is built on stepping customers DOWN a ladder rather than
// discounting, and up it as their needs grow. Nothing in the product has ever
// shown whether that works — which rungs get quoted, and which get paid.
//
// Rows rather than columns: there are five rungs with long names and a rate
// each, which is a table's shape, not a bar chart's. Drawing it as columns
// would cost the labels and gain nothing. The bar inside each row is the win
// rate, so the eye can run down the ladder and see where it converts.
//
// ── Why a rung with no quotes is blank, not 0% ──────────────────────────
//
// "Nobody bought at Premium" and "nobody was OFFERED Premium" are different
// findings, and the second is usually the actionable one. The server sends
// null for an unquoted rung and this renders "—", so the two never look alike.

const rand = (n) =>
  'R' + (n || 0).toLocaleString('en-ZA', { maximumFractionDigits: 0 });

export default function LadderConversion({ query, colors }) {
  const c = colors;
  const data = query?.data;
  const rungs = data?.rungs;

  if (!rungs?.length) return null;

  const anyActivity = rungs.some((r) => r.quoted > 0) || data.unmatched?.quoted > 0;
  if (!anyActivity) return null; // nothing quoted in the window — no chart to draw

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: c.text }}>Ladder conversion</h3>
        <span style={{ fontSize: 12, color: c.muted }}>quoted vs won, {data.windowDays} days</span>
      </div>

      <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '10px 14px' }}>
        {rungs.map((r) => (
          <div key={r.tier} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
            <span style={{ flex: '0 0 78px', fontSize: 13, color: r.quoted ? c.text : c.muted }}>{r.label}</span>

            <div style={{ flex: 1, minWidth: 40, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
              {r.winRate !== null && r.winRate !== undefined && (
                <div style={{ width: r.winRate + '%', height: '100%', background: c.lime, borderRadius: 999 }} />
              )}
            </div>

            <span style={{ flex: '0 0 42px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: r.winRate === null || r.winRate === undefined ? c.muted : c.lime }}>
              {r.winRate === null || r.winRate === undefined ? '—' : r.winRate + '%'}
            </span>
            <span style={{ flex: '0 0 96px', textAlign: 'right', fontSize: 11, color: c.muted }}>
              {r.quoted ? `${r.won}/${r.quoted} · ${rand(r.wonValue)}` : 'not offered'}
            </span>
          </div>
        ))}
      </div>

      {/* A number that can't be attributed is a fact about the data, not a
          rounding error. Shown only when non-zero, and worded as something to
          go and fix rather than a chart footnote. */}
      {data.unmatched?.quoted > 0 && (
        <div style={{ marginTop: 8, fontSize: 11, color: c.amber }}>
          {data.unmatched.quoted} invoice{data.unmatched.quoted === 1 ? '' : 's'} couldn't be matched to a
          catalog product — likely renamed since. Not counted in any rung above.
        </div>
      )}
    </div>
  );
}
