// src/components/DataFreshness.jsx
//
// Says how old the data on screen is, and whether the last refresh failed.
//
// Phase 1 of the dashboard plan: the board must never quietly pass stale data
// off as live. React Query keeps serving the last successful response after a
// refetch fails, so a screen can sit there looking perfectly healthy while it
// is hours out of date and every background refresh is erroring. Nothing on
// the page said so.
//
// Pass the queries the panel is actually built from; the oldest one wins,
// because a panel is only as fresh as its stalest input.

const MINUTE = 60_000;

const ago = (ts) => {
  if (!ts) return null;
  const mins = Math.floor((Date.now() - ts) / MINUTE);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? '1 hour ago' : `${hrs} hours ago`;
};

export default function DataFreshness({ queries = [], colors, onRefresh }) {
  const live = queries.filter(Boolean);
  if (!live.length) return null;

  const fetching = live.some((q) => q.isFetching);
  // A query that HAS data but is erroring is the dangerous case: the screen
  // still shows numbers, and they are the old ones.
  const staleFailures = live.filter((q) => q.isError && q.data !== undefined).length;
  const stamps = live.map((q) => q.dataUpdatedAt).filter(Boolean);
  const oldest = stamps.length ? Math.min(...stamps) : null;

  const c = colors;
  const label = fetching ? 'Refreshing…' : ago(oldest) ? `Updated ${ago(oldest)}` : 'Not loaded yet';
  const tone = staleFailures ? c.amber : c.muted;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: tone }}>
      <span
        aria-hidden="true"
        style={{
          width: 7, height: 7, borderRadius: '50%', flex: 'none',
          background: staleFailures ? c.amber : fetching ? c.cyan : c.lime,
        }}
      />
      <span>{label}</span>
      {staleFailures > 0 && (
        <span title="The last refresh failed, so these figures may be out of date">
          · showing last known data
        </span>
      )}
      {onRefresh && (
        <button
          onClick={onRefresh}
          style={{
            padding: '2px 8px', background: 'none', color: c.muted,
            border: '1px solid ' + c.border, borderRadius: 7,
            cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
          }}
        >
          Refresh
        </button>
      )}
    </div>
  );
}
