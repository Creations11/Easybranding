// src/sections/OperationsSection.jsx
//
// The Operations view: the verdict, what needs you, the money, what's
// misconfigured, and the tabs beneath them.
//
// Extracted from SuperAdminDashboard (2026-07-27), completing the Phase 3
// file split. That page carried every section inline and had grown past a
// thousand lines; Operations was the largest part of it and the part this
// session changed most.
//
// ── What lives here vs. on the page ─────────────────────────────────────
//
// Everything only Operations uses is OWNED here — its queries, its tab state,
// the message filters, the lead columns, the takeover/resume/reopen handlers.
// The page keeps what several sections share: the tenant list, tenant stats,
// the full lead list, and which lead detail modal is open.
//
// `opsScope` stays on the page even though only this section reads it, because
// it is persisted to localStorage and is really "which tenant am I looking
// at" — a property of the session, not of this panel.
//
// Prop names deliberately match the locals they replaced, so the JSX moved
// across unchanged. A rename during a move turns a mechanical change into a
// reviewable one, and this file is 240 lines of markup.

import { useMemo, useState } from 'react';
import api from '../api';
import {
  useOverview, useOwedWork, useMoneyView, useHealthWarnings, useLeadTrend,
  useLadderConversion, useSalesFunnel, useActiveLeads, useQualifiedLeads, useRejectedLeads,
  useClosedLeads, useStages, useViewings, useMessages, useAlerts,
  useRefetchAll,
} from '../hooks/useDashboardData';
import SectionErrorBoundary from '../components/SectionErrorBoundary';
import StatCard from '../components/StatCard';
import DataFreshness from '../components/DataFreshness';
import ActionRail from '../components/ActionRail';
import MoneyPanel from '../components/MoneyPanel';
import HealthWarnings from '../components/HealthWarnings';
import TodayVerdict from '../components/TodayVerdict';
import LeadsBoard from '../components/LeadsBoard';
import RevenueTrend from '../components/RevenueTrend';
import LeadTrend from '../components/LeadTrend';
import LadderConversion from '../components/LadderConversion';
import SalesFunnel from '../components/SalesFunnel';

const STATUS_COLOR_KEYS = {
  qualified: 'lime', not_qualified: 'red', taken_over: 'orange',
  capture_name: 'cyan', capture_property_interest: 'cyan', capture_budget: 'cyan',
  capture_move_in_date: 'cyan', capture_employment_type: 'cyan',
  capture_monthly_income: 'cyan', awaiting_menu: 'amber', closed: 'muted',
};

