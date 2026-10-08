// src/components/crm/CrmViews.jsx
// The quieter Operations views: Inbox (recent messages, one card per person),
// Alerts (each opens its lead), and Reports (the charts). Each fetches its own
// data, so nothing loads until its view is opened.
import { useMemo, useState } from 'react';
import { useMessages, useAlerts, useMoneyView, useLeadTrend, useSalesFunnel, useLadderConversion } from '../../hooks/useDashboardData';
import RevenueTrend from '../RevenueTrend';
import LeadTrend from '../LeadTrend';
import SalesFunnel from '../SalesFunnel';
import LadderConversion from '../LadderConversion';
import { c, ago } from './crmHelpers';

const box = { background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12 };
const input = { padding: '9px 12px', borderRadius: 10, background: c.card, color: c.text, border: '1px solid ' + c.borderDim, fontFamily: 'inherit', fontSize: 13, outline: 'none' };

export function InboxView({ scope, tenantNameById, onOpen }) {
  const messages = useMessages(scope).data;
  const [q, setQ] = useState('');
  const threads = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const byLead = new Map();
    for (const m of messages || []) {
      const business = m.businessName || tenantNameById[m.tenantId] || '';
      if (needle && ![m.name, m.phone, business, m.body].some((v) => v && String(v).toLowerCase().includes(needle))) continue;
      const key = String(m.leadId ?? m.phone);
      if (!byLead.has(key)) byLead.set(key, { key, leadId: m.leadId, name: m.name, phone: m.phone, business, messages: [] });
      byLead.get(key).messages.push(m);
    }
    for (const t of byLead.values()) t.messages.reverse();
    return [...byLead.values()];
  }, [messages, q, tenantNameById]);

  if (!messages) return <div style={{ color: c.muted, padding: 20 }}>Loading messages…</div>;
  return (
    <div>
      <input aria-label="Search messages" placeholder="Search name, number, business or words" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...input, width: '100%', boxSizing: 'border-box', marginBottom: 12 }} />
      {threads.length === 0 && <div style={{ color: c.muted, textAlign: 'center', padding: 30 }}>No messages match.</div>}
      {threads.map((t) => {
        const latest = t.messages[t.messages.length - 1];
        return (
          <button key={t.key} type="button" onClick={() => t.leadId && onOpen(String(t.leadId))} style={{ ...box, width: '100%', textAlign: 'left', padding: '10px 14px', marginBottom: 8, cursor: 'pointer', fontFamily: 'inherit', color: c.text, display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <strong style={{ fontSize: 13 }}>{t.name && t.name !== 'Unknown' ? t.name : t.phone}</strong>
              <span style={{ fontSize: 11, color: c.muted }}>{ago(latest.timestamp)}</span>
            </div>
            {t.business && <div style={{ fontSize: 11, color: c.cyan }}>{t.business}</div>}
            {t.messages.slice(-3).map((m, i) => (
              <div key={i} style={{ fontSize: 12, color: m.direction === 'inbound' ? c.text : c.muted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.direction === 'inbound' ? '← ' : '→ '}{m.body}
              </div>
            ))}
          </button>
        );
      })}
    </div>
  );
}

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
      <SalesFunnel query={funnel} colors={colors} />
      <RevenueTrend query={money} colors={colors} />
      <LeadTrend query={trend} colors={colors} />
      <LadderConversion query={ladder} colors={colors} />
    </div>
  );
}
