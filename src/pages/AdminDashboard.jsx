// src/pages/AdminDashboard.jsx
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../context/auth';
import SuperAdminPanel from '../components/SuperAdminPanel';
import LeadDetailModal from '../components/LeadDetailModal';
import AssignModal from '../components/AssignModal';
import AdminApproveModal from '../components/AdminApproveModal';
import AdminClientModal from '../components/AdminClientModal';
import useMediaQuery, { MOBILE_QUERY } from '../hooks/useMediaQuery';
import ChatTab from '../components/ChatTab';
import DeliveryTab from '../components/DeliveryTab';
import Button from '../components/ui/Button';
import { getStoredUser, ADMIN_DASHBOARD_KEY, NO_DATA, loadAdminData } from '../components/admin/adminData';
import ChangePasswordModal from '../components/admin/ChangePasswordModal';
import InviteLinkModal from '../components/admin/InviteLinkModal';
import StatsStrip from '../components/admin/StatsStrip';
import OverviewTab from '../components/admin/OverviewTab';
import LeadsTab from '../components/admin/LeadsTab';
import FunnelTab from '../components/admin/FunnelTab';
import ViewingsTab from '../components/admin/ViewingsTab';
import MessagesTab from '../components/admin/MessagesTab';
import AlertsTab from '../components/admin/AlertsTab';
import ClientsTab from '../components/admin/ClientsTab';
import UsersTab from '../components/admin/UsersTab';

// The pieces live in ../components/admin/: the data loader (adminData.js),
// the two modals, the stats strip and one file per tab.

