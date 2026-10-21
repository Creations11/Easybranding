import Badge from '../ui/Badge';

export default function AlertsTab({ alerts }) {
  return (
    <div>
      <h2 className="mb-5 text-xl">Alerts ({alerts.length})</h2>
      {alerts.length === 0
        ? <div className="py-[60px] text-center text-muted"><p className="mb-4 text-[40px]">✅</p><p>No alerts.</p></div>
        : alerts.map((alert, i) => (
          <div key={i} className={`mb-2.5 flex items-center justify-between gap-3 rounded-[14px] border bg-card px-5 py-4 ${alert.severity === 'high' ? 'border-red/25' : 'border-amber/25'}`}>
            <div><strong>{alert.lead.name !== 'Unknown' ? alert.lead.name : alert.lead.phone}</strong><p className="mt-1 text-[13px] text-muted">{alert.message}</p></div>
            <Badge tone={alert.severity === 'high' ? 'bad' : 'warn'}><span className="uppercase">{alert.severity}</span></Badge>
          </div>
        ))}
    </div>
  );
}
