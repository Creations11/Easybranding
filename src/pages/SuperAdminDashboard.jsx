// src/pages/SuperAdminDashboard.jsx
// ─────────────────────────────────────────────────────────────
// Easy Branding AI — Super Admin & EB Manager Dashboard
//
// FIX APPLIED (21 June 2026):
// PACMembersPanel.jsx was built and verified working (stats, search,
// filter, member detail modal, CSV export, payment status) but was
// NEVER imported or added to navSections / the section render block
// in this file. It existed as a complete, working component with no
// way to actually reach it from the dashboard UI — there was no tab,
// no button, nothing in navSections pointing to it. Fixed by adding
// the import, a "Members" nav entry (shown to super admins, since
// PAC member management is an administrative function), and the
// corresponding section render block, following the same pattern
// already used for "platform" (isSuperAdmin-gated).
// ─────────────────────────────────────────────────────────────
import { useState, useMemo } from 'react';
import api from '../api';
import LeadDetailModal from '../components/LeadDetailModal';
import SectionErrorBoundary from '../components/SectionErrorBoundary';
import StatCard from '../components/StatCard';
import DataFreshness from '../components/DataFreshness';
import ActionRail from '../components/ActionRail';
import MoneyPanel from '../components/MoneyPanel';
import HealthWarnings from '../components/HealthWarnings';
import { useAuth } from '../context/AuthContext';
import {
  useOverview, useAllLeads, useActiveLeads, useQualifiedLeads,
  useRejectedLeads, useClosedLeads, useStages, useViewings,
  useMessages, useAlerts, useTenants, useTenantStats,
  useUsers, usePendingUsers, useAgents, useHealth,
  useRefetchAll, getStoredScope, setStoredScope, useFlowTemplates,
  useOwedWork, useMoneyView, useHealthWarnings,
} from '../hooks/useDashboardData';
import ProspectingPanel from '../components/ProspectingPanel';
import AgentStatsPanel from '../components/AgentStatsPanel';
import EBTeamPanel from '../components/EBTeamPanel';
import ClientModal from '../components/ClientModal';
import ApproveModal from '../components/ApproveModal';
import BulkClientActions from '../components/BulkClientActions';
import Pagination from '../components/Pagination';
import { useSearchFilter } from '../hooks/useSearchFilter';
import QuickPaymentPanel from '../components/QuickPaymentPanel';
import WhatsAppStatus from '../components/WhatsAppStatus';
import AuditLog from '../components/AuditLog';
import exportCSV from '../utils/exportCSV';
// FIX: PACMembersPanel existed but was never imported.
import PACMembersPanel from '../components/PACMembersPanel';
import AutomationPanel from '../components/AutomationPanel';

// ── Design tokens ─────────────────────────────────────────────
const c = {
  bg: '#06080A', sidebar: '#080B08', surface: '#0D110C',
  card: '#121710', lime: '#B8F040', earth: '#C4873A',
  moss: '#4A6741', sage: '#7A9E6E', cyan: '#22d3ee',
  emerald: '#34d399', amber: '#fbbf24', red: '#f87171',
  orange: '#f97316', text: '#EEF0E8', muted: '#8A9080',
  border: 'rgba(184,240,64,0.12)', borderDim: 'rgba(255,255,255,0.06)',
};

const STATUS_COLOR = {
  active: c.lime, trial: c.amber, suspended: c.red,
  cancelled: c.muted, qualified: c.lime, not_qualified: c.red,
  taken_over: c.orange, closed: c.muted,
};

const PLAN_COLOR = { starter: c.sage, growth: c.lime, enterprise: c.cyan };