// ── Main Admin Dashboard ──────────────────────────────────────
export default function AdminDashboard() {
  const [assignModal,         setAssignModal]         = useState(null);
  const [clientModal,         setClientModal]         = useState(null);
  const [approveModal,        setApproveModal]        = useState(null);
  const [leadDetailId,        setLeadDetailId]        = useState(null);
  const [inviteModal,         setInviteModal]         = useState(null);
  const [inviteUrl,           setInviteUrl]           = useState('');
  const [showPasswordModal,   setShowPasswordModal]   = useState(false);
  const [tab, setTab] = useState('overview');
  const isMobile = useMediaQuery(MOBILE_QUERY);
  // Which lead column is showing on a phone — the board is one-at-a-time there.
  const [mobileCol, setMobileCol] = useState('active');

  const { signOut } = useAuth();
  const currentUser = getStoredUser();
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isAdmin      = currentUser.role === 'admin';
  const userTenantId = currentUser.tenantId || null;

  const [clientSearch,        setClientSearch]        = useState('');
  const [clientFilter,        setClientFilter]        = useState('all');

  const qc = useQueryClient();
  const dash = useQuery({ queryKey: ADMIN_DASHBOARD_KEY, queryFn: loadAdminData });
  const {
    overview, activeConversations, qualifiedLeads, rejectedLeads, closedLeads,
    alerts, agents, clients, clientStats, pendingUsers, allUsers, tenants,
    stages, recentMessages, viewingRequests, panelError,
  } = dash.data ?? NO_DATA;
  const loading = dash.isPending;
  // Only when there is nothing to show. A refetch that fails keeps the last
  // good panels on screen; the query still holds them, so nothing is blanked.
  const error = dash.isError && !dash.data ? dash.error.message : '';
  // Every caller that used to re-run the mount effect's loader still calls
  // this, so "reload everything after a change" behaves as it always did.
  const loadData = () => dash.refetch();

  // Whether this tenant runs deliveries at all. Most do not, and a tab
  // that opens on 'nothing here' for every other client is clutter, so the
  // button only exists when there is something behind it. Its own query and
  // never surfaced as an error: a tenant with no delivery service is the
  // normal case, and the only consequence of this failing is one tab not
  // appearing.
  const { data: hasDelivery = false } = useQuery({
    queryKey: ['delivery-enabled'],
    queryFn: () => api.get('/delivery/overview').then((r) => !!(r.data?.data ?? r.data)?.enabled),
  });

  // The edits below change the cached lists in place, as the old local state
  // did, instead of refetching fourteen endpoints to show one change.
  const patch = (field, update) =>
    qc.setQueryData(ADMIN_DASHBOARD_KEY, (prev) => (prev ? { ...prev, [field]: update(prev[field]) } : prev));

  const handleClientSave = (tenant) => {
    patch('clients', prev => {
      const exists = prev.find(c => c._id === tenant._id);
      return exists ? prev.map(c => c._id === tenant._id ? tenant : c) : [tenant, ...prev];
    });
    setClientModal(null);
  };

  // Closes, never erases (2026-10-08): the API keeps the account and needs
  // the business name typed back. See SuperAdminDashboard's handleCloseClient.
  const handleDeleteClient = async (client) => {
    const typed = window.prompt(
      `Close ${client.businessName}'s account? Their customers get no reply and they are not billed; everything is kept.\n\nType the business name to confirm:`
    );
    if (typed == null) return;
    try {
      const res = await api.delete(`/tenants/${client._id}`, { data: { confirmName: typed } });
      patch('clients', prev => prev.map(c => c._id === client._id ? { ...c, status: 'cancelled' } : c));
      window.alert(res.data?.message || 'Closed.');
    } catch (err) {
      window.alert(err.response?.data?.message || 'Could not close the account. Nothing was changed.');
    }
  };

  const handleRejectUser = async (user) => {
    if (!window.confirm(`Reject ${user.fullName}? Their account will be deactivated.`)) return;
    await api.post(`/users/${user._id}/reject`, { reason: 'Application rejected by admin' });
    patch('pendingUsers', prev => prev.filter(u => u._id !== user._id));
  };

  const handleReopen = async (e, leadId) => {
    e.stopPropagation();
    try {
      await api.post(`/admin-ops/leads/${leadId}/reopen`);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Reopen failed');
    }
  };

  const filteredClients = clients.filter(c => {
    const ms = !clientSearch || c.businessName?.toLowerCase().includes(clientSearch.toLowerCase()) || c.contactEmail?.toLowerCase().includes(clientSearch.toLowerCase());
    const mf = clientFilter === 'all' || c.status === clientFilter;
    return ms && mf;
  });

  if (loading) return <div className="p-[140px] text-center text-muted">Loading Admin Operations Center...</div>;
  if (error)   return <div className="p-[140px] text-red">{error}</div>;

  const tabs = [
    'chat', 'overview', 'leads',
    'funnel', 'viewings', 'messages', 'alerts',
    ...(hasDelivery ? ['delivery'] : []),
    ...(isSuperAdmin ? ['clients', 'users', 'platform'] : []),
    ...(isAdmin ? ['users'] : []),
  ];

  const leadColumns = [
    { key: 'active',    label: 'Active',    icon: '💬', items: activeConversations },
    { key: 'qualified', label: 'Qualified', icon: '✅', items: qualifiedLeads },
    { key: 'rejected',  label: 'Rejected',  icon: '❌', items: rejectedLeads },
    { key: 'closed',    label: 'Closed',    icon: '🔒', items: closedLeads },
  ];

  return (
    <div className="min-h-screen bg-[#050505] px-[clamp(16px,4vw,40px)] pt-[clamp(80px,10vw,100px)] pb-10 text-ink">
      <style>{`.leads-board-scroll::-webkit-scrollbar{height:10px}.leads-board-scroll::-webkit-scrollbar-track{background:var(--color-edge);border-radius:999px}.leads-board-scroll::-webkit-scrollbar-thumb{background:var(--color-lime);border-radius:999px}`}</style>
      <div className={`mx-auto max-w-[1400px] ${isMobile ? 'px-3' : ''}`}>

        {panelError && (
          <div className="mb-6 rounded-lg border border-amber px-4 py-3 text-sm text-amber">
            ⚠️ Some panels could not load: {panelError}
          </div>
        )}

        {/* Title and account controls share a row and wrap on a phone, so the
            way OUT is visible on the first screen instead of below the fold.
            There is no nav bar on this route (ConditionalNav renders <Nav/> on
            public routes only), so these buttons are the only ones. */}
        <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="mb-2 text-[clamp(24px,5vw,48px)] font-black">
              {isSuperAdmin ? 'Admin Control Center' : 'Operations Dashboard'}
            </h1>
            <p className="text-[clamp(14px,2.5vw,20px)] text-muted">
              {isSuperAdmin ? 'Real-time Platform Operations & Oversight' : 'Your agency\'s live WhatsApp pipeline'}
            </p>
            {currentUser.email && (
              <p className="mt-1.5 text-[13px] text-muted">
                Signed in as {currentUser.email}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
              🔑 Change password
            </Button>
            <Button variant="ghost" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>

        {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}

        {/* Stats */}
        {overview && (
          <StatsStrip overview={overview} clients={clients} clientStats={clientStats} pendingUsers={pendingUsers} isSuperAdmin={isSuperAdmin} />
        )}

        {/* Tabs */}
        <div className="mb-7 flex gap-0.5 overflow-x-auto border-b border-edge">
          {tabs.map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`-mb-px min-h-[44px] cursor-pointer whitespace-nowrap border-b-2 bg-transparent px-4 text-[13px] capitalize ${
                tab === t ? 'border-lime font-semibold text-lime' : 'border-transparent text-muted hover:text-ink'
              }`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'alerts' && alerts.length > 0 && <span className="ml-[5px] rounded-full bg-red px-[5px] py-px font-mono text-[10px] text-white">{alerts.length}</span>}
              {t === 'users'  && pendingUsers.length > 0 && <span className="ml-[5px] rounded-full bg-amber px-[5px] py-px font-mono text-[10px] text-[#050505]">{pendingUsers.length}</span>}
            </button>
          ))}
        </div>

        {/* ── Overview ───────────────────────────────────────── */}
        {tab === 'overview' && <OverviewTab activeConversations={activeConversations} />}

        {/* ── Leads CRM board ───────────────────────────────────── */}
        {/* Replaces the old separate active/qualified/rejected tabs
            with status columns side by side, plus a Closed column
            that didn't exist anywhere in this dashboard before —
            closed leads were previously unreachable and unreopenable
            from here. */}
        {tab === 'delivery' && <DeliveryTab />}

        {tab === 'chat' && (
          <ChatTab conversations={activeConversations} onRefresh={loadData} onExit={() => setTab('overview')} />
        )}

        {tab === 'leads' && (
          <LeadsTab
            isMobile={isMobile} leadColumns={leadColumns} mobileCol={mobileCol} setMobileCol={setMobileCol}
            setLeadDetailId={setLeadDetailId} setAssignModal={setAssignModal} handleReopen={handleReopen}
          />
        )}

        {/* ── Stage Funnel ───────────────────────────────────── */}
        {tab === 'funnel' && <FunnelTab stages={stages} />}

        {/* ── Viewings ───────────────────────────────────────── */}
        {tab === 'viewings' && <ViewingsTab viewingRequests={viewingRequests} setLeadDetailId={setLeadDetailId} />}

        {/* ── Recent Messages ────────────────────────────────── */}
        {tab === 'messages' && <MessagesTab recentMessages={recentMessages} setLeadDetailId={setLeadDetailId} />}

        {/* ── Alerts ─────────────────────────────────────────── */}
        {tab === 'alerts' && <AlertsTab alerts={alerts} />}

        {/* ── Clients ────────────────────────────────────────── */}
        {tab === 'clients' && isSuperAdmin && (
          <ClientsTab
            clients={clients} clientStats={clientStats} filteredClients={filteredClients}
            clientSearch={clientSearch} setClientSearch={setClientSearch} clientFilter={clientFilter} setClientFilter={setClientFilter}
            setClientModal={setClientModal} setInviteUrl={setInviteUrl} setInviteModal={setInviteModal}
            loadData={loadData} handleDeleteClient={handleDeleteClient}
          />
        )}

        {/* ── Users ──────────────────────────────────────────── */}
        {tab === 'users' && (
          <UsersTab
            pendingUsers={pendingUsers} allUsers={allUsers} isSuperAdmin={isSuperAdmin} userTenantId={userTenantId}
            currentUser={currentUser} setApproveModal={setApproveModal} handleRejectUser={handleRejectUser} loadData={loadData}
          />
        )}

        {/* ── Platform — super_admin only ─────────────────────── */}
        {tab === 'platform' && isSuperAdmin && <SuperAdminPanel />}

      </div>

      {assignModal  && <AssignModal  lead={assignModal}   agents={agents}   onClose={() => setAssignModal(null)}  onAssigned={() => { setAssignModal(null);  loadData(); }} />}
      {clientModal  && <AdminClientModal  client={clientModal._id ? clientModal : null} onClose={() => setClientModal(null)}  onSave={handleClientSave} />}
      {approveModal && <AdminApproveModal user={approveModal}  tenants={tenants} onClose={() => setApproveModal(null)} onApproved={() => { setApproveModal(null); loadData(); }} />}
      {leadDetailId && <LeadDetailModal leadId={leadDetailId} onClose={() => setLeadDetailId(null)} onUpdate={loadData} />}

      {/* Invite Link Modal */}
      {inviteModal && <InviteLinkModal client={inviteModal} inviteUrl={inviteUrl} onClose={() => setInviteModal(null)} />}
    </div>
  );
}
