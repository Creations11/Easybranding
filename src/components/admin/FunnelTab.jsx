import { colors } from '../../utils/theme';

export default function FunnelTab({ stages }) {
  return (
    <div>
      <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Pipeline Funnel</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {stages.map((stage, i) => (
          <div key={i} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '12px', padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{stage.label}</span>
              <span style={{ fontSize: '13px', color: colors.muted }}>{stage.count} leads · {stage.percentage}%</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${stage.percentage}%`, background: stage.stage === 'qualified' ? colors.lime : stage.stage === 'not_qualified' ? colors.red : colors.cyan, borderRadius: '999px', transition: 'width 0.5s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
