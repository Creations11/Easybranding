// src/pages/SuperAdminDashboard.jsx
// ─────────────────────────────────────────────────────────────
// Easy Branding AI — Super Admin & EB Manager Dashboard
// ─────────────────────────────────────────────────────────────
import { useState, useMemo } from 'react';
import api from '../api';
import LeadDetailModal from '../components/LeadDetailModal';
import SectionErrorBoundary from '../components/SectionErrorBoundary';
import { useAuth } from '../context/AuthContext';
import {
  useOverview, useActiveLeads, useQualifiedLeads,
  useRejectedLeads, useStages, useViewings,
  useMessages, useAlerts, useTenants, useTenantStats,
  useUsers, usePendingUsers, useAgents, useHealth,
  useRefetchAll,
} from '../hooks/useDashboardData';
import ProspectingPanel from '../components/ProspectingPanel';
import AgentStatsPanel from '../components/AgentStatsPanel';
import EBTeamPanel from '../components/EBTeamPanel';
import ClientModal from '../components/ClientModal';
import ApproveModal from '../components/ApproveModal';
import BulkClientActions from '../components/BulkClientActions';
import Pagination from '../components/Pagination';
import { useSearchFilter } from '../hooks/useSearchFilter';
import AIStatsPanel from '../components/AIStatsPanel';
import QuickPaymentPanel from '../components/QuickPaymentPanel';
import WhatsAppStatus from '../components/WhatsAppStatus';
import AuditLog from '../components/AuditLog';
import exportCSV from '../utils/exportCSV';

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