// ── Main Component ────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const { user, isSuperAdmin, isEBAgent, signOut } = useAuth();

  // ── Tenant scope ──────────────────────────────────────────
  // As super-admin every list spans all tenants, which mixes platform
  // oversight with working EasyBranding's own customers. Scope narrows
  // Operations to one tenant; the choice persists across reloads.
  const [opsScope, setOpsScope] = useState(() => getStoredScope());
  const changeScope = (v) => { setStoredScope(v); setOpsScope(v); };

  // ── React Query data ──────────────────────────────────────
  const overviewQ    = useOverview(opsScope);
  const owedWorkQ    = useOwedWork(opsScope);
  const moneyQ       = useMoneyView(opsScope);
  const healthQ      = useHealthWarnings(opsScope);
  const overview     = overviewQ.data;
  const allLeads     = useAllLeads().data || [];
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
  const stages       = useStages(opsScope).data || [];
  const viewings     = useViewings(opsScope).data || [];
  const messages     = useMessages(opsScope).data || [];
  const alerts       = useAlerts(opsScope).data || [];
  const tenants      = useTenants().data || [];
  const tenantStats  = useTenantStats().data;
  const allUsers     = useUsers().data || [];
  const pendingUsers = usePendingUsers().data || [];
  const agents       = useAgents().data || [];
  const health       = useHealth().data;
  const flowTemplates = useFlowTemplates().data || [];
  const refetch      = useRefetchAll();

  const isLoading = !isEBAgent && (!overview && !tenants.length && !activeLeads.length);

  // ── Local UI state ─────────────────────────────────────────
  const [section, setSection] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('eb_user') || '{}');
      return u.role === 'eb_agent' ? 'prospecting' : 'operations';
    } catch { return 'operations'; }
  });
  const [opsTab, setOpsTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [leadDetailId, setLeadDetailId] = useState(null);
  const [clientModal,  setClientModal]  = useState(null);
  const [approveModal, setApproveModal] = useState(null);
  const [inviteModal,  setInviteModal]  = useState(null);
  const [inviteUrl,    setInviteUrl]    = useState('');
  const [bulkModal,    setBulkModal]    = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [flowChoice,   setFlowChoice]   = useState({}); // tenantId → templateId (Allocate picker)

  // ── Pagination & Search ───────────────────────────────────
  const [clientsPage, setClientsPage] = useState(1);
  const [usersPage,   setUsersPage]   = useState(1);
  const ITEMS_PER_PAGE = 10;

  const clientsFilter = useSearchFilter(tenants, {
    searchFields: ['businessName', 'contactEmail', 'whatsappNumber'],
  });

  const usersFilter = useSearchFilter(allUsers, {
    searchFields: ['fullName', 'email', 'phone'],
  });

  // ── Messages: filter by business name + date contacted ────
  const [msgSearch,   setMsgSearch]   = useState('');
  const [msgDateFrom, setMsgDateFrom] = useState('');
  const [msgDateTo,   setMsgDateTo]   = useState('');

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

  // ── Leads CRM board: grouped by status, filterable by tenant ─
  const [leadsTenantFilter, setLeadsTenantFilter] = useState('all');

  // /admin-ops/conversations/active is framed as "live conversations
  // right now" — likely time-windowed rather than every in-progress
  // lead. Anything in allLeads not present in one of the four status
  // buckets below gets its own "Other" column instead of silently
  // disappearing, so every lead in the system shows up somewhere.
  const categorizedIds = useMemo(() => {
    const ids = new Set();
    [...activeLeads, ...qualifiedLeads, ...rejectedLeads, ...closedLeads].forEach(l => ids.add(l._id));
    return ids;
  }, [activeLeads, qualifiedLeads, rejectedLeads, closedLeads]);

  // allLeads (GET /leads) is NOT scoped by the Operations "Viewing" selector
  // — that endpoint doesn't honor ?tenantId (it scopes only via the
  // x-tenant-id header, which the dashboard doesn't send) — so when a
  // super-admin narrows to one client, filter the "Other" column here to
  // match the scoped status columns. Without this, "Other" showed every
  // tenant's uncategorized leads while the rest of the board was scoped.
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

  // ── Mutations ──────────────────────────────────────────────
  const handleSuspendToggle = async (tenant) => {
    const ns = tenant.status === 'suspended' ? 'active' : 'suspended';
    try { await api.put('/tenants/' + tenant._id, { status: ns }); refetch(); }
    catch { alert('Failed to update status'); }
  };
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
  // NEW (29 June 2026): reopen a closed lead back into normal bot
  // flow — see useDashboardData.js and adminOpsController.js for
  // the full explanation of why this was needed.
  const handleReopen = async (e, lid) => {
    e.stopPropagation();
    try { await api.post('/admin-ops/leads/' + lid + '/reopen'); refetch(); }
    catch (err) { alert(err.response?.data?.message || 'Reopen failed'); }
  };
  const handleDeleteClient = async (tenant) => {
    if (!confirm('Delete ' + tenant.businessName + '?')) return;
    try { await api.delete('/tenants/' + tenant._id); refetch(); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };
  // Allocate an industry flow template as the client's LIVE bot (inbound_any
  // on their number). The picker's value is tracked per-tenant in flowChoice.
  const handleAllocateFlow = async (tenant) => {
    const templateId = flowChoice[tenant._id] || flowTemplates[0]?.id;
    if (!templateId) { alert('No flow templates available'); return; }
    const tmpl = flowTemplates.find(t => t.id === templateId);
    if (!confirm(`Allocate the "${tmpl?.label || templateId}" flow to ${tenant.businessName}?\n\nIt becomes their live WhatsApp bot (answers every message on their number).`)) return;
    try {
      await api.post(`/admin-ops/automation/tenants/${tenant._id}/allocate-flow`, { templateId });
      refetch();
      alert(`✅ "${tmpl?.label || 'Flow'}" allocated to ${tenant.businessName}`);
    } catch (err) { alert(err.response?.data?.message || 'Failed to allocate flow'); }
  };
  const handleRejectUser = async (u) => {
    if (!confirm('Reject ' + u.fullName + '?')) return;
    try { await api.post('/users/' + u._id + '/reject', { reason: 'Application rejected' }); refetch(); }
    catch { alert('Failed to reject user'); }
  };
  const handleDeleteUser = async (u) => {
    if (!confirm('Delete ' + (u.fullName || u.email) + '? They will lose access and disappear from this list.')) return;
    try { await api.delete('/users/' + u._id); refetch(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete user'); }
  };
  const generateInvite = async (tenant) => {
    try {
      const res = await api.post('/invites/' + tenant._id + '/generate');
      setInviteUrl(res.data.data?.inviteUrl || '');
      setInviteModal(tenant);
      refetch();
    } catch { alert('Failed to generate invite'); }
  };

  // ── Navigation ─────────────────────────────────────────────
  const navSections = useMemo(() => {
    const s = [];
    if (!isEBAgent) { s.push({ id: 'operations', icon: '🏠', label: 'Operations', badge: alerts.length }); }
    if (!isEBAgent) { s.push({ id: 'clients',    icon: '👥', label: 'Clients',    badge: 0 }); }
    // FIX: PACMembersPanel had no nav entry anywhere — added here,
    // gated to super admin since member management is an
    // administrative function, matching the gating pattern already
    // used for "platform" below.
    if (isSuperAdmin) { s.push({ id: 'members', icon: '✊', label: 'PAC Members', badge: 0 }); }
    s.push({ id: 'prospecting', icon: '📤', label: 'Prospecting', badge: 0 });
    if (isEBAgent)  { s.push({ id: 'agentstats', icon: '📊', label: 'My Stats', badge: 0 }); }
    if (!isEBAgent) { s.push({ id: 'ebteam',     icon: '👔', label: 'EB Team',   badge: 0 }); }
    if (!isEBAgent) { s.push({ id: 'users',      icon: '👤', label: 'Users',     badge: pendingUsers.length }); }
    if (isSuperAdmin) { s.push({ id: 'automation', icon: '🤖', label: 'Automation', badge: 0 }); }
    if (isSuperAdmin) { s.push({ id: 'platform', icon: '⚙️', label: 'Platform', badge: 0 }); }
    return s;
  }, [isEBAgent, isSuperAdmin, alerts.length, pendingUsers.length]);

  const opsTabs = ['overview', 'leads', 'funnel', 'viewings', 'messages', 'alerts'];

  // ── Loading ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: c.bg, color: c.muted, fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🌿</div>
          <p>Loading platform data...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", minHeight: '100vh', background: c.bg, color: c.text, display: 'flex' }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${c.bg}}::-webkit-scrollbar-thumb{background:${c.moss};border-radius:2px}.nav-item-hover:hover{background:rgba(184,240,64,0.06)!important;color:${c.text}!important}.card-hover:hover{border-color:rgba(184,240,64,0.2)!important;transform:translateY(-2px)}.card-hover{transition:all 0.2s ease}
        .leads-board-scroll::-webkit-scrollbar{height:10px}.leads-board-scroll::-webkit-scrollbar-track{background:${c.borderDim};border-radius:999px}.leads-board-scroll::-webkit-scrollbar-thumb{background:${c.lime};border-radius:999px}
        @media(max-width:768px){.sidebar{display:none!important}.mobile-hamburger{display:flex!important}.main-content{margin-left:0!important;padding:12px!important;padding-top:72px!important}.main-content div[style*="grid-template-columns"]{grid-template-columns:1fr!important}.mobile-drawer{display:flex!important}}
        @media(min-width:769px){.mobile-hamburger{display:none!important}.mobile-drawer{display:none!important}}
      `}</style>

      {/* Mobile hamburger */}
      <button className="mobile-hamburger" onClick={() => setMobileMenuOpen(true)} style={{ display: 'none', position: 'fixed', top: 14, left: 12, zIndex: 200, width: 44, height: 44, borderRadius: 10, background: c.sidebar, border: '1px solid ' + c.borderDim, color: c.lime, fontSize: 20, cursor: 'pointer' }}>☰</button>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 250 }} />}

      {/* Mobile drawer */}
      <div className="mobile-drawer" style={{ display: 'none', position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, maxWidth: '80vw', background: c.sidebar, borderRight: '1px solid ' + c.borderDim, zIndex: 300, flexDirection: 'column', overflowY: 'auto', transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid ' + c.borderDim, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,' + c.lime + ',' + c.moss + ')', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🌿</div>
          <div style={{ flex: 1 }}><p style={{ fontSize: 14, fontWeight: 700, color: c.text }}>Easy Branding</p><p style={{ fontSize: 11, color: c.lime, fontWeight: 600 }}>AI</p></div>
          <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: c.muted, fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: '12px 8px', flex: 1 }}>
          {navSections.map(nav => (
            <button key={nav.id} onClick={() => { setSection(nav.id); setMobileMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: section === nav.id ? 'rgba(184,240,64,0.12)' : 'transparent', color: section === nav.id ? c.lime : c.muted, fontSize: 15, fontWeight: section === nav.id ? 600 : 400, fontFamily: 'inherit', marginBottom: 2, textAlign: 'left' }}>
              <span style={{ fontSize: 20, width: 26, textAlign: 'center' }}>{nav.icon}</span>
              <span style={{ flex: 1 }}>{nav.label}</span>
              {nav.badge > 0 && <span style={{ background: c.amber, color: '#080A06', fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 999 }}>{nav.badge}</span>}
            </button>
          ))}
        </div>
        <div style={{ padding: 16, borderTop: '1px solid ' + c.borderDim }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 2 }}>{user?.fullName || 'Ayanda'}</p>
          <p style={{ fontSize: 12, color: c.lime, marginBottom: 12 }}>{user?.role}</p>
          <button onClick={signOut} style={{ width: '100%', padding: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid ' + c.borderDim, color: c.muted, borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>Sign Out</button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="sidebar" style={{ width: sidebarOpen ? 220 : 64, minHeight: '100vh', background: c.sidebar, borderRight: '1px solid ' + c.borderDim, display: 'flex', flexDirection: 'column', position: 'fixed', top: 64, left: 0, bottom: 0, zIndex: 50, transition: 'width 0.2s ease', overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid ' + c.borderDim, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,' + c.lime + ',' + c.moss + ')', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🌿</div>
          {sidebarOpen && <div><p style={{ fontSize: 13, fontWeight: 700, color: c.text }}>Easy Branding</p><p style={{ fontSize: 11, color: c.lime, fontWeight: 600 }}>AI</p></div>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontSize: 16, padding: 4, flexShrink: 0 }}>{sidebarOpen ? '←' : '→'}</button>
        </div>
        <div style={{ padding: '12px 8px', flex: 1 }}>
          {navSections.map(nav => (
            <button key={nav.id} onClick={() => setSection(nav.id)} className="nav-item-hover" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 10, border: 'none', cursor: 'pointer', background: section === nav.id ? 'rgba(184,240,64,0.12)' : 'transparent', color: section === nav.id ? c.lime : c.muted, fontSize: 14, fontWeight: section === nav.id ? 600 : 400, fontFamily: 'inherit', marginBottom: 2, textAlign: 'left' }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{nav.icon}</span>
              {sidebarOpen && <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{nav.label}</span>}
              {sidebarOpen && nav.badge > 0 && <span style={{ background: c.amber, color: '#080A06', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 999 }}>{nav.badge}</span>}
            </button>
          ))}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid ' + c.borderDim }}>
          {sidebarOpen ? (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 2 }}>{user?.fullName || 'Ayanda'}</p>
              <p style={{ fontSize: 11, color: c.lime, marginBottom: 10 }}>{user?.role}</p>
              <button onClick={signOut} style={{ width: '100%', padding: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid ' + c.borderDim, color: c.muted, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Sign Out</button>
            </>
          ) : <button onClick={signOut} style={{ width: '100%', padding: 8, background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontSize: 18 }}>↩</button>}
        </div>
      </div>

      {/* Main content */}
      <div className="main-content" style={{ marginLeft: sidebarOpen ? 220 : 64, flex: 1, minWidth: 0, padding: '32px', paddingTop: 96, transition: 'margin-left 0.2s ease', minHeight: '100vh' }}>

        {/* ════════ OPERATIONS ════════ */}
        {section === 'operations' && (
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
              {/* Above the tabs on purpose: owed work is not one view among
                  several, it is the answer to "is today fine?" — so it must
                  not be something you have to navigate to in order to see. */}
              <ActionRail query={owedWorkQ} colors={c} onOpenLead={setLeadDetailId} />

              <MoneyPanel query={moneyQ} colors={c} />

              <HealthWarnings query={healthQ} colors={c} />

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
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                      <h2 style={{ fontSize: 20, fontWeight: 700 }}>Leads <span style={{ color: c.muted, fontWeight: 400, fontSize: 14 }}>({allLeads.length} total in system)</span></h2>
                      <select
                        value={leadsTenantFilter}
                        onChange={e => setLeadsTenantFilter(e.target.value)}
                        style={{ padding: '9px 14px', borderRadius: 10, background: c.card, border: '1px solid ' + c.borderDim, color: c.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
                      >
                        <option value="all">All businesses</option>
                        {tenants.map(t => (
                          <option key={t._id} value={t._id}>{t.businessName}</option>
                        ))}
                      </select>
                    </div>

                    <p style={{ color: c.muted, fontSize: 12, marginBottom: 12 }}>
                      Scroll sideways (mouse wheel, trackpad, or drag the scrollbar below) to see Qualified, Rejected, Closed{leadColumns.some(c2 => c2.key === 'other') ? ', and Other' : ''} →
                    </p>

                    {/* onWheel: a horizontal-scroll-only row is easy to miss —
                        without this, columns past the first are only reachable
                        via a trackpad swipe or shift+scroll, which most mouse
                        users won't discover. Converts normal vertical scroll
                        into horizontal movement while hovering the board —
                        but ONLY when there's no vertical scrolling left to do
                        in whatever's under the cursor. Without that check,
                        this handler hijacked scrolling through a column's own
                        list (each column has its own 620px-tall internal
                        scroll), making anything past the visible portion of
                        a column unreachable. */}
                    <div
                      className="leads-board-scroll"
                      onWheel={e => {
                        if (e.deltaY === 0) return;
                        const col = e.target.closest('.lead-column-scroll');
                        if (col) {
                          const canScrollDown = e.deltaY > 0 && col.scrollTop + col.clientHeight < col.scrollHeight;
                          const canScrollUp = e.deltaY < 0 && col.scrollTop > 0;
                          if (canScrollDown || canScrollUp) return; // let the column scroll normally
                        }
                        e.currentTarget.scrollLeft += e.deltaY;
                        e.preventDefault();
                      }}
                      style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}
                    >
                      {leadColumns.map(col => (
                        <div key={col.key} style={{ flex: '0 0 300px', width: 300 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 15, fontWeight: 700 }}>{col.icon} {col.label}</span>
                            <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 999, background: c.borderDim, color: c.muted, fontWeight: 700 }}>{col.items.length}</span>
                            {/* Say so when the server holds more than arrived. A column
                                that silently showed its first 20 of 70 is what put 50
                                closed leads under "Other" (fixed 2026-07-27). */}
                            {col.q?.data?.total > col.items.length && leadsTenantFilter === 'all' && (
                              <span title={`Showing ${col.items.length} of ${col.q.data.total}`}
                                style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: c.amber + '22', color: c.amber, fontWeight: 700 }}>
                                of {col.q.data.total}
                              </span>
                            )}
                          </div>
                          <div className="lead-column-scroll" style={{ maxHeight: 620, overflowY: 'auto', paddingRight: 4 }}>
                            {/* Three distinct states. They all rendered as "None" before,
                                so a failed fetch was indistinguishable from an empty
                                column — the board's most misleading behaviour. */}
                            {col.q?.isError ? (
                              <div style={{ padding: '18px 0', textAlign: 'center' }}>
                                <p style={{ color: c.red, fontSize: 13, marginBottom: 8 }}>Couldn't load this column</p>
                                <button onClick={() => col.q.refetch?.()} style={{ padding: '5px 12px', background: c.red + '22', color: c.red, border: '1px solid ' + c.red + '44', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Retry</button>
                              </div>
                            ) : col.q?.isLoading ? (
                              <p style={{ color: c.muted, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Loading…</p>
                            ) : col.items.length === 0 ? (
                              <p style={{ color: c.muted, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>None</p>
                            ) : col.items.map(lead => {
                              const business = tenantNameById[lead.tenantId];
                              return (
                                <div key={lead._id} onClick={() => setLeadDetailId(lead._id)} className="card-hover" style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                                    <strong style={{ fontSize: 13 }}>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                                  </div>
                                  {business && <p style={{ color: c.cyan, fontSize: 11, marginBottom: 3 }}>{business}</p>}
                                  <p style={{ color: c.muted, fontSize: 12, marginBottom: 6 }}>{lead.phone}</p>

                                  {col.key === 'active' && (
                                    <>
                                      {lead.isProspect && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: c.lime + '22', color: c.lime, fontWeight: 700, marginRight: 6 }}>🎯 Prospect</span>}
                                      <div style={{ marginTop: 6 }}>
                                        {lead.takenOver
                                          ? <button onClick={(e) => handleResume(e, lead._id)} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: c.cyan + '22', color: c.cyan, border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>🤖 Resume bot</button>
                                          : <button onClick={(e) => handleTakeover(e, lead._id)} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: c.lime, color: '#06080A', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>✋ Take over</button>}
                                      </div>
                                    </>
                                  )}

                                  {col.key === 'qualified' && lead.aiSummary?.score && (
                                    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, fontWeight: 700, background: lead.aiSummary.score >= 8 ? c.lime + '22' : c.amber + '22', color: lead.aiSummary.score >= 8 ? c.lime : c.amber }}>🤖 {lead.aiSummary.score}/10</span>
                                  )}

                                  {col.key === 'rejected' && (
                                    <p style={{ color: c.red, fontSize: 11 }}>{lead.rejectionReason || 'Did not qualify'}</p>
                                  )}

                                  {col.key === 'closed' && (
                                    <>
                                      <p style={{ color: c.muted, fontSize: 11, marginBottom: 6 }}>{lead.closeReason || 'Manually closed'}{lead.closedAt ? ' · ' + new Date(lead.closedAt).toLocaleDateString('en-ZA') : ''}</p>
                                      <button onClick={(e) => handleReopen(e, lead._id)} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: c.lime + '22', color: c.lime, border: '1px solid ' + c.border, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>🔓 Reopen</button>
                                    </>
                                  )}

                                  {col.key === 'other' && (
                                    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: c.amber + '18', color: c.amber }}>{lead.workflowStatus?.replace(/_/g, ' ') || 'unknown status'}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
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
        )}

        {/* ════════ CLIENTS ════════ */}
        {section === 'clients' && (
          <SectionErrorBoundary name="Clients" onRetry={refetch}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <div><h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: 4 }}>Clients</h1><p style={{ color: c.muted, fontSize: 15 }}>Manage rental agency accounts</p></div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => {
                    if (selectedClientIds.length === 0) {
                      alert('Select clients first by checking the boxes');
                      return;
                    }
                    setBulkModal(true);
                  }} style={{ padding: '12px 18px', background: selectedClientIds.length > 0 ? c.amber + '22' : 'rgba(255,255,255,0.04)', color: selectedClientIds.length > 0 ? c.amber : c.muted, border: '1px solid ' + (selectedClientIds.length > 0 ? c.amber + '33' : c.borderDim), borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>
                    📦 Bulk ({selectedClientIds.length})
                  </button>
                  <button onClick={() => {
                    const exportData = clientsFilter.filtered.map(t => ({
                      businessName: t.businessName || '',
                      status: t.status || '',
                      plan: t.plan || '',
                      email: t.contactEmail || '',
                      whatsapp: t.whatsappNumber || '',
                      leads: t.totalLeads || 0,
                      monthlyFee: 'R' + (t.monthlyFee || 0),
                    }));
                    exportCSV(exportData, 'clients-export');
                  }} style={{ padding: '12px 18px', background: c.cyan + '22', color: c.cyan, border: '1px solid ' + c.cyan + '33', borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>📥 Export CSV</button>
                  <button onClick={() => setClientModal({})} style={{ padding: '12px 24px', background: c.lime, color: '#080A06', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Client</button>
                </div>
              </div>
              {tenantStats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 28 }}>
                  <StatCard label="Total" value={tenantStats.total || 0} icon="👥" />
                  <StatCard label="Active" value={tenantStats.active || 0} color={c.lime} icon="✅" />
                  <StatCard label="Trial" value={tenantStats.trial || 0} color={c.amber} icon="🧪" />
                  <StatCard label="MRR" value={'R' + ((tenantStats.mrr || 0).toLocaleString())} color={c.lime} icon="💰" sub="monthly recurring" />
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  value={clientsFilter.searchTerm}
                  onChange={e => { clientsFilter.setSearchTerm(e.target.value); setClientsPage(1); }}
                  placeholder="Search clients..."
                  style={{ padding: '10px 14px', background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', flex: 1, minWidth: '200px' }}
                />
                <select
                  value={clientsFilter.filters.status || 'all'}
                  onChange={e => { clientsFilter.setFilter('status', e.target.value === 'all' ? null : e.target.value); setClientsPage(1); }}
                  style={{ padding: '10px 14px', background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={clientsFilter.filters.plan || 'all'}
                  onChange={e => { clientsFilter.setFilter('plan', e.target.value === 'all' ? null : e.target.value); setClientsPage(1); }}
                  style={{ padding: '10px 14px', background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  <option value="all">All Plans</option>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                {(clientsFilter.searchTerm || clientsFilter.filters.status || clientsFilter.filters.plan) && (
                  <button onClick={() => { clientsFilter.clearAll(); setClientsPage(1); }} style={{ padding: '10px 14px', background: 'transparent', border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.muted, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
                    Clear
                  </button>
                )}
              </div>

              {clientsFilter.filteredCount !== clientsFilter.totalCount && (
                <p style={{ color: c.muted, fontSize: 13, marginBottom: 12 }}>
                  Showing {clientsFilter.filteredCount} of {clientsFilter.totalCount} clients
                </p>
              )}

              {clientsFilter.filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}>
                  <p style={{ fontSize: 40, marginBottom: 16 }}>{clientsFilter.searchTerm ? '🔍' : '🌿'}</p>
                  <p>{clientsFilter.searchTerm ? 'No clients match your search.' : 'No clients yet — add your first one.'}</p>
                </div>
              ) : (
                <>
                  {clientsFilter.filtered
                    .slice((clientsPage - 1) * ITEMS_PER_PAGE, clientsPage * ITEMS_PER_PAGE)
                    .map(tenant => (
                    <div key={tenant._id} className="card-hover" style={{ background: c.card, border: '1px solid ' + (!tenant.whatsappNumber ? c.amber + '44' : selectedClientIds.includes(tenant._id) ? c.lime + '66' : c.borderDim), borderRadius: 14, padding: '18px 24px', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <input type="checkbox" checked={selectedClientIds.includes(tenant._id)} onChange={() => {
                          setSelectedClientIds(prev => prev.includes(tenant._id) ? prev.filter(id => id !== tenant._id) : [...prev, tenant._id]);
                        }} style={{ cursor: 'pointer', accentColor: c.lime, width: 16, height: 16 }} />
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                              <strong style={{ fontSize: 16 }}>{tenant.businessName}</strong>
                              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: (STATUS_COLOR[tenant.status] || c.muted) + '22', color: STATUS_COLOR[tenant.status] || c.muted, fontWeight: 600 }}>{tenant.status}</span>
                              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: (PLAN_COLOR[tenant.plan] || c.muted) + '22', color: PLAN_COLOR[tenant.plan] || c.muted }}>{tenant.plan}</span>
                              {!tenant.whatsappNumber && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: c.amber + '22', color: c.amber, fontWeight: 600 }}>⚠️ No WhatsApp</span>}
                            </div>
                            <p style={{ color: c.muted, fontSize: 13 }}>{tenant.contactEmail}{tenant.whatsappNumber ? ' · ' + tenant.whatsappNumber : ''}</p>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center', padding: '6px 12px', background: c.lime + '08', borderRadius: 8 }}><p style={{ color: c.lime, fontWeight: 700, fontSize: 16 }}>{tenant.totalLeads || 0}</p><p style={{ color: c.muted, fontSize: 10 }}>Leads</p></div>
                            <div style={{ textAlign: 'center', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}><p style={{ color: c.text, fontWeight: 700, fontSize: 16 }}>R{tenant.monthlyFee}</p><p style={{ color: c.muted, fontSize: 10 }}>/mo</p></div>
                            <button onClick={() => handleSuspendToggle(tenant)} style={{ padding: '7px 14px', background: tenant.status === 'suspended' ? c.lime + '22' : c.amber + '22', color: tenant.status === 'suspended' ? c.lime : c.amber, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>{tenant.status === 'suspended' ? '▶ Activate' : '⏸ Suspend'}</button>
                            <button onClick={() => setClientModal(tenant)} style={{ padding: '7px 14px', background: c.lime + '22', color: c.lime, border: '1px solid ' + c.border, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Edit</button>
                            <button onClick={() => generateInvite(tenant)} style={{ padding: '7px 14px', background: c.cyan + '22', color: c.cyan, border: '1px solid ' + c.cyan + '33', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>🔗 Invite</button>
                            {isSuperAdmin && <button onClick={() => handleDeleteClient(tenant)} style={{ padding: '7px 14px', background: c.red + '22', color: c.red, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Delete</button>}
                            {isSuperAdmin && flowTemplates.length > 0 && (
                              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <select value={flowChoice[tenant._id] || flowTemplates[0].id} onChange={e => setFlowChoice(prev => ({ ...prev, [tenant._id]: e.target.value }))} title="Industry flow template" style={{ padding: '7px 8px', background: c.moss + '22', color: c.sage, border: '1px solid ' + c.moss + '55', borderRadius: 8, fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                                  {flowTemplates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                                <button onClick={() => handleAllocateFlow(tenant)} title="Allocate this flow as the client's live bot" style={{ padding: '7px 12px', background: c.lime + '22', color: c.lime, border: '1px solid ' + c.border, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>⚡ Allocate</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Pagination
                    currentPage={clientsPage}
                    totalPages={Math.ceil(clientsFilter.filtered.length / ITEMS_PER_PAGE)}
                    onPageChange={setClientsPage}
                    showInfo
                    totalItems={clientsFilter.filtered.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                  />
                </>
              )}
            </div>
          </SectionErrorBoundary>
        )}

        {/* ════════ PAC MEMBERS ════════ */}
        {/* FIX: this entire block was missing — PACMembersPanel.jsx
            existed as a complete component but had no render path. */}
        {section === 'members' && isSuperAdmin && (
          <SectionErrorBoundary name="PAC Members" onRetry={refetch}>
            <PACMembersPanel />
          </SectionErrorBoundary>
        )}

        {/* ════════ PROSPECTING ════════ */}
        {section === 'prospecting' && (
          <SectionErrorBoundary name="Prospecting" onRetry={() => window.location.reload()}>
            <ProspectingPanel currentUser={user} />
          </SectionErrorBoundary>
        )}

        {/* ════════ AGENT STATS ════════ */}
        {section === 'agentstats' && isEBAgent && (
          <SectionErrorBoundary name="Agent Stats" onRetry={() => window.location.reload()}>
            <AgentStatsPanel user={user} />
          </SectionErrorBoundary>
        )}

        {/* ════════ EB TEAM ════════ */}
        {section === 'ebteam' && (
          <SectionErrorBoundary name="EB Team" onRetry={refetch}>
            <EBTeamPanel isSuperAdmin={isSuperAdmin} tenants={tenants} onReload={refetch} />
          </SectionErrorBoundary>
        )}

        {/* ════════ USERS ════════ */}
        {section === 'users' && (
          <SectionErrorBoundary name="Users" onRetry={refetch}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <div><h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: 4 }}>Users</h1><p style={{ color: c.muted, fontSize: 15 }}>Platform user management</p></div>
                <button onClick={() => {
                  const exportData = usersFilter.filtered.map(u => ({
                    name: u.fullName || '',
                    email: u.email || '',
                    phone: u.phone || '',
                    role: u.role || '',
                    approved: u.approved ? 'Yes' : 'No',
                    plan: u.requestedPlan || '',
                  }));
                  exportCSV(exportData, 'users-export');
                }} style={{ padding: '12px 18px', background: c.cyan + '22', color: c.cyan, border: '1px solid ' + c.cyan + '33', borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>📥 Export CSV</button>
              </div>
              {pendingUsers.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: c.amber }}>⏳ Pending Approvals ({pendingUsers.length})</h3>
                  {pendingUsers.map(u => (
                    <div key={u._id} style={{ background: c.card, border: '1px solid ' + c.amber + '44', borderRadius: 14, padding: '16px 20px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div><strong>{u.fullName}</strong><p style={{ color: c.muted, fontSize: 13, marginTop: 2 }}>{u.email} · {u.phone}</p>{u.requestedPlan && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: c.lime + '18', color: c.lime, fontWeight: 600, marginTop: 4, display: 'inline-block' }}>{u.requestedPlan} plan</span>}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setApproveModal(u)} style={{ padding: '8px 18px', background: c.lime + '22', color: c.lime, border: '1px solid ' + c.border, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>✅ Approve</button>
                        <button onClick={() => handleRejectUser(u)} style={{ padding: '8px 14px', background: c.red + '22', color: c.red, border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  value={usersFilter.searchTerm}
                  onChange={e => { usersFilter.setSearchTerm(e.target.value); setUsersPage(1); }}
                  placeholder="Search users..."
                  style={{ padding: '10px 14px', background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', flex: 1, minWidth: '200px' }}
                />
                <select
                  value={usersFilter.filters.role || 'all'}
                  onChange={e => { usersFilter.setFilter('role', e.target.value === 'all' ? null : e.target.value); setUsersPage(1); }}
                  style={{ padding: '10px 14px', background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  <option value="all">All Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="eb_manager">EB Manager</option>
                  <option value="eb_agent">EB Agent</option>
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                  <option value="borrower">Borrower</option>
                </select>
                {(usersFilter.searchTerm || usersFilter.filters.role) && (
                  <button onClick={() => { usersFilter.clearAll(); setUsersPage(1); }} style={{ padding: '10px 14px', background: 'transparent', border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.muted, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
                    Clear
                  </button>
                )}
              </div>

              {usersFilter.filteredCount !== usersFilter.totalCount && (
                <p style={{ color: c.muted, fontSize: 13, marginBottom: 12 }}>
                  Showing {usersFilter.filteredCount} of {usersFilter.totalCount} users
                </p>
              )}

              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>All Users ({usersFilter.filteredCount})</h3>

              {usersFilter.filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}>
                  <p style={{ fontSize: 40, marginBottom: 16 }}>{usersFilter.searchTerm ? '🔍' : '👤'}</p>
                  <p>{usersFilter.searchTerm ? 'No users match your search.' : 'No users yet.'}</p>
                </div>
              ) : (
                <>
                  {usersFilter.filtered
                    .slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE)
                    .map(u => (
                    <div key={u._id} style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '14px 18px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div><strong>{u.fullName}</strong><p style={{ color: c.muted, fontSize: 13, marginTop: 2 }}>{u.email}</p></div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: u.approved ? c.lime + '22' : c.amber + '22', color: u.approved ? c.lime : c.amber }}>{u.approved ? '✅ Approved' : '⏳ Pending'}</span>
                        {u.role === 'super_admin' || u._id === user.id ? <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: c.cyan + '22', color: c.cyan, fontWeight: 600 }}>{u.role} {u._id === user.id ? '(you)' : '🔒'}</span>
                          : <select defaultValue={u.role} onChange={async (e) => { try { await api.put('/users/' + u._id, { role: e.target.value }); refetch(); } catch (err) { alert(err.response?.data?.message || 'Failed'); e.target.value = u.role; } }} style={{ padding: '4px 8px', background: c.cyan + '18', border: '1px solid ' + c.cyan + '33', color: c.cyan, borderRadius: 8, fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                            <option value="borrower">borrower</option><option value="agent">agent</option><option value="admin">admin</option><option value="eb_agent">eb_agent</option><option value="eb_manager">eb_manager</option>{isSuperAdmin && <option value="super_admin">super_admin</option>}
                          </select>}
                        {!(u.role === 'super_admin' || u._id === user.id) && (
                          <button onClick={() => handleDeleteUser(u)} title="Delete user" style={{ padding: '5px 10px', background: c.red + '18', color: c.red, border: '1px solid ' + c.red + '33', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>🗑 Delete</button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Pagination
                    currentPage={usersPage}
                    totalPages={Math.ceil(usersFilter.filtered.length / ITEMS_PER_PAGE)}
                    onPageChange={setUsersPage}
                    showInfo
                    totalItems={usersFilter.filtered.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                  />
                </>
              )}
            </div>
          </SectionErrorBoundary>
        )}

        {/* ════════ AUTOMATION (AI agents + workflow engine) ════════ */}
        {section === 'automation' && isSuperAdmin && (
          <SectionErrorBoundary name="Automation" onRetry={refetch}>
            <div>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: 4 }}>Automation</h1>
                <p style={{ color: c.muted, fontSize: 15 }}>AI sales agents, shadow drafts, and workflow-engine flows</p>
              </div>
              <AutomationPanel />
            </div>
          </SectionErrorBoundary>
        )}

        {/* ════════ PLATFORM ════════ */}
        {section === 'platform' && isSuperAdmin && (
          <SectionErrorBoundary name="Platform" onRetry={refetch}>
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
          </SectionErrorBoundary>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      {leadDetailId && <LeadDetailModal leadId={leadDetailId} onClose={() => setLeadDetailId(null)} onUpdate={refetch} />}
      {clientModal !== null && <ClientModal tenant={clientModal} onClose={() => setClientModal(null)} onSaved={() => { setClientModal(null); refetch(); }} />}
      {approveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <ApproveModal user={approveModal} tenants={tenants} onClose={() => setApproveModal(null)} onApproved={() => { setApproveModal(null); refetch(); }} />
        </div>
      )}
      {inviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 500, background: c.surface, borderRadius: 20, border: '1px solid ' + c.border, padding: 32 }}>
            <h3 style={{ color: c.lime, marginBottom: 8 }}>🔗 Invite Link</h3>
            <p style={{ color: c.muted, fontSize: 14, marginBottom: 20 }}>Share with <strong style={{ color: c.text }}>{inviteModal.businessName}</strong> staff.</p>
            <div style={{ background: '#1C1C19', border: '1px solid ' + c.borderDim, borderRadius: 10, padding: 14, marginBottom: 14, wordBreak: 'break-all' }}><p style={{ color: c.lime, fontSize: 13, fontFamily: 'monospace' }}>{inviteUrl}</p></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigator.clipboard.writeText(inviteUrl)} style={{ flex: 1, padding: 12, background: c.lime, color: '#050505', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Copy Link</button>
              <button onClick={() => setInviteModal(null)} style={{ padding: '12px 20px', background: 'transparent', border: '1px solid ' + c.borderDim, color: c.muted, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
            </div>
          </div>
        </div>
      )}
      {bulkModal && (
        <BulkClientActions
          selectedIds={selectedClientIds}
          tenants={tenants}
          onAction={() => { refetch(); setSelectedClientIds([]); }}
          onClose={() => setBulkModal(false)}
        />
      )}
    </div>
  );
}