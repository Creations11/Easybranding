import StatTile from '../ui/StatTile';
import PageHeader from '../ui/PageHeader';
import WhatsAppStatus from '../WhatsAppStatus';
import AuditLog from '../AuditLog';
import QuickPaymentPanel from '../QuickPaymentPanel';

// Each plan's colour, as a whole class name so Tailwind can see it.
const PLAN_TEXT = { starter: 'text-sage', growth: 'text-lime', enterprise: 'text-cyan' };

export default function PlatformSection({ health, tenantStats }) {
  return (
    <div>
      <PageHeader title="Platform" sub="System health and revenue overview" />
      <div className="mb-7 flex flex-wrap gap-3">
        <StatTile label="API Status" value={health?.status === 'ok' ? '✅ Online' : '❌ Issue'} tone="lime" highlight />
        <StatTile label="Database" value={health?.services?.database?.status === 'connected' ? '✅ Connected' : '❌ Down'} tone="lime" highlight />
        <StatTile label="Environment" value={health?.environment || 'production'} tone="cyan" highlight />
        <StatTile label="Total MRR" value={'R' + ((tenantStats?.mrr || 0).toLocaleString())} tone="lime" note="active clients only" highlight />
      </div>
      <div className="mb-4 rounded-[14px] border border-edge bg-card p-5">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.06em] text-muted">Backend URL</p>
        <p className="break-all font-mono text-sm text-lime">{import.meta.env.VITE_API_URL}</p>
      </div>
      <WhatsAppStatus />
      <AuditLog />
      <QuickPaymentPanel />
      {tenantStats?.byPlan && (
        <div className="rounded-[14px] border border-edge bg-card p-5">
          <p className="mb-3.5 font-mono text-xs uppercase tracking-[0.06em] text-muted">Revenue by Plan</p>
          <div className="flex flex-wrap gap-2.5">
            {Object.entries(tenantStats.byPlan).map(([plan, count]) => (
              <div key={plan} className="min-w-[120px] flex-1 rounded-[10px] bg-surface p-3.5">
                <p className="mb-1.5 font-mono text-[11px] uppercase text-muted">{plan}</p>
                <p className={`font-mono text-xl font-bold tabular-nums ${PLAN_TEXT[plan] || 'text-lime'}`}>{count} <span className="font-sans text-xs font-normal text-muted">clients</span></p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
