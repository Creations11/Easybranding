// src/sections/OperationsSection.jsx
//
// Operations: the sales CRM.
//
// Rebuilt 2026-10-08. It still counted the rental bot's statuses ("qualified":
// 9 leads in 575, ever, behind a headline qualification rate), a funnel of
// property / budget / move-in steps no lead had reached in months, and an
// empty viewings list, while the business runs on the AI agent's sales stages
// and on whether somebody is waiting for a reply. It now works like a CRM:
//
//   Today     what needs a person: the verdict, the owed-work rail (which
//             already lists the unanswered), money and health warnings.
//   Pipeline  every lead in its sales column, most urgent first.
//   Leads     the same leads as a sortable list, for finding someone.
//   Inbox     recent conversations, one card per person.
//   Reports   the funnel and the trends.
//   Alerts    each one opens its lead.
//
// Every lead opens the same lead page (LeadDetailModal): the conversation,
// stage, notes, take over, follow-up, close. The board and the list share one
// set of filters, so switching view keeps what you were looking at.
//
// One request draws the board (GET /admin-ops/crm/leads), where the old board
// needed four lead lists plus every lead in full. The charts and messages load
// only when their view is opened.
import { useMemo, useState } from 'react';
import { useOwedWork, useMoneyView, useHealthWarnings, useAlerts, useRefetchAll } from '../hooks/useDashboardData';
import { useCrmLeads, crmError } from '../hooks/useCrm';
import SectionErrorBoundary from '../components/SectionErrorBoundary';
import DataFreshness from '../components/DataFreshness';
import ActionRail from '../components/ActionRail';
import MoneyPanel from '../components/MoneyPanel';
import HealthWarnings from '../components/HealthWarnings';
import TodayVerdict from '../components/TodayVerdict';
import KpiStrip from '../components/crm/KpiStrip';
import CrmToolbar from '../components/crm/CrmToolbar';
import PipelineBoard from '../components/crm/PipelineBoard';
import LeadsList from '../components/crm/LeadsList';
import { InboxView, AlertsView, ReportsView } from '../components/crm/CrmViews';
import { EMPTY_FILTERS, applyFilters } from '../components/crm/crmHelpers';

const NONE = [];
const VIEWS = [
  ['today', 'Today'],
  ['pipeline', 'Pipeline'],
  ['leads', 'Leads'],
  ['inbox', 'Inbox'],
  ['reports', 'Reports'],
  ['alerts', 'Alerts'],
];
const VIEW_KEY = 'wabos.opsView';
const savedView = () => { try { return localStorage.getItem(VIEW_KEY) || 'today'; } catch { return 'today'; } };

