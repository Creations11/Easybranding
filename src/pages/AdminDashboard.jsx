// src/pages/AdminDashboard.jsx
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../context/auth';
import LeadDetailModal from '../components/LeadDetailModal';
import AssignModal from '../components/AssignModal';
import AdminApproveModal from '../components/AdminApproveModal';
import useMediaQuery, { MOBILE_QUERY } from '../hooks/useMediaQuery';
import InboxView from '../components/inbox/InboxView';
import DeliveryTab from '../components/DeliveryTab';
import Button from '../components/ui/Button';
import { getStoredUser, ADMIN_DASHBOARD_KEY, NO_DATA, loadAdminData } from '../components/admin/adminData';
import ChangePasswordModal from '../components/admin/ChangePasswordModal';
import StatsStrip from '../components/admin/StatsStrip';
import OverviewTab from '../components/admin/OverviewTab';
import LeadsTab from '../components/admin/LeadsTab';
import FunnelTab from '../components/admin/FunnelTab';
import ViewingsTab from '../components/admin/ViewingsTab';
import MessagesTab from '../components/admin/MessagesTab';
import AlertsTab from '../components/admin/AlertsTab';
import UsersTab from '../components/admin/UsersTab';

// The pieces live in ../components/admin/: the data loader (adminData.js),
// the two modals, the stats strip and one file per tab.

// ── Main Admin Dashboard ──────────────────────────────────────
export default function AdminDashboard() {
  const [assignModal,         setAssignModal]         = useState(null);
  const [approveModal,        setApproveModal]        = useState(null);
  const [leadDetailId,        setLeadDetailId]        = useState(null);
  const [showPasswordModal,   setShowPasswordModal]   = useState(false);
  const [tab, setTab] = useState('overview');
  const isMobile = useMediaQuery(MOBILE_QUERY);
  // Which lead column is showing on a phone — the board is one-at-a-time there.
  const [mobileCol, setMobileCol] = useState('active');

  const { signOut } = useAuth();
  const currentUser = getStoredUser();
  const isAdmin      = currentUser.role === 'admin';
  const userTenantId = currentUser.tenantId || null;


  const qc = useQueryClient();
  const dash = useQuery({ queryKey: ADMIN_DASHBOARD_KEY, queryFn: loadAdminData });
  const {
    overview, activeConversations, qualifiedLeads, rejectedLeads, closedLeads,
    alerts, agents, pendingUsers, allUsers, tenants,
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

  if (loading) return <div className="p-[140px] text-center text-muted">Loading Admin Operations Center...</div>;
  if (error)   return <div className="p-[140px] text-red">{error}</div>;

  const tabs = [
    'chat', 'overview', 'leads',
    'funnel', 'viewings', 'messages', 'alerts',
    ...(hasDelivery ? ['delivery'] : []),
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
              Operations Dashboard
            </h1>
            <p className="text-[clamp(14px,2.5vw,20px)] text-muted">
              Your agency's live WhatsApp pipeline
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
          <StatsStrip overview={overview} pendingUsers={pendingUsers} />
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

        {/* The owner's chat is the same inbox as the platform's WhatsApp API
            page (2026-10-21, Ayanda: "give them the new inbox"): every
            conversation, kept fresh while one is open, with its stage and
            notes beside it. Scoped to their own business by the API. */}
        {tab === 'chat' && (
          <InboxView scope="" showBusiness={false} onOpenRecord={(id) => setLeadDetailId(id)} />
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


        {/* ── Users ──────────────────────────────────────────── */}
        {tab === 'users' && (
          <UsersTab
            pendingUsers={pendingUsers} allUsers={allUsers} userTenantId={userTenantId}
            currentUser={currentUser} setApproveModal={setApproveModal} handleRejectUser={handleRejectUser} loadData={loadData}
          />
        )}


      </div>

      {assignModal  && <AssignModal  lead={assignModal}   agents={agents}   onClose={() => setAssignModal(null)}  onAssigned={() => { setAssignModal(null);  loadData(); }} />}
      {approveModal && <AdminApproveModal user={approveModal}  tenants={tenants} onClose={() => setApproveModal(null)} onApproved={() => { setApproveModal(null); loadData(); }} />}
      {leadDetailId && <LeadDetailModal leadId={leadDetailId} onClose={() => setLeadDetailId(null)} onUpdate={loadData} />}

      {/* Invite Link Modal */}
    </div>
  );
}
