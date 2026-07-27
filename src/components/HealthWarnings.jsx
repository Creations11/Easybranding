// src/components/HealthWarnings.jsx
//
// Things that are silently wrong. Last item of Phase 2 in the dashboard plan.
//
// Kept separate from ActionRail on purpose. The rail is money and customers
// waiting; a config warning sitting next to "R400 unconfirmed" either dilutes
// the rail or gets ignored along with it. These are also different in kind —
// nothing here is a task you finish, it is a state you correct.
//
// Rendered collapsed by default when everything is fine, because a health
// panel that occupies real estate to say "all good" trains you to stop
// reading it.

const TONE = { high: 'red', medium: 'amber', low: 'muted' };

export default function HealthWarnings({ query, colors }) {
  const c = colors;
  const { data, isError, refetch } = query || {};
  const warnings = data?.warnings || [];

  // Silent while loading: an empty panel that briefly says "all good" before
  // warnings arrive is worse than no panel for that second.
  if (!data && !isError) return null;

  if (isError) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
        padding: '8px 14px', background: c.red + '11',
        border: '1px solid ' + c.red + '33', borderRadius: 10, fontSize: 12, color: c.red,
      }}>
        <span>Couldn't run the configuration checks — this is not an all-clear.</span>
        <button
          onClick={() => refetch?.()}
          style={{
            padding: '3px 10px', background: 'none', color: c.red,
            border: '1px solid ' + c.red + '44', borderRadius: 7,
            cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!warnings.length) {
    return (
      <div style={{ marginBottom: 14, fontSize: 12, color: c.muted, display: 'flex', alignItems: 'center', gap: 7 }}>
        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: c.lime, flex: 'none' }} />
        Configuration checks passed
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: c.text }}>
        Needs fixing ({warnings.length})
      </h3>
      {warnings.map((w, i) => {
        const tone = c[TONE[w.severity]] || c.muted;
        return (
          <div
            key={w.kind + i}
            style={{
              display: 'flex', gap: 10, alignItems: 'baseline',
              padding: '9px 14px', marginBottom: 6,
              background: c.card, border: '1px solid ' + c.borderDim,
              borderLeft: '3px solid ' + tone, borderRadius: 10,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: tone, flex: 'none' }}>{w.title}</span>
            <span style={{ fontSize: 12, color: c.muted, lineHeight: 1.5 }}>{w.detail}</span>
          </div>
        );
      })}
    </div>
  );
}
