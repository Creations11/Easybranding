// src/components/TodayVerdict.jsx
//
// One line, read in two seconds: is today fine?
//
// Phase 3 of docs/DASHBOARD-UPGRADE-PLAN.md — "the board should answer 'is
// today fine?' in two seconds and 'why not?' in two clicks". Phases 1 and 2
// put the facts on the screen; this is the sentence you read before any of
// them, so you can stop reading if the answer is yes.
//
// ── The one rule that shapes this component ─────────────────────────────
//
// A verdict is a claim about the WHOLE system, so it may only be positive
// when every input that could contradict it actually arrived. "All clear"
// derived from three failed requests is not optimism, it is a lie with a
// green dot next to it — and it is more dangerous than any single panel
// failing, because a reassuring summary stops you looking at the detail.
//
// So: any query still loading → "checking". Any query errored → "can't
// tell", never "fine". Only a complete, successful picture earns the
// all-clear.

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function TodayVerdict({ owedWork, health, colors, onScrollToWork }) {
  const c = colors;
  const queries = [owedWork, health].filter(Boolean);
  if (!queries.length) return null;

  const anyLoading = queries.some((q) => q.isLoading);
  const failed = queries.filter((q) => q.isError);

  const owedCount = owedWork?.data?.total ?? 0;
  const warningCount = health?.data?.warnings?.length ?? 0;

  // Severity of the worst thing outstanding, used to pick the tone. A rail
  // full of "soon" items should not read the same as one unconfirmed payment.
  const worst = owedWork?.data?.items?.[0]?.severity || null;

  let tone, dot, headline, sub;

  if (anyLoading) {
    tone = c.muted;
    dot = c.cyan;
    headline = 'Checking…';
    sub = null;
  } else if (failed.length) {
    // Deliberately NOT green. An incomplete picture cannot produce an
    // all-clear, and saying so plainly is the entire point of this line.
    tone = c.amber;
    dot = c.amber;
    headline = "Can't tell right now";
    // Worded differently from the panels' own error states on purpose: the
    // same sentence repeated three times down the page reads as one fault
    // stuttering rather than three independent things to look at.
    sub = `${failed.length === queries.length ? 'The checks' : 'Some checks'} below didn't load, so this line can't be trusted yet.`;
  } else if (owedCount === 0 && warningCount === 0) {
    tone = c.sage;
    dot = c.lime;
    headline = 'Today is fine';
    sub = 'Nothing needs you, and nothing is misconfigured.';
  } else {
    const parts = [];
    if (owedCount) parts.push(plural(owedCount, 'thing') + ' need' + (owedCount === 1 ? 's' : '') + ' you');
    if (warningCount) parts.push(plural(warningCount, 'thing') + ' misconfigured');

    tone = worst === 'high' ? c.red : c.amber;
    dot = tone;
    headline = parts.join(' · ');
    sub = owedCount ? 'Details below.' : null;
  }

  const clickable = Boolean(onScrollToWork && (owedCount || warningCount));

  return (
    <div
      onClick={clickable ? onScrollToWork : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '12px 16px', marginBottom: 18,
        background: c.card, border: '1px solid ' + c.borderDim,
        borderLeft: '3px solid ' + tone, borderRadius: 12,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <span
        aria-hidden="true"
        style={{ width: 9, height: 9, borderRadius: '50%', background: dot, flex: 'none' }}
      />
      {/* The verdict is carried by the words, not the colour — this board is
          read on a phone in daylight, and by people who don't see red. */}
      <strong style={{ fontSize: 15, color: tone }}>{headline}</strong>
      {sub && <span style={{ fontSize: 13, color: c.muted }}>{sub}</span>}
    </div>
  );
}
