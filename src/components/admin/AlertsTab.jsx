import { colors } from '../../utils/theme';

export default function AlertsTab({ alerts }) {
  return (
    <div>
      <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Alerts ({alerts.length})</h2>
      {alerts.length === 0
        ? <div style={{ textAlign: 'center', padding: '60px 0', color: colors.muted }}><p style={{ fontSize: '40px', marginBottom: '16px' }}>✅</p><p>No alerts.</p></div>
        : alerts.map((alert, i) => (
          <div key={i} style={{ background: colors.card, border: `1px solid ${alert.severity === 'high' ? colors.red : colors.amber}44`, borderRadius: '14px', padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><strong>{alert.lead.name !== 'Unknown' ? alert.lead.name : alert.lead.phone}</strong><p style={{ color: colors.muted, fontSize: '13px', marginTop: '4px' }}>{alert.message}</p></div>
            <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', background: alert.severity === 'high' ? `${colors.red}22` : `${colors.amber}22`, color: alert.severity === 'high' ? colors.red : colors.amber, fontWeight: '600', textTransform: 'uppercase' }}>{alert.severity}</span>
          </div>
        ))}
    </div>
  );
}