export default function OperationsSection({
  opsScope,
  changeScope,
  tenants,
  isSuperAdmin,
  setLeadDetailId,
  colors: c,
}) {
  const refetch = useRefetchAll();
  const crmQ = useCrmLeads(opsScope);
  const owedWorkQ = useOwedWork(opsScope);
  const moneyQ = useMoneyView(opsScope);
  const healthQ = useHealthWarnings(opsScope);
  const alerts = useAlerts(opsScope).data || NONE;

  const [view, setViewState] = useState(savedView);
  const setView = (v) => { setViewState(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* per-viewer convenience only */ } };
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [kpi, setKpi] = useState('');

  const crm = crmQ.data;
  const leads = crm?.leads || NONE;
  const buckets = crm?.buckets || NONE;
  // "Now" is when the data was fetched: "waiting 3h" is then true of what is
  // on screen, and render stays pure. It refreshes every minute (useCrmLeads).
  const now = crmQ.dataUpdatedAt;
  const showBusiness = isSuperAdmin && !opsScope;
  const tenantNameById = useMemo(() => Object.fromEntries((tenants || []).map((t) => [t._id, t.businessName])), [tenants]);

  const filtered = useMemo(() => {
    const base = applyFilters(leads, filters, now);
    return filters.showClosed ? base : base.filter((l) => l.bucket !== 'lost' || view === 'pipeline');
  }, [leads, filters, now, view]);

  // A headline number is a shortcut: it sets the filter and shows the list.
  const pickKpi = (k) => {
    const next = k === kpi ? '' : k;
    setKpi(next);
    setFilters({
      ...EMPTY_FILTERS,
      q: filters.q,
      waiting: next === 'waiting',
      due: next === 'due',
      intent: next === 'hot' ? 'hot' : '',
    });
    if (next === 'link_sent') { setFilters({ ...EMPTY_FILTERS, q: filters.q }); setView('pipeline'); return; }
    if (next) setView('leads');
  };

  const open = (id) => setLeadDetailId(id);

  return (
    <SectionErrorBoundary name="Operations" onRetry={refetch}>
      <div>
        <div style={{ marginBottom: 18, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: 4 }}>Operations</h1>
            <p style={{ color: c.muted, fontSize: 15, marginBottom: 6 }}>
              {opsScope ? (tenants.find((t) => t._id === opsScope)?.businessName || 'Selected client') + ': every lead, by sales stage' : 'Every client: every lead, by sales stage'}
            </p>
            <DataFreshness colors={c} onRefresh={refetch} queries={[crmQ, owedWorkQ]} />
          </div>
          {isSuperAdmin && tenants.length > 0 && (
            <div>
              <label htmlFor="ops-scope" style={{ color: c.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Viewing</label>
              <select
                id="ops-scope"
                value={opsScope}
                onChange={(e) => changeScope(e.target.value)}
                style={{ padding: '9px 14px', background: opsScope ? c.lime + '18' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (opsScope ? c.lime + '55' : c.borderDim), borderRadius: 10, color: opsScope ? c.lime : c.text, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minWidth: 220 }}
              >
                <option value="">🌍 All clients</option>
                {tenants.map((t) => <option key={t._id} value={t._id}>{t.businessName}</option>)}
              </select>
            </div>
          )}
        </div>

        {crmQ.isError && (
          <div role="alert" style={{ background: c.red + '12', border: '1px solid ' + c.red + '33', color: c.red, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
            Couldn't load the pipeline. {crmError(crmQ.error)}
          </div>
        )}

        <KpiStrip summary={crm?.summary} onPick={pickKpi} active={kpi} />

        <div role="tablist" style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1px solid ' + c.borderDim, overflowX: 'auto' }}>
          {VIEWS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)} style={{
              padding: '10px 16px', background: 'none', border: 'none', borderBottom: view === k ? '2px solid ' + c.lime : '2px solid transparent',
              color: view === k ? c.lime : c.muted, cursor: 'pointer', fontSize: 13, fontWeight: view === k ? 700 : 500, whiteSpace: 'nowrap', fontFamily: 'inherit', marginBottom: -1,
            }}>
              {label}
              {k === 'today' && crm?.summary?.waiting > 0 && <span style={{ marginLeft: 6, background: c.red, color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 999 }}>{crm.summary.waiting}</span>}
              {k === 'alerts' && alerts.length > 0 && <span style={{ marginLeft: 6, background: c.amber, color: '#060806', fontSize: 10, padding: '1px 6px', borderRadius: 999 }}>{alerts.length}</span>}
            </button>
          ))}
        </div>

        {view === 'today' && (
          <SectionErrorBoundary name="Today" onRetry={refetch}>
            <TodayVerdict owedWork={owedWorkQ} health={healthQ} colors={c} />
            <ActionRail query={owedWorkQ} colors={c} onOpenLead={setLeadDetailId} scope={opsScope} />
            <MoneyPanel query={moneyQ} colors={c} />
            <HealthWarnings query={healthQ} colors={c} />
          </SectionErrorBoundary>
        )}

        {(view === 'pipeline' || view === 'leads') && (
          <SectionErrorBoundary name={view === 'pipeline' ? 'Pipeline' : 'Leads'} onRetry={refetch}>
            <CrmToolbar filters={filters} setFilters={(f) => { setFilters(f); setKpi(''); }} tenants={tenants} showBusiness={showBusiness} counts={crm?.summary} />
            {crmQ.isPending
              ? <div style={{ color: c.muted, padding: 30, textAlign: 'center' }}>Loading the pipeline…</div>
              : view === 'pipeline'
                ? <PipelineBoard buckets={buckets} leads={filtered} onOpen={open} showBusiness={showBusiness} showClosed={filters.showClosed} now={now} />
                : <LeadsList leads={filtered} buckets={buckets} onOpen={open} showBusiness={showBusiness} now={now} />}
          </SectionErrorBoundary>
        )}

        {view === 'inbox' && (
          <SectionErrorBoundary name="Inbox" onRetry={refetch}>
            <InboxView scope={opsScope} tenantNameById={tenantNameById} onOpen={open} />
          </SectionErrorBoundary>
        )}
        {view === 'reports' && (
          <SectionErrorBoundary name="Reports" onRetry={refetch}>
            <ReportsView scope={opsScope} colors={c} />
          </SectionErrorBoundary>
        )}
        {view === 'alerts' && (
          <SectionErrorBoundary name="Alerts" onRetry={refetch}>
            <AlertsView scope={opsScope} onOpen={open} />
          </SectionErrorBoundary>
        )}
      </div>
    </SectionErrorBoundary>
  );
}