export default function OperationsSection({
  opsScope,
  changeScope,
  tenants,
  tenantStats,
  allLeads,
  isSuperAdmin,
  setLeadDetailId,
  colors: c,
}) {
  const STATUS_COLOR = useMemo(
    () => Object.fromEntries(Object.entries(STATUS_COLOR_KEYS).map(([k, v]) => [k, c[v]])),
    [c]
  );

  const refetch = useRefetchAll();

  const overviewQ    = useOverview(opsScope);
  const owedWorkQ    = useOwedWork(opsScope);
  const moneyQ       = useMoneyView(opsScope);
  const healthQ      = useHealthWarnings(opsScope);
  const leadTrendQ   = useLeadTrend(opsScope);
  const ladderQ      = useLadderConversion(opsScope);
  const funnelQ      = useSalesFunnel(opsScope);
  const overview     = overviewQ.data;

  // Keep the whole query, not just the rows: a column must be able to tell
  // "empty" from "still loading" from "the request failed" — they looked
  // identical before, all rendering as "None".
  const activeQ    = useActiveLeads(opsScope);
  const qualifiedQ = useQualifiedLeads(opsScope);
  const rejectedQ  = useRejectedLeads(opsScope);
  const closedQ    = useClosedLeads(opsScope);
  const activeLeads    = activeQ.data?.leads || [];
  const qualifiedLeads = qualifiedQ.data?.leads || [];
  const rejectedLeads  = rejectedQ.data?.leads || [];
  const closedLeads    = closedQ.data?.leads || [];
  const stages   = useStages(opsScope).data || [];
  const viewings = useViewings(opsScope).data || [];
  const messages = useMessages(opsScope).data || [];
  const alerts   = useAlerts(opsScope).data || [];

  const [opsTab, setOpsTab] = useState('overview');
  const [msgSearch,   setMsgSearch]   = useState('');
  const [msgDateFrom, setMsgDateFrom] = useState('');
  const [msgDateTo,   setMsgDateTo]   = useState('');
  const [leadsTenantFilter, setLeadsTenantFilter] = useState('all');

  const opsTabs = ['overview', 'leads', 'trends', 'funnel', 'viewings', 'messages', 'alerts'];

  const tenantNameById = useMemo(
    () => Object.fromEntries(tenants.map(t => [t._id, t.businessName])),
    [tenants]
  );

  const filteredMessages = useMemo(() => {
    const term = msgSearch.trim().toLowerCase();
    const from = msgDateFrom ? new Date(msgDateFrom + 'T00:00:00') : null;
    const to   = msgDateTo   ? new Date(msgDateTo   + 'T23:59:59') : null;

    return messages.filter(msg => {
      if (term) {
        const business = (msg.businessName || tenantNameById[msg.tenantId] || '').toLowerCase();
        const name  = (msg.name  || '').toLowerCase();
        const phone = (msg.phone || '').toLowerCase();
        if (!business.includes(term) && !name.includes(term) && !phone.includes(term)) return false;
      }
      const ts = msg.timestamp ? new Date(msg.timestamp) : null;
      if (from && (!ts || ts < from)) return false;
      if (to   && (!ts || ts > to))   return false;
      return true;
    });
  }, [messages, msgSearch, msgDateFrom, msgDateTo, tenantNameById]);

  // The four status endpoints are the board's columns, but they don't
  // necessarily cover every lead. Anything in allLeads not present in one of
  // them gets its own "Other" column instead of silently disappearing.
  const categorizedIds = useMemo(() => {
    const ids = new Set();
    [...activeLeads, ...qualifiedLeads, ...rejectedLeads, ...closedLeads].forEach(l => ids.add(l._id));
    return ids;
  }, [activeLeads, qualifiedLeads, rejectedLeads, closedLeads]);

  // allLeads (GET /leads) is NOT scoped by the Operations "Viewing" selector
  // — that endpoint doesn't honor ?tenantId (it scopes only via the
  // x-tenant-id header, which the dashboard doesn't send) — so when a
  // super-admin narrows to one client, filter the "Other" column here to
  // match the scoped status columns.
  const otherLeads = useMemo(
    () => allLeads.filter(l => !categorizedIds.has(l._id) && (!opsScope || l.tenantId === opsScope)),
    [allLeads, categorizedIds, opsScope]
  );

  const leadColumns = useMemo(() => {
    const byTenant = (list) => leadsTenantFilter === 'all'
      ? list
      : list.filter(l => l.tenantId === leadsTenantFilter);

    const cols = [
      { key: 'active',    label: 'Active',    icon: '💬', items: byTenant(activeLeads),    q: activeQ },
      { key: 'qualified', label: 'Qualified', icon: '✅', items: byTenant(qualifiedLeads), q: qualifiedQ },
      { key: 'rejected',  label: 'Rejected',  icon: '❌', items: byTenant(rejectedLeads),  q: rejectedQ },
      { key: 'closed',    label: 'Closed',    icon: '🔒', items: byTenant(closedLeads),    q: closedQ },
    ];
    if (otherLeads.length > 0) {
      cols.push({ key: 'other', label: 'Other', icon: '❔', items: byTenant(otherLeads) });
    }
    return cols;
  }, [activeLeads, qualifiedLeads, rejectedLeads, closedLeads, otherLeads, leadsTenantFilter,
      activeQ, qualifiedQ, rejectedQ, closedQ]);

  const handleTakeover = async (e, lid) => {
    e.stopPropagation();
    try { await api.post('/admin-ops/leads/' + lid + '/takeover'); refetch(); }
    catch (err) { alert(err.response?.data?.message || 'Takeover failed'); }
  };
  const handleResume = async (e, lid) => {
    e.stopPropagation();
    try { await api.post('/admin-ops/leads/' + lid + '/resume'); refetch(); }
    catch (err) { alert(err.response?.data?.message || 'Resume failed'); }
  };
  // Reopen a closed lead back into normal bot flow — see useDashboardData.js
  // and adminOpsController.js for why this was needed.
  const handleReopen = async (e, lid) => {
    e.stopPropagation();
    try { await api.post('/admin-ops/leads/' + lid + '/reopen'); refetch(); }
    catch (err) { alert(err.response?.data?.message || 'Reopen failed'); }
  };

  return (
    <SectionErrorBoundary name="Operations" onRetry={refetch}>
      <div>
      <div style={{ marginBottom: 28, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: 4 }}>Operations</h1>
          <p style={{ color: c.muted, fontSize: 15, marginBottom: 8 }}>
            {opsScope
              ? (tenants.find(t => t._id === opsScope)?.businessName || 'Selected client') + ' — pipeline'
              : 'All clients — platform-wide pipeline'}
          </p>
          {/* React Query keeps serving the last good response after a
              refetch fails, so this screen could sit for hours looking
              healthy while every background refresh errored. Say how
              old the numbers are, and say when they stopped updating. */}
          <DataFreshness
            colors={c}
            onRefresh={refetch}
            queries={[overviewQ, activeQ, qualifiedQ, rejectedQ, closedQ]}
          />
        </div>
        {/* Super-admin sees every tenant by default, which mixes
            platform oversight with working our own customers.
            Narrow to one client to work their pipeline cleanly. */}
        {isSuperAdmin && tenants.length > 0 && (
          <div>
            <label style={{ color: c.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Viewing</label>
            <select
              value={opsScope}
              onChange={e => changeScope(e.target.value)}
              style={{ padding: '9px 14px', background: opsScope ? c.lime + '18' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (opsScope ? c.lime + '55' : c.borderDim), borderRadius: 10, color: opsScope ? c.lime : c.text, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minWidth: 220 }}
            >
              <option value="">🌍 All clients (platform view)</option>
              {tenants.map(t => (
                <option key={t._id} value={t._id}>{t.businessName}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      {/* The two-second answer, before any of the detail. It is only
          allowed to say "fine" when every check it summarises actually
          succeeded — a green line derived from failed requests would
          stop you reading the panels that would have told you. */}
      <TodayVerdict owedWork={owedWorkQ} health={healthQ} colors={c} />

      {/* Above the tabs on purpose: owed work is not one view among
          several, it is the answer to "is today fine?" — so it must
          not be something you have to navigate to in order to see. */}
      <ActionRail query={owedWorkQ} colors={c} onOpenLead={setLeadDetailId} />

      <MoneyPanel query={moneyQ} colors={c} />

      <HealthWarnings query={healthQ} colors={c} />

      {/* The three charts used to sit here. Stacked, they pushed the
          board most of a phone screen down and buried the two things
          this header is FOR — what needs you, and whether the month is
          paying. They answer "why?", which is a question you ask
          second, so they moved behind the Trends tab. Summary first,
          detail on demand. */}

      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid ' + c.borderDim, overflowX: 'auto' }}>
        {opsTabs.map(t => (
          <button key={t} onClick={() => setOpsTab(t)} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: opsTab === t ? '2px solid ' + c.lime : '2px solid transparent', color: opsTab === t ? c.lime : c.muted, cursor: 'pointer', fontSize: 13, fontWeight: opsTab === t ? 600 : 400, textTransform: 'capitalize', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
            {t}{t === 'alerts' && alerts.length > 0 && <span style={{ marginLeft: 6, background: c.red, color: '#fff', fontSize: 10, padding: '1px 5px', borderRadius: 999 }}>{alerts.length}</span>}
          </button>
        ))}
      </div>

      {opsTab === 'overview' && (
        <SectionErrorBoundary name="Overview" onRetry={refetch}>
          {overview ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 32 }}>
                <StatCard label="Total Leads" value={overview.totalLeads} color={c.text} icon="📊" />
                <StatCard label="Active" value={overview.activeConversations} color={c.cyan} icon="💬" />
                <StatCard label="Qualified" value={overview.qualifiedLeads} color={c.lime} icon="✅" />
                <StatCard label="Rejected" value={overview.rejectedLeads} color={c.red} icon="❌" />
                <StatCard label="Today" value={overview.todayLeads} color={c.amber} icon="📅" />
                <StatCard label="Qual. Rate" value={overview.qualificationRate + '%'} color={c.emerald} icon="📈" />
                {isSuperAdmin && <StatCard label="Clients" value={tenants.length} color={c.cyan} icon="👥" />}
                {isSuperAdmin && <StatCard label="MRR" value={'R' + (tenantStats?.mrr || 0).toLocaleString()} color={c.lime} icon="💰" sub="monthly recurring" />}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: c.muted }}>Recent Activity</h3>
              {activeLeads.slice(0, 5).map(lead => (
                <div key={lead._id} onClick={() => setLeadDetailId(lead._id)} className="card-hover" style={{ background: c.card, border: '1px solid ' + (lead.isProspect ? c.lime + '33' : c.borderDim), borderRadius: 12, padding: '14px 18px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                      {lead.isProspect && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: c.lime + '22', color: c.lime, fontWeight: 700 }}>🎯 Prospect</span>}
                    </div>
                    <p style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{lead.phone}</p>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: (STATUS_COLOR[lead.workflowStatus] || c.muted) + '18', color: STATUS_COLOR[lead.workflowStatus] || c.muted }}>{lead.workflowStatus?.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          ) : <p style={{ color: c.muted, textAlign: 'center', padding: '40px 0' }}>No overview data available.</p>}
        </SectionErrorBoundary>
      )}

      {/* ════════ LEADS CRM BOARD ════════ */}
      {/* Grouped by status (columns) and filterable by
          tenant — replaces the old separate active /
          qualified / rejected / closed tabs, which forced
          admins to hop between tabs to see one business's
          full pipeline. */}
      {opsTab === 'leads' && (
        <SectionErrorBoundary name="Leads" onRetry={refetch}>
          <LeadsBoard
            columns={leadColumns}
            allLeadsCount={allLeads.length}
            tenants={tenants}
            tenantNameById={tenantNameById}
            tenantFilter={leadsTenantFilter}
            onTenantFilterChange={setLeadsTenantFilter}
            onOpenLead={setLeadDetailId}
            onTakeover={handleTakeover}
            onResume={handleResume}
            onReopen={handleReopen}
            colors={c}
          />
        </SectionErrorBoundary>
      )}

      {/* Trends: the three charts. Detail on demand — see the note
          where they used to live, above the tab strip. */}
      {opsTab === 'trends' && (
        <SectionErrorBoundary name="Trends" onRetry={refetch}>
          <div>
            <RevenueTrend query={moneyQ} colors={c} />
            <LeadTrend query={leadTrendQ} colors={c} />
            <SalesFunnel query={funnelQ} colors={c} />
            <LadderConversion query={ladderQ} colors={c} />
          </div>
        </SectionErrorBoundary>
      )}

      {opsTab === 'funnel' && (
        <SectionErrorBoundary name="Pipeline Funnel" onRetry={refetch}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Pipeline Funnel</h2>
            {stages.map((stage, i) => (
              <div key={i} style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '16px 18px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{stage.label}</span>
                  <span style={{ color: c.muted, fontSize: 13 }}>{stage.count} leads · {stage.percentage}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: stage.percentage + '%', background: stage.stage === 'qualified' ? c.lime : stage.stage === 'not_qualified' ? c.red : c.cyan, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </SectionErrorBoundary>
      )}

      {opsTab === 'viewings' && (
        <SectionErrorBoundary name="Viewings" onRetry={refetch}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Viewing Requests ({viewings.length})</h2>
            {viewings.length === 0 ? <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}><p style={{ fontSize: 40, marginBottom: 16 }}>📅</p><p>No viewing requests.</p></div>
              : viewings.map(v => (
                <div key={v._id} onClick={() => setLeadDetailId(v._id)} className="card-hover" style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '14px 18px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><strong>{v.name !== 'Unknown' ? v.name : v.phone}</strong><p style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{v.phone}</p></div>
                  {v.viewingScheduledAt && <p style={{ color: c.emerald, fontSize: 13, fontWeight: 600 }}>{new Date(v.viewingScheduledAt).toLocaleDateString('en-ZA')}</p>}
                </div>
              ))}
          </div>
        </SectionErrorBoundary>
      )}

      {opsTab === 'messages' && (
        <SectionErrorBoundary name="Messages" onRetry={refetch}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Recent Messages ({filteredMessages.length}{filteredMessages.length !== messages.length ? ` of ${messages.length}` : ''})</h2>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
              <input
                value={msgSearch}
                onChange={e => setMsgSearch(e.target.value)}
                placeholder="Search business, name, or phone..."
                style={{ flex: '1 1 220px', padding: '10px 14px', borderRadius: 10, background: c.card, border: '1px solid ' + c.borderDim, color: c.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.muted }}>
                From
                <input type="date" value={msgDateFrom} onChange={e => setMsgDateFrom(e.target.value)}
                  style={{ padding: '9px 10px', borderRadius: 10, background: c.card, border: '1px solid ' + c.borderDim, color: c.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.muted }}>
                To
                <input type="date" value={msgDateTo} onChange={e => setMsgDateTo(e.target.value)}
                  style={{ padding: '9px 10px', borderRadius: 10, background: c.card, border: '1px solid ' + c.borderDim, color: c.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              </label>
              {(msgSearch || msgDateFrom || msgDateTo) && (
                <button onClick={() => { setMsgSearch(''); setMsgDateFrom(''); setMsgDateTo(''); }}
                  style={{ padding: '9px 14px', borderRadius: 10, background: 'transparent', border: '1px solid ' + c.borderDim, color: c.muted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Clear
                </button>
              )}
            </div>

            {filteredMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}><p style={{ fontSize: 40, marginBottom: 16 }}>💬</p><p>No messages match these filters.</p></div>
            ) : filteredMessages.map((msg, i) => {
              const business = msg.businessName || tenantNameById[msg.tenantId];
              return (
                <div key={i} onClick={() => setLeadDetailId(msg.leadId)} className="card-hover" style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '12px 16px', marginBottom: 8, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: msg.direction === 'inbound' ? c.cyan + '22' : c.lime + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{msg.direction === 'inbound' ? '📱' : '🤖'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, gap: 8 }}>
                      <strong style={{ fontSize: 13 }}>{msg.name !== 'Unknown' ? msg.name : msg.phone}</strong>
                      <span style={{ fontSize: 11, color: c.muted, whiteSpace: 'nowrap' }}>{new Date(msg.timestamp).toLocaleDateString('en-ZA')} · {new Date(msg.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {business && <p style={{ color: c.cyan, fontSize: 11, marginBottom: 3 }}>{business}</p>}
                    <p style={{ color: c.muted, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionErrorBoundary>
      )}

      {opsTab === 'alerts' && (
        <SectionErrorBoundary name="Alerts" onRetry={refetch}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Alerts {alerts.length > 0 && <span style={{ marginLeft: 10, background: c.red, color: '#fff', fontSize: 12, padding: '3px 10px', borderRadius: 999 }}>{alerts.length}</span>}</h2>
            {alerts.length === 0 ? <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}><p style={{ fontSize: 40, marginBottom: 16 }}>✅</p><p>No alerts.</p></div>
              : alerts.map((alert, i) => (
                <div key={i} className="card-hover" style={{ background: c.card, border: '1px solid ' + (alert.severity === 'high' ? c.red + '44' : c.amber + '44'), borderRadius: 14, padding: '16px 20px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><strong>{alert.lead?.name !== 'Unknown' ? alert.lead?.name : alert.lead?.phone}</strong><p style={{ color: c.muted, fontSize: 13, marginTop: 4 }}>{alert.message}</p></div>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: alert.severity === 'high' ? c.red + '22' : c.amber + '22', color: alert.severity === 'high' ? c.red : c.amber, fontWeight: 700, textTransform: 'uppercase' }}>{alert.severity}</span>
                  </div>
                </div>
              ))}
          </div>
        </SectionErrorBoundary>
      )}
      </div>
    </SectionErrorBoundary>
  );
}
