import { colors } from '../../utils/theme';

export default function StatsStrip({ overview, clients, clientStats, pendingUsers, isSuperAdmin }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '24px' }}>
      {[
        { label: 'Total Leads',   value: overview.totalLeads,          color: colors.text,    show: true },
        { label: 'Active',        value: overview.activeConversations, color: colors.cyan,    show: true },
        { label: 'Qualified',     value: overview.qualifiedLeads,      color: colors.lime,    show: true },
        { label: 'Rejected',      value: overview.rejectedLeads,       color: colors.red,     show: true },
        { label: 'Today',         value: overview.todayLeads,          color: colors.amber,   show: true },
        { label: 'Qual. Rate',    value: `${overview.qualificationRate}%`, color: colors.emerald, show: true },
        { label: 'Clients',       value: clients.length,               color: colors.cyan,    show: isSuperAdmin },
        { label: 'Monthly Rev',   value: `R${(clientStats?.mrr || 0).toLocaleString()}`, color: colors.lime, show: isSuperAdmin },
        { label: 'Pending Users', value: pendingUsers.length,          color: pendingUsers.length > 0 ? colors.amber : colors.muted, show: true },
      ].filter(s => s.show).map(s => (
        <div key={s.label} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '16px 18px' }}>
          <p style={{ color: colors.muted, fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
          <p style={{ fontSize: '28px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
