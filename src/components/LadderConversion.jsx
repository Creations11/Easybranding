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

import Panel from './ui/Panel';
import BarRow from './ui/BarRow';

const rand = (n) =>
  'R' + (n || 0).toLocaleString('en-ZA', { maximumFractionDigits: 0 });

export default function LadderConversion({ query }) {
  const data = query?.data;
  const rungs = data?.rungs;

  if (!rungs?.length) return null;

  const anyActivity = rungs.some((r) => r.quoted > 0) || data.unmatched?.quoted > 0;
  if (!anyActivity) return null; // nothing quoted in the window — no chart to draw

  return (
    <Panel title="Ladder conversion" meta={`quoted vs won, ${data.windowDays} days`}>
      <div className="rounded-xl border border-edge bg-card px-3.5 py-2.5">
        {rungs.map((r) => (
          <BarRow
            key={r.tier}
            label={r.label}
            pct={r.winRate}
            meta={r.quoted ? `${r.won}/${r.quoted} · ${rand(r.wonValue)}` : 'not offered'}
          />
        ))}
      </div>

      {/* A number that can't be attributed is a fact about the data, not a
          rounding error. Shown only when non-zero, and worded as something to
          go and fix rather than a chart footnote. */}
      {data.unmatched?.quoted > 0 && (
        <div className="mt-2 text-[11px] text-amber">
          {data.unmatched.quoted} invoice{data.unmatched.quoted === 1 ? '' : 's'} couldn't be matched to a
          catalog product — likely renamed since. Not counted in any rung above.
        </div>
      )}
    </Panel>
  );
}
