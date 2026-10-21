import StatCard from '../StatCard';
import WhatsAppStatus from '../WhatsAppStatus';
import AuditLog from '../AuditLog';
import QuickPaymentPanel from '../QuickPaymentPanel';
import { c, PLAN_COLOR } from './tokens';

export default function PlatformSection({ health, tenantStats }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: 4 }}>Platform</h1>
        <p style={{ color: c.muted, fontSize: 15 }}>System health and revenue overview</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatCard label="API Status" value={health?.status === 'ok' ? '✅ Online' : '❌ Issue'} color={c.lime} icon="🟢" />
        <StatCard label="Database" value={health?.services?.database?.status === 'connected' ? '✅ Connected' : '❌ Down'} color={c.lime} icon="🗄️" />
        <StatCard label="Environment" value={health?.environment || 'production'} color={c.cyan} icon="⚙️" />
        <StatCard label="Total MRR" value={'R' + ((tenantStats?.mrr || 0).toLocaleString())} color={c.lime} icon="💰" sub="active clients only" />
      </div>
      <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <p style={{ color: c.muted, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Backend URL</p>
        <p style={{ color: c.lime, fontSize: 14, fontFamily: 'monospace' }}>{import.meta.env.VITE_API_URL}</p>
      </div>
      <WhatsAppStatus />
      <AuditLog />
      <QuickPaymentPanel />
      {tenantStats?.byPlan && (
        <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 14, padding: 20 }}>
          <p style={{ color: c.muted, fontSize: 12, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Revenue by Plan</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            {Object.entries(tenantStats.byPlan).map(([plan, count]) => (
              <div key={plan} style={{ background: c.surface, borderRadius: 10, padding: 14 }}>
                <p style={{ color: c.muted, fontSize: 11, textTransform: 'uppercase', marginBottom: 6 }}>{plan}</p>
                <p style={{ color: PLAN_COLOR[plan] || c.lime, fontSize: 20, fontWeight: 700 }}>{count} <span style={{ color: c.muted, fontSize: 12 }}>clients</span></p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
