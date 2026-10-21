import Badge from '../ui/Badge';

export default function OverviewTab({ activeConversations }) {
  return (
    <div>
      <h2 className="mb-5 text-xl">Recent Activity</h2>
      {activeConversations.slice(0, 5).map(lead => (
        <div key={lead._id} className="mb-2.5 flex items-center justify-between gap-3 rounded-[14px] border border-edge bg-card px-5 py-4">
          <div><strong>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong><p className="font-mono text-[13px] text-muted">{lead.phone}</p></div>
          <Badge tone="system">{lead.workflowStatus?.replace(/_/g, ' ')}</Badge>
        </div>
      ))}
    </div>
  );
}
