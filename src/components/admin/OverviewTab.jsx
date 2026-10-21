import { colors } from '../../utils/theme';

export default function OverviewTab({ activeConversations }) {
  return (
    <div>
      <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Recent Activity</h2>
      {activeConversations.slice(0, 5).map(lead => (
        <div key={lead._id} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '14px', padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><strong>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong><p style={{ color: colors.muted, fontSize: '13px' }}>{lead.phone}</p></div>
          <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', background: `${colors.cyan}22`, color: colors.cyan }}>{lead.workflowStatus?.replace(/_/g, ' ')}</span>
        </div>
      ))}
    </div>
  );
}
