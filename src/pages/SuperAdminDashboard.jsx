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
import OperationsSection from '../sections/OperationsSection';
import DeliveryTab from '../components/DeliveryTab';
import SectionErrorBoundary from '../components/SectionErrorBoundary';
import { useAuth } from '../context/auth';
import {
  useOverview, useAllLeads, useActiveLeads, useAlerts,
  useTenants, useTenantStats, useUsers, usePendingUsers,
  useHealth, useRefetchAll, useFlowTemplates,
  getStoredScope, setStoredScope,
} from '../hooks/useDashboardData';
import ProspectingPanel from '../components/ProspectingPanel';
import AgentStatsPanel from '../components/AgentStatsPanel';
import EBTeamPanel from '../components/EBTeamPanel';
import ClientModal from '../components/ClientModal';
import ApproveModal from '../components/ApproveModal';
import BulkClientActions from '../components/BulkClientActions';
import { useSearchFilter } from '../hooks/useSearchFilter';
// FIX: PACMembersPanel existed but was never imported.
import PACMembersPanel from '../components/PACMembersPanel';
import AutomationPanel from '../components/AutomationPanel';
import BillingPanel from '../components/BillingPanel';
import SystemHealthPanel from '../components/SystemHealthPanel';
import RentalsPanel from '../components/RentalsPanel';
import { useRentalListings } from '../hooks/useRentalsModeration';
import { useBillingActions, billingErrorMessage } from '../hooks/useClientBilling';
import { c } from '../components/superadmin/tokens';
import Sidebar from '../components/superadmin/Sidebar';
import MobileNav from '../components/superadmin/MobileNav';
import ClientsSection from '../components/superadmin/ClientsSection';
import UsersSection from '../components/superadmin/UsersSection';
import PlatformSection from '../components/superadmin/PlatformSection';
import InviteModal from '../components/superadmin/InviteModal';

