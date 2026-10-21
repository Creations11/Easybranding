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
import { colors } from '../utils/theme';
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

  if (loading) return <div style={{ padding: '140px', textAlign: 'center', color: colors.muted }}>Loading Admin Operations Center...</div>;
  if (error)   return <div style={{ padding: '140px', color: colors.red }}>{error}</div>;

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
    <div style={{ minHeight: '100vh', background: '#050505', color: colors.text, padding: 'clamp(80px, 10vw, 100px) clamp(16px, 4vw, 40px) 40px' }}>
      <style>{`.leads-board-scroll::-webkit-scrollbar{height:10px}.leads-board-scroll::-webkit-scrollbar-track{background:${colors.borderDim};border-radius:999px}.leads-board-scroll::-webkit-scrollbar-thumb{background:${colors.lime};border-radius:999px}`}</style>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>

        {panelError && (
          <div style={{
            marginBottom: '24px', padding: '12px 16px', borderRadius: '8px',
            border: `1px solid ${colors.amber}`, color: colors.amber, fontSize: '14px',
          }}>
            ⚠️ Some panels could not load: {panelError}
          </div>
        )}

        {/* Title and account controls share a row and wrap on a phone, so the
            way OUT is visible on the first screen instead of below the fold.
            There is no nav bar on this route (ConditionalNav renders <Nav/> on
            public routes only), so these buttons are the only ones. */}
        <div style={{
          marginBottom: '40px', display: 'flex', flexWrap: 'wrap', gap: '16px',
          alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 'clamp(24px, 5vw, 48px)', fontWeight: '900', marginBottom: '8px' }}>
              {isSuperAdmin ? 'Admin Control Center' : 'Operations Dashboard'}
            </h1>
            <p style={{ color: colors.muted, fontSize: 'clamp(14px, 2.5vw, 20px)' }}>
              {isSuperAdmin ? 'Real-time Platform Operations & Oversight' : 'Your agency\'s live WhatsApp pipeline'}
            </p>
            {currentUser.email && (
              <p style={{ color: colors.muted, fontSize: '13px', marginTop: '6px' }}>
                Signed in as {currentUser.email}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowPasswordModal(true)}
              style={{
                padding: '10px 16px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid ' + colors.borderDim, color: colors.text,
                borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit',
              }}
            >
              🔑 Change password
            </button>
            <button
              onClick={signOut}
              style={{
                padding: '10px 16px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid ' + colors.borderDim, color: colors.muted,
                borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit',
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}

        {/* Stats */}
        {overview && (
          <StatsStrip overview={overview} clients={clients} clientStats={clientStats} pendingUsers={pendingUsers} isSuperAdmin={isSuperAdmin} />
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', marginBottom: '28px', borderBottom: `1px solid ${colors.borderDim}`, overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '12px 16px', background: 'none', border: 'none',
              borderBottom: tab === t ? `2px solid ${colors.lime}` : '2px solid transparent',
              color: tab === t ? colors.lime : colors.muted,
              cursor: 'pointer', fontSize: '13px', fontWeight: tab === t ? '600' : '400',
              textTransform: 'capitalize', marginBottom: '-1px', whiteSpace: 'nowrap',
            }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'alerts' && alerts.length > 0 && <span style={{ marginLeft: '5px', background: colors.red, color: '#fff', fontSize: '10px', padding: '1px 5px', borderRadius: '999px' }}>{alerts.length}</span>}
              {t === 'users'  && pendingUsers.length > 0 && <span style={{ marginLeft: '5px', background: colors.amber, color: '#050505', fontSize: '10px', padding: '1px 5px', borderRadius: '999px' }}>{pendingUsers.length}</span>}
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
