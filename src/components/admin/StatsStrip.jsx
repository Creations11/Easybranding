import StatTile from '../ui/StatTile';

export default function StatsStrip({ overview, pendingUsers }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2.5">
      {[
        { label: 'Total Leads',   value: overview.totalLeads,          tone: 'ink',     show: true },
        { label: 'Active',        value: overview.activeConversations, tone: 'cyan',    show: true },
        { label: 'Qualified',     value: overview.qualifiedLeads,      tone: 'lime',    show: true },
        { label: 'Rejected',      value: overview.rejectedLeads,       tone: 'red',     show: true },
        { label: 'Today',         value: overview.todayLeads,          tone: 'amber',   show: true },
        { label: 'Qual. Rate',    value: `${overview.qualificationRate}%`, tone: 'emerald', show: true },
        { label: 'Pending Users', value: pendingUsers.length,          tone: pendingUsers.length > 0 ? 'amber' : 'muted', show: true },
      ].filter(s => s.show).map(s => (
        <StatTile key={s.label} label={s.label} value={s.value} tone={s.tone} highlight />
      ))}
    </div>
  );
}