// ── StatCard ──────────────────────────────────────────────────
function StatCard({ label, value, color, sub, icon }) {
  return (
    <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '14px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
        {icon && <span style={{ fontSize: '16px', opacity: 0.6 }}>{icon}</span>}
      </div>
      <p style={{ fontSize: '32px', fontWeight: '800', color: color || c.text, lineHeight: 1, marginBottom: sub ? '4px' : 0, fontFamily: "'Fraunces', serif" }}>{value ?? '—'}</p>
      {sub && <p style={{ color: c.muted, fontSize: '12px' }}>{sub}</p>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const { user, isSuperAdmin, isEBAgent, signOut } = useAuth();

  // ── React Query data ──────────────────────────────────────
  const overview     = useOverview().data;
  const activeLeads  = useActiveLeads().data || [];
  const qualifiedLeads = useQualifiedLeads().data || [];
  const rejectedLeads  = useRejectedLeads().data || [];
  const stages       = useStages().data || [];
  const viewings     = useViewings().data || [];
  const messages     = useMessages().data || [];
  const alerts       = useAlerts().data || [];
  const tenants      = useTenants().data || [];
  const tenantStats  = useTenantStats().data;
  const allUsers     = useUsers().data || [];
  const pendingUsers = usePendingUsers().data || [];
  const agents       = useAgents().data || [];
  const health       = useHealth().data;
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

  // ── Pagination & Search ───────────────────────────────────
  const [activePage,  setActivePage]  = useState(1);
  const [clientsPage, setClientsPage] = useState(1);
  const [usersPage,   setUsersPage]   = useState(1);
  const ITEMS_PER_PAGE = 10;

  const clientsFilter = useSearchFilter(tenants, {
    searchFields: ['businessName', 'contactEmail', 'whatsappNumber'],
  });

  const usersFilter = useSearchFilter(allUsers, {
    searchFields: ['fullName', 'email', 'phone'],
  });

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
  const handleDeleteClient = async (tenant) => {
    if (!confirm('Delete ' + tenant.businessName + '?')) return;
    try { await api.delete('/tenants/' + tenant._id); refetch(); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };
  const handleRejectUser = async (u) => {
    if (!confirm('Reject ' + u.fullName + '?')) return;
    try { await api.post('/users/' + u._id + '/reject', { reason: 'Application rejected' }); refetch(); }
    catch { alert('Failed to reject user'); }
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
    s.push({ id: 'prospecting', icon: '📤', label: 'Prospecting', badge: 0 });
    if (isEBAgent)  { s.push({ id: 'agentstats', icon: '📊', label: 'My Stats', badge: 0 }); }
    if (!isEBAgent) { s.push({ id: 'ebteam',     icon: '👔', label: 'EB Team',   badge: 0 }); }
    if (!isEBAgent) { s.push({ id: 'users',      icon: '👤', label: 'Users',     badge: pendingUsers.length }); }
    if (isSuperAdmin) { s.push({ id: 'platform', icon: '⚙️', label: 'Platform', badge: 0 }); }
    return s;
  }, [isEBAgent, isSuperAdmin, alerts.length, pendingUsers.length]);

  const opsTabs = ['overview', 'active', 'qualified', 'rejected', 'funnel', 'viewings', 'messages', 'alerts'];

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
      <div className="main-content" style={{ marginLeft: sidebarOpen ? 220 : 64, flex: 1, padding: '32px', paddingTop: 96, transition: 'margin-left 0.2s ease', minHeight: '100vh' }}>

        {/* ════════ OPERATIONS ════════ */}
        {section === 'operations' && (
          <SectionErrorBoundary name="Operations" onRetry={refetch}>
            <div>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: 4 }}>Operations</h1>
                <p style={{ color: c.muted, fontSize: 15 }}>Real-time WhatsApp pipeline across all agencies</p>
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid ' + c.borderDim, overflowX: 'auto' }}>
                {opsTabs.map(t => (
                  <button key={t} onClick={() => { setOpsTab(t); setActivePage(1); }} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: opsTab === t ? '2px solid ' + c.lime : '2px solid transparent', color: opsTab === t ? c.lime : c.muted, cursor: 'pointer', fontSize: 13, fontWeight: opsTab === t ? 600 : 400, textTransform: 'capitalize', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
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

              {opsTab === 'active' && (
                <SectionErrorBoundary name="Active Conversations" onRetry={refetch}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Active Conversations ({activeLeads.length})</h2>
                    {activeLeads.length === 0 ? <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}><p style={{ fontSize: 40, marginBottom: 16 }}>💬</p><p>No active conversations.</p></div>
                      : <>
                        {activeLeads.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE).map(lead => (
                        <div key={lead._id} onClick={() => setLeadDetailId(lead._id)} className="card-hover" style={{ background: c.card, border: '1px solid ' + (lead.isProspect ? c.lime + '44' : c.borderDim), borderRadius: 14, padding: '16px 20px', marginBottom: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                              <strong>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                              {lead.isProspect && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: c.lime + '22', color: c.lime, fontWeight: 700 }}>🎯 {lead.prospectOutcome?.replace(/_/g, ' ') || 'Prospect'}</span>}
                            </div>
                            <p style={{ color: c.muted, fontSize: 13, marginTop: 2 }}>{lead.phone}</p>
                            <p style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>Stage: <span style={{ color: lead.isProspect ? c.lime : c.cyan }}>{lead.isProspect ? '👤 Agent takeover' : lead.workflowStatus?.replace(/_/g, ' ')}</span></p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: lead.isProspect ? c.lime + '18' : c.cyan + '18', color: lead.isProspect ? c.lime : c.cyan }}>{lead.isProspect ? 'Prospect' : 'Active'}</span>
                            {lead.takenOver
                              ? <button onClick={(e) => handleResume(e, lead._id)} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: c.cyan + '22', color: c.cyan, border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>🤖 Resume bot</button>
                              : <button onClick={(e) => handleTakeover(e, lead._id)} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, background: c.lime, color: '#06080A', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>✋ Take over</button>}
                          </div>
                        </div>
                      ))}
                      <Pagination
                        currentPage={activePage}
                        totalPages={Math.ceil(activeLeads.length / ITEMS_PER_PAGE)}
                        onPageChange={setActivePage}
                        showInfo
                        totalItems={activeLeads.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                      />
                    </>}
                  </div>
                </SectionErrorBoundary>
              )}

              {opsTab === 'qualified' && (
                <SectionErrorBoundary name="Qualified Leads" onRetry={refetch}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Qualified Leads ({qualifiedLeads.length})</h2>
                    {qualifiedLeads.length === 0 ? <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}><p style={{ fontSize: 40, marginBottom: 16 }}>✅</p><p>No qualified leads yet.</p></div>
                      : qualifiedLeads.map(lead => {
                        const tenant = tenants.find(t => t._id === lead.tenantId);
                        const industry = tenant?.industry || 'appointment';
                        const labels = {
                          rental_agency: { f1: 'Property', f2: 'R' + (lead.monthlyBudget || '?') + '/mo', f3: 'Move-in' },
                          property_sales: { f1: 'Property', f2: 'R' + (lead.monthlyBudget || '?'), f3: 'Timeline' },
                          car_dealership: { f1: 'Vehicle', f2: 'R' + (lead.monthlyBudget || '?'), f3: 'Timeline' },
                          law_firm: { f1: 'Matter', f2: 'Urgency: ' + (lead.monthlyBudget || '?'), f3: 'Prior consult' },
                          medical: { f1: 'Appointment', f2: lead.monthlyBudget || '?', f3: 'Preferred date' },
                          recruitment: { f1: 'Role', f2: 'R' + (lead.monthlyBudget || '?') + '/mo', f3: 'Available' },
                          education: { f1: 'Programme', f2: lead.monthlyBudget || '?', f3: 'Funding' },
                          order_taking: { f1: 'Order', f2: 'Qty: ' + (lead.monthlyBudget || '?'), f3: 'Delivery' },
                          appointment: { f1: 'Service', f2: lead.monthlyBudget || '?', f3: 'Date' },
                          driving_school: { f1: 'Lessons', f2: lead.monthlyBudget || '?', f3: 'Start' },
                          salon: { f1: 'Service', f2: lead.monthlyBudget || '?', f3: 'When' },
                          custom: { f1: 'Enquiry', f2: lead.monthlyBudget || '?', f3: 'Detail' },
                        }[industry] || { f1: 'Enquiry', f2: lead.monthlyBudget || '?', f3: 'Detail' };
                        return (
                          <div key={lead._id} onClick={() => setLeadDetailId(lead._id)} className="card-hover" style={{ background: c.card, border: '1px solid ' + (lead.aiSummary?.urgency === 'high' ? c.lime + '44' : c.borderDim), borderRadius: 14, padding: '18px 24px', marginBottom: 10, cursor: 'pointer' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: 16 }}>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                                {lead.aiSummary?.score && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, fontWeight: 700, background: lead.aiSummary.score >= 8 ? c.lime + '22' : c.amber + '22', color: lead.aiSummary.score >= 8 ? c.lime : c.amber }}>🤖 {lead.aiSummary.score}/10 · {lead.aiSummary.scoreLabel}</span>}
                              </div>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                                {lead.propertyInterest && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: c.cyan + '22', color: c.cyan }}>{labels.f1}: {lead.propertyInterest}</span>}
                                {lead.monthlyBudget && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: c.lime + '22', color: c.lime }}>{labels.f2}</span>}
                                {lead.moveInDate && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: c.amber + '22', color: c.amber }}>{labels.f3}: {lead.moveInDate}</span>}
                              </div>
                              {lead.aiSummary?.summary && (
                                <div style={{ marginTop: 10, background: 'rgba(184,240,64,0.04)', border: '1px solid ' + c.border, borderRadius: 10, padding: '10px 12px' }}>
                                  <p style={{ color: c.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>🤖 AI Analysis</p>
                                  <p style={{ color: c.text, fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>{lead.aiSummary.summary}</p>
                                  {lead.aiSummary.recommendedAction && <p style={{ color: c.lime, fontSize: 12, fontWeight: 600 }}>→ {lead.aiSummary.recommendedAction}</p>}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </SectionErrorBoundary>
              )}

              {opsTab === 'rejected' && (
                <SectionErrorBoundary name="Rejected Leads" onRetry={refetch}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Rejected Leads ({rejectedLeads.length})</h2>
                    {rejectedLeads.length === 0 ? <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}><p style={{ fontSize: 40, marginBottom: 16 }}>❌</p><p>No rejected leads.</p></div>
                      : rejectedLeads.map(lead => (
                        <div key={lead._id} onClick={() => setLeadDetailId(lead._id)} className="card-hover" style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '14px 18px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div><strong>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong><p style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{lead.rejectionReason || 'Did not qualify'}</p></div>
                          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: c.red + '18', color: c.red }}>Rejected</span>
                        </div>
                      ))}
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
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Recent Messages</h2>
                    {messages.map((msg, i) => (
                      <div key={i} onClick={() => setLeadDetailId(msg.leadId)} className="card-hover" style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '12px 16px', marginBottom: 8, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: msg.direction === 'inbound' ? c.cyan + '22' : c.lime + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{msg.direction === 'inbound' ? '📱' : '🤖'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <strong style={{ fontSize: 13 }}>{msg.name !== 'Unknown' ? msg.name : msg.phone}</strong>
                            <span style={{ fontSize: 11, color: c.muted }}>{new Date(msg.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p style={{ color: c.muted, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.body}</p>
                        </div>
                      </div>
                    ))}
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
                          : <select defaultValue={u.role} onChange={async (e) => { try { await api.patch('/users/' + u._id + '/role', { role: e.target.value }); refetch(); } catch (err) { alert(err.response?.data?.message || 'Failed'); e.target.value = u.role; } }} style={{ padding: '4px 8px', background: c.cyan + '18', border: '1px solid ' + c.cyan + '33', color: c.cyan, borderRadius: 8, fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                            <option value="borrower">borrower</option><option value="agent">agent</option><option value="admin">admin</option><option value="eb_agent">eb_agent</option><option value="eb_manager">eb_manager</option>{isSuperAdmin && <option value="super_admin">super_admin</option>}
                          </select>}
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
              <AIStatsPanel />
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