// The colours, the navigation and the larger sections live in
// ../components/superadmin/.

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
  // Operations owns its own queries now (sections/OperationsSection.jsx).
  // These two stay because the page-level loading gate below reads them —
  // React Query dedupes by key, so the section asking for the same data does
  // NOT issue a second request.
  const overview     = useOverview(opsScope).data;
  const activeLeads  = useActiveLeads(opsScope).data?.leads || [];
  const allLeads     = useAllLeads().data || [];
  // The sidebar shows an unread-alerts badge, so the page needs this too.
  // Same key as the section's own useAlerts — React Query serves both from
  // one request.
  const alerts       = useAlerts(opsScope).data || [];
  const tenants      = useTenants().data || [];
  const tenantStats  = useTenantStats().data;
  const allUsers     = useUsers().data || [];
  const pendingUsers = usePendingUsers().data || [];
  const health       = useHealth().data;
  const flowTemplates = useFlowTemplates().data || [];
  const refetch      = useRefetchAll();
  // EasyRentals listings waiting for a person to approve them: the sidebar
  // badge. The API allows super_admin and eb_manager only, so nobody else asks.
  const isRentalsStaff = isSuperAdmin || user?.role === 'eb_manager';
  const rentalsWaiting = useRentalListings('pending_review', { enabled: isRentalsStaff }).data?.length || 0;

  const isLoading = !isEBAgent && (!overview && !tenants.length && !activeLeads.length);

  // ── Local UI state ─────────────────────────────────────────
  const [section, setSection] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('eb_user') || '{}');
      return u.role === 'eb_agent' ? 'prospecting' : 'operations';
    } catch { return 'operations'; }
  });
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



  // ── Mutations ──────────────────────────────────────────────
  // Suspend, activate and close go through the Billing endpoints
  // (2026-10-08), the same ones the Billing tab uses. Until then Suspend here
  // was one click with no question, though it silences that client's
  // customers, and Delete erased the client behind one OK.
  const billing = useBillingActions();
  const showResult = (r) => { refetch(); alert(r.consequence); };
  const failed = (err) => alert(billingErrorMessage(err));
  const handleSuspend = async (tenant) => {
    const reason = window.prompt(`Why is ${tenant.businessName} being suspended? Their customers will get no reply while suspended.`);
    if (!reason || !reason.trim()) return;
    try { showResult(await billing.suspend(tenant._id, reason.trim())); } catch (err) { failed(err); }
  };
  const handleActivate = async (tenant) => {
    const what = tenant.status === 'cancelled' ? 'Reopen' : 'Switch back on';
    if (!window.confirm(`${what} ${tenant.businessName}? Their assistant answers their customers from the next message.`)) return;
    try { showResult(await billing.reactivate(tenant._id)); } catch (err) { failed(err); }
  };
  const handleCloseClient = async (tenant) => {
    const typed = window.prompt(
      `Close ${tenant.businessName}'s account?\n\n` +
      `Their customers get no reply and they are not billed. Their leads, messages and invoices are kept, and Activate reopens it.\n\n` +
      `Type the business name to confirm:`
    );
    if (typed == null) return;
    try { showResult(await billing.close(tenant._id, typed)); } catch (err) { failed(err); }
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
    // No separate Chat item since 2026-10-21: talking to customers is the
    // WhatsApp API page's Inbox (components/inbox/), which lists every
    // conversation rather than "active" ones and keeps an open one fresh.
    // Chat was added here on 2026-08-17 because the owner could not find it;
    // the Inbox tab is where it went, not away.
    // Delivery here as well as on AdminDashboard, for the reason Chat was
    // once added here: super_admin routes to THIS page. It shipped on
    // AdminDashboard alone on 2026-09-30 and the owner could not find it,
    // which is the same mistake twice in the same file.
    if (!isEBAgent) { s.push({ id: 'delivery', icon: '🛵', label: 'Delivery', badge: 0 }); }
    // EasyRentals moderation (2026-10-06). Every listing needs a person to
    // approve it, so the badge is the number waiting.
    if (isRentalsStaff) { s.push({ id: 'rentals', icon: '🏘️', label: 'Rentals', badge: rentalsWaiting }); }
    if (!isEBAgent) { s.push({ id: 'operations', icon: '🏠', label: 'WhatsApp API', badge: alerts.length }); }
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
    // Billing the platform's clients. The API allows super_admin and
    // eb_manager (a client's own `admin` is refused), so the tab matches.
    if (isSuperAdmin || user?.role === 'eb_manager') { s.push({ id: 'billing', icon: '🧾', label: 'Billing', badge: 0 }); }
    if (isSuperAdmin || user?.role === 'eb_manager') { s.push({ id: 'health', icon: '🩺', label: 'Health', badge: 0 }); }
    if (isSuperAdmin) { s.push({ id: 'platform', icon: '⚙️', label: 'Platform', badge: 0 }); }
    return s;
  }, [isEBAgent, isSuperAdmin, user?.role, alerts.length, pendingUsers.length, isRentalsStaff, rentalsWaiting]);


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

      <MobileNav
        navSections={navSections} section={section} setSection={setSection} user={user} signOut={signOut}
        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}
      />

      <Sidebar
        navSections={navSections} section={section} setSection={setSection} user={user} signOut={signOut}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <div className="main-content" style={{ marginLeft: sidebarOpen ? 220 : 64, flex: 1, minWidth: 0, padding: '32px', paddingTop: 96, transition: 'margin-left 0.2s ease', minHeight: '100vh' }}>

        {/* ════════ DELIVERY ════════ */}
        {section === 'delivery' && <DeliveryTab />}

        {/* ════════ RENTALS ════════ */}
        {section === 'rentals' && isRentalsStaff && (
          <SectionErrorBoundary name="Rentals" onRetry={refetch}>
            <RentalsPanel />
          </SectionErrorBoundary>
        )}


        {/* ════════ OPERATIONS ════════ */}
        {section === 'operations' && (
          <OperationsSection
            opsScope={opsScope}
            changeScope={changeScope}
            tenants={tenants}
            tenantStats={tenantStats}
            allLeads={allLeads}
            isSuperAdmin={isSuperAdmin}
            setLeadDetailId={setLeadDetailId}
            colors={c}
          />
        )}

        {/* ════════ CLIENTS ════════ */}
        {section === 'clients' && (
          <SectionErrorBoundary name="Clients" onRetry={refetch}>
            <ClientsSection
              selectedClientIds={selectedClientIds} setSelectedClientIds={setSelectedClientIds} setBulkModal={setBulkModal}
              clientsFilter={clientsFilter} clientsPage={clientsPage} setClientsPage={setClientsPage} ITEMS_PER_PAGE={ITEMS_PER_PAGE}
              setClientModal={setClientModal} tenantStats={tenantStats} handleActivate={handleActivate} handleSuspend={handleSuspend}
              generateInvite={generateInvite} handleCloseClient={handleCloseClient} isSuperAdmin={isSuperAdmin}
              flowTemplates={flowTemplates} flowChoice={flowChoice} setFlowChoice={setFlowChoice} handleAllocateFlow={handleAllocateFlow}
            />
          </SectionErrorBoundary>
        )}

        {/* ════════ SYSTEM HEALTH ════════ */}
        {section === 'health' && (isSuperAdmin || user?.role === 'eb_manager') && (
          <SectionErrorBoundary name="System health" onRetry={refetch}>
            <SystemHealthPanel />
          </SectionErrorBoundary>
        )}

        {/* ════════ BILLING ════════ */}
        {section === 'billing' && (isSuperAdmin || user?.role === 'eb_manager') && (
          <SectionErrorBoundary name="Billing" onRetry={refetch}>
            <BillingPanel />
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
            <EBTeamPanel isSuperAdmin={isSuperAdmin} />
          </SectionErrorBoundary>
        )}

        {/* ════════ USERS ════════ */}
        {section === 'users' && (
          <SectionErrorBoundary name="Users" onRetry={refetch}>
            <UsersSection
              usersFilter={usersFilter} usersPage={usersPage} setUsersPage={setUsersPage} ITEMS_PER_PAGE={ITEMS_PER_PAGE}
              pendingUsers={pendingUsers} setApproveModal={setApproveModal} handleRejectUser={handleRejectUser}
              handleDeleteUser={handleDeleteUser} user={user} isSuperAdmin={isSuperAdmin} refetch={refetch}
            />
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
            <PlatformSection health={health} tenantStats={tenantStats} />
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
      {inviteModal && <InviteModal client={inviteModal} inviteUrl={inviteUrl} onClose={() => setInviteModal(null)} />}
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
