// src/components/crm/CrmViews.jsx
// The quieter Operations views: Alerts (each opens its lead) and Reports (the
// charts). The Inbox is components/inbox/ since 2026-10-21. Each fetches its own
// data, so nothing loads until its view is opened.
import { useAlerts, useMoneyView, useLeadTrend, useSalesFunnel, useLadderConversion } from '../../hooks/useDashboardData';
import RevenueTrend from '../RevenueTrend';
import LeadTrend from '../LeadTrend';
import SalesFunnel from '../SalesFunnel';
import LadderConversion from '../LadderConversion';
import { c } from './crmHelpers';

const box = { background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12 };

export function AlertsView({ scope, onOpen }) {
  const alerts = useAlerts(scope).data;
  if (!alerts) return <div style={{ color: c.muted, padding: 20 }}>Loading alerts…</div>;
  if (!alerts.length) return <div style={{ ...box, color: c.muted, textAlign: 'center', padding: 30 }}>✅ No alerts.</div>;
  return alerts.map((a, i) => {
    const tint = a.severity === 'high' ? c.red : c.amber;
    const id = a.lead?._id || a.leadId;
    return (
      <button key={i} type="button" onClick={() => id && onOpen(String(id))} disabled={!id} style={{ ...box, width: '100%', textAlign: 'left', padding: '12px 14px', marginBottom: 8, cursor: id ? 'pointer' : 'default', fontFamily: 'inherit', color: c.text, borderColor: tint + '44', display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <span>
          <strong style={{ fontSize: 13 }}>{a.lead?.name && a.lead.name !== 'Unknown' ? a.lead.name : a.lead?.phone || 'A lead'}</strong>
          <span style={{ display: 'block', fontSize: 12, color: c.muted, marginTop: 2 }}>{a.message}</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: tint, textTransform: 'uppercase' }}>{a.severity}</span>
      </button>
    );
  });
}

export function ReportsView({ scope, colors }) {
  const money = useMoneyView(scope);
  const trend = useLeadTrend(scope);
  const funnel = useSalesFunnel(scope);
  const ladder = useLadderConversion(scope);
  return (
    <div>
      <SalesFunnel query={funnel} />
      <RevenueTrend query={money} colors={colors} />
      <LeadTrend query={trend} colors={colors} />
      <LadderConversion query={ladder} />
    </div>
  );
}
