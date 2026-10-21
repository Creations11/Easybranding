import Badge from '../ui/Badge';

export default function HistoryTab({ takeoverHistory }) {
  return (
    <>
      {takeoverHistory.length === 0 ? (
        <p className="mt-10 text-center text-muted">No takeover history.</p>
      ) : takeoverHistory.map((event, i) => (
        <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-ground px-3.5 py-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone={event.action === 'takeover' ? 'warn' : 'live'}><span className="capitalize">{event.action}</span></Badge>
            {event.reason && <span className="text-[13px] text-muted">{event.reason}</span>}
          </div>
          <p className="font-mono text-xs text-muted">{new Date(event.timestamp).toLocaleString('en-ZA')}</p>
        </div>
      ))}
    </>
  );
}
