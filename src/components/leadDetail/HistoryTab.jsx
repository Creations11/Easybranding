import { t } from './tokens';

export default function HistoryTab({ takeoverHistory }) {
  return (
    <>
      {takeoverHistory.length === 0 ? (
        <p style={{ color: t.muted, textAlign: 'center', marginTop: '40px' }}>No takeover history.</p>
      ) : takeoverHistory.map((event, i) => (
        <div key={i} style={{ background: t.surface, borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '999px', background: event.action === 'takeover' ? `${t.orange}18` : `${t.lime}18`, color: event.action === 'takeover' ? t.orange : t.lime, fontWeight: '600', marginRight: '10px', textTransform: 'capitalize' }}>{event.action}</span>
            {event.reason && <span style={{ color: t.muted, fontSize: '13px' }}>{event.reason}</span>}
          </div>
          <p style={{ color: t.muted, fontSize: '12px' }}>{new Date(event.timestamp).toLocaleString('en-ZA')}</p>
        </div>
      ))}
    </>
  );
}
