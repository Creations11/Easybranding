// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import SuperAdminPanel from '../components/SuperAdminPanel';
import LeadDetailModal from '../components/LeadDetailModal';
import AssignModal from '../components/AssignModal';
import AdminApproveModal from '../components/AdminApproveModal';
import AdminClientModal from '../components/AdminClientModal';
import useMediaQuery, { MOBILE_QUERY } from '../hooks/useMediaQuery';
import ChatTab from '../components/ChatTab';
import { colors } from '../utils/theme';


// Module scope, like App.jsx's getUser(): loadData reads the role through
// this rather than closing over component state, so the mount effect stays
// dependency-free.
const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('eb_user') || '{}'); }
  catch { return {}; }
};

// ── Account controls ──────────────────────────────────────────────────
//
// Added 2026-08-08. This page had NO sign-out and no way to change a password:
// ConditionalNav only renders <Nav/> on public routes, SuperAdminDashboard
// carries its own Sign Out button, and this page — the one every CLIENT lands
// on — had neither. The first client onboarded reported it as "it's just
// stuck", which is exactly what it was: signed in, no way out, no way to
// replace the temporary password he'd been sent over WhatsApp.
function ChangePasswordModal({ onClose }) {
  const [current, setCurrent] = useState('');
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  const submit = async () => {
    setError('');
    if (next !== confirm) return setError("The new passwords don't match.");
    if (next.length < 6) return setError('New password must be at least 6 characters.');
    setBusy(true);
    try {
      // Trimmed: these are typed on a phone and pasted out of WhatsApp, where a
      // trailing space is invisible and would otherwise read as a wrong password.
      await api.post('/auth/change-password', {
        currentPassword: current.trim(),
        newPassword: next.trim(),
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change the password.');
    } finally { setBusy(false); }
  };

  const field = {
    width: '100%', padding: '12px', borderRadius: '10px', background: '#1C1C19',
    border: '1px solid ' + colors.borderDim, color: colors.text, fontSize: '14px',
    marginBottom: '12px', outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.card, border: '1px solid ' + colors.borderDim,
          borderRadius: '14px', padding: '22px', width: '100%', maxWidth: '380px',
        }}
      >
        <h3 style={{ color: colors.lime, marginBottom: '14px', fontSize: '17px' }}>Change password</h3>

        {done ? (
          <>
            <p style={{ color: colors.text, fontSize: '14px', marginBottom: '18px' }}>
              ✅ Password updated. Use the new one next time you sign in.
            </p>
            <button onClick={onClose} style={{
              width: '100%', padding: '11px', background: colors.lime, color: '#050505',
              border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>Done</button>
          </>
        ) : (
          <>
            {/* autoCapitalize/autoCorrect off: a mobile keyboard "helpfully"
                capitalising the first character is a wrong password. */}
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
              placeholder="Current password" style={field} autoComplete="current-password"
              autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)}
              placeholder="New password (6+ characters)" style={field} autoComplete="new-password"
              autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password" style={field} autoComplete="new-password"
              autoCapitalize="none" autoCorrect="off" spellCheck={false} />

            {error && <p style={{ color: colors.red, fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={submit} disabled={busy} style={{
                flex: 1, padding: '11px', background: colors.lime, color: '#050505',
                border: 'none', borderRadius: '10px', fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1,
                fontFamily: 'inherit',
              }}>{busy ? 'Saving…' : 'Change password'}</button>
              <button onClick={onClose} style={{
                padding: '11px 18px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid ' + colors.borderDim, color: colors.muted,
                borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
              }}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const PLAN_COLORS   = { starter: colors.muted, growth: colors.lime, enterprise: colors.emerald };
const STATUS_COLORS = { active: colors.lime, trial: colors.amber, suspended: colors.red, cancelled: colors.muted };

// ── Main Admin Dashboard ──────────────────────────────────────
export default function AdminDashboard() {
  const [overview,            setOverview]            = useState(null);
  const [activeConversations, setActiveConversations] = useState([]);
  const [qualifiedLeads,      setQualifiedLeads]      = useState([]);
  const [rejectedLeads,       setRejectedLeads]       = useState([]);
  const [closedLeads,         setClosedLeads]         = useState([]);
  const [alerts,              setAlerts]              = useState([]);
  const [agents,              setAgents]              = useState([]);
  const [clients,             setClients]             = useState([]);
  const [clientStats,         setClientStats]         = useState(null);
  const [pendingUsers,        setPendingUsers]        = useState([]);
  const [allUsers,            setAllUsers]            = useState([]);
  const [tenants,             setTenants]             = useState([]);
  const [stages,              setStages]              = useState([]);
  const [recentMessages,      setRecentMessages]      = useState([]);
  const [viewingRequests,     setViewingRequests]     = useState([]);
  const [assignModal,         setAssignModal]         = useState(null);
  const [clientModal,         setClientModal]         = useState(null);
  const [approveModal,        setApproveModal]        = useState(null);
  const [leadDetailId,        setLeadDetailId]        = useState(null);
  const [inviteModal,         setInviteModal]         = useState(null);
  const [inviteUrl,           setInviteUrl]           = useState('');
  const [loading,             setLoading]             = useState(true);
  const [error,               setError]               = useState('');
  // Partial failure: some panels are empty because their call failed, not
  // because the business has no data. Shown as a banner, never as a
  // page-replacing error — see loadData.
  const [panelError,          setPanelError]          = useState('');
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

  const loadData = async () => {
    // ── Why this is allSettled and not Promise.all ────────────────────────
    //
    // These panels load in parallel, and with Promise.all a SINGLE rejected
    // request rejected the whole batch — the catch below then blanked the
    // entire page with "Failed to load admin data". No partial render, no
    // clue which call failed.
    //
    // That is exactly what happened to every client (2026-08-07):
    // /tenants/stats is platform-wide (all tenants, MRR) and super_admin-only
    // by design, so it correctly 403s a tenant admin — and that one deliberate
    // 403 took down the whole dashboard for every paying client. It is now
    // only requested by users who can actually see platform data, and any
    // other failure degrades a single panel instead of the page.
    const wantsPlatformStats = ['super_admin', 'eb_manager'].includes(getStoredUser().role);

    // Kicked off first so it still runs in parallel, but kept OUT of the
    // results tally below: a client skips it entirely, and a skipped call must
    // not count as a success when deciding whether everything failed.
    const statsPromise = wantsPlatformStats
      ? api.get('/tenants/stats').catch(() => null)
      : null;

    const results = await Promise.allSettled([
      api.get('/admin-ops/overview'),
      api.get('/admin-ops/conversations/active'),
      api.get('/admin-ops/leads/qualified'),
      api.get('/admin-ops/leads/rejected'),
      api.get('/admin-ops/leads/closed'),
      api.get('/admin-ops/alerts'),
      api.get('/admin-ops/agents'),
      api.get('/tenants'),
      api.get('/users/pending'),
      api.get('/users'),
      api.get('/admin-ops/stages'),
      api.get('/admin-ops/messages/recent'),
      api.get('/admin-ops/viewings'),
    ]);

    const [ovRes, activeRes, qualRes, rejRes, closedRes, alertRes, agentRes,
           clientRes, pendingRes, usersRes, stagesRes, messagesRes,
           viewingsRes] = results.map(r => (r.status === 'fulfilled' ? r.value : null));
    const statsRes = statsPromise ? await statsPromise : null;

    setOverview(ovRes?.data.data?.overview ?? null);
    setActiveConversations(activeRes?.data.data?.leads || []);
    setQualifiedLeads(qualRes?.data.data?.leads || []);
    setRejectedLeads(rejRes?.data.data?.leads || []);
    setClosedLeads(closedRes?.data.data?.leads || []);
    setAlerts(alertRes?.data.data?.alerts || []);
    setAgents(agentRes?.data.data?.agents || []);
    setClients(clientRes?.data.data?.tenants || []);
    setClientStats(statsRes?.data.data?.stats ?? null);
    setPendingUsers(pendingRes?.data.data?.users || []);
    setAllUsers(usersRes?.data.data?.users || []);
    setTenants(clientRes?.data.data?.tenants || []);
    setStages(stagesRes?.data.data?.stages || []);
    // Grouped by sender. Falls back to the flat array so the tab still
    // renders against an older API that has not deployed `conversations` yet.
    setRecentMessages(
      messagesRes?.data.data?.conversations
      || messagesRes?.data.data?.messages
      || []
    );
    setViewingRequests(viewingsRes?.data.data?.viewings || []);

    // Only a wholesale failure is worth blanking the page for — a dead API or
    // an expired token fails every call, and a dashboard of empty panels with
    // no message would look like "you have no business" rather than "we could
    // not load it".
    //
    // A PARTIAL failure still has to be visible, though: an empty panel is
    // indistinguishable from a panel with nothing in it, so the user is told
    // which way it is — just without losing the panels that did load.
    const rejected = results.filter(r => r.status === 'rejected');
    const firstMessage = rejected[0]?.reason?.response?.data?.message || 'Failed to load admin data';
    if (rejected.length && rejected.length === results.length) {
      setError(firstMessage);
      setPanelError('');
    } else {
      setError('');
      setPanelError(rejected.length ? firstMessage : '');
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleClientSave = (tenant) => {
    setClients(prev => {
      const exists = prev.find(c => c._id === tenant._id);
      return exists ? prev.map(c => c._id === tenant._id ? tenant : c) : [tenant, ...prev];
    });
    setClientModal(null);
  };

  const handleDeleteClient = async (client) => {
    if (!window.confirm(`Delete ${client.businessName}?`)) return;
    await api.delete(`/tenants/${client._id}`);
    setClients(prev => prev.filter(c => c._id !== client._id));
  };

  const handleRejectUser = async (user) => {
    if (!window.confirm(`Reject ${user.fullName}? Their account will be deactivated.`)) return;
    await api.post(`/users/${user._id}/reject`, { reason: 'Application rejected by admin' });
    setPendingUsers(prev => prev.filter(u => u._id !== user._id));
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '24px' }}>
            {[
              { label: 'Total Leads',   value: overview.totalLeads,          color: colors.text,    show: true },
              { label: 'Active',        value: overview.activeConversations, color: colors.cyan,    show: true },
              { label: 'Qualified',     value: overview.qualifiedLeads,      color: colors.lime,    show: true },
              { label: 'Rejected',      value: overview.rejectedLeads,       color: colors.red,     show: true },
              { label: 'Today',         value: overview.todayLeads,          color: colors.amber,   show: true },
              { label: 'Qual. Rate',    value: `${overview.qualificationRate}%`, color: colors.emerald, show: true },
              { label: 'Clients',       value: clients.length,               color: colors.cyan,    show: isSuperAdmin },
              { label: 'Monthly Rev',   value: `R${(clientStats?.mrr || 0).toLocaleString()}`, color: colors.lime, show: isSuperAdmin },
              { label: 'Pending Users', value: pendingUsers.length,          color: pendingUsers.length > 0 ? colors.amber : colors.muted, show: true },
            ].filter(s => s.show).map(s => (
              <div key={s.label} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '16px 18px' }}>
                <p style={{ color: colors.muted, fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
                <p style={{ fontSize: '28px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</p>
              </div>
            ))}
          </div>
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
        {tab === 'overview' && (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Recent Activity</h2>
            {activeConversations.slice(0, 5).map(lead => (
              <div key={lead._id} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '14px', padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><strong>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong><p style={{ color: colors.muted, fontSize: '13px' }}>{lead.phone}</p></div>
                <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', background: `${colors.cyan}22`, color: colors.cyan }}>{lead.workflowStatus?.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Leads CRM board ───────────────────────────────────── */}
        {/* Replaces the old separate active/qualified/rejected tabs
            with status columns side by side, plus a Closed column
            that didn't exist anywhere in this dashboard before —
            closed leads were previously unreachable and unreopenable
            from here. */}
        {tab === 'chat' && (
          <ChatTab conversations={activeConversations} onRefresh={loadData} onExit={() => setTab('overview')} />
        )}

        {tab === 'leads' && (
          <div>
            <h2 style={{ marginBottom: isMobile ? '12px' : '20px', fontSize: '20px' }}>Leads</h2>

            {/* On a phone this board is the screen standing between the owner
                and a customer conversation, and it was four 300px columns in a
                horizontal scroller — roughly three screens wide on a 390px
                device. The hint below it said "mouse wheel, trackpad, or drag
                the scrollbar", none of which exist on a phone.

                Same resolution LeadsBoard already uses: one column at a time,
                picked by a chip. */}
            {isMobile ? (
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
                {leadColumns.map(col => (
                  <button key={col.key} onClick={() => setMobileCol(col.key)}
                    style={{
                      flexShrink: 0, minHeight: 40, padding: '0 14px', borderRadius: 999,
                      border: `1px solid ${mobileCol === col.key ? colors.lime : colors.borderDim}`,
                      background: mobileCol === col.key ? `${colors.lime}22` : 'transparent',
                      color: mobileCol === col.key ? colors.lime : colors.muted,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                      fontFamily: 'inherit',
                    }}>
                    {col.icon} {col.label} ({col.items.length})
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '12px' }}>
                Scroll sideways (mouse wheel, trackpad, or drag the scrollbar below) to see Qualified, Rejected, and Closed →
              </p>
            )}
            {/* onWheel: a horizontal-scroll-only row is easy to miss without
                a trackpad — converts normal vertical scroll into horizontal
                movement while hovering the board, but ONLY when there's no
                vertical scrolling left to do in whatever's under the cursor
                (otherwise this hijacks scrolling through a column's own
                620px-tall internal list, making anything past the visible
                portion unreachable). */}
            <div
              className="leads-board-scroll"
              onWheel={e => {
                if (e.deltaY === 0) return;
                const col = e.target.closest('.lead-column-scroll');
                if (col) {
                  const canScrollDown = e.deltaY > 0 && col.scrollTop + col.clientHeight < col.scrollHeight;
                  const canScrollUp = e.deltaY < 0 && col.scrollTop > 0;
                  if (canScrollDown || canScrollUp) return;
                }
                e.currentTarget.scrollLeft += e.deltaY;
                e.preventDefault();
              }}
              style={{ display: 'flex', gap: '16px', overflowX: isMobile ? 'visible' : 'auto', paddingBottom: '8px' }}
            >
              {(isMobile ? leadColumns.filter(c => c.key === mobileCol) : leadColumns).map(col => (
                <div key={col.key} style={isMobile ? { flex: 1, minWidth: 0 } : { flex: '0 0 300px', width: '300px' }}>
                  <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700' }}>{col.icon} {col.label}</span>
                    <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '999px', background: colors.borderDim, color: colors.muted, fontWeight: '700' }}>{col.items.length}</span>
                  </div>
                  <div className="lead-column-scroll" style={isMobile ? { paddingRight: 4 } : { maxHeight: '620px', overflowY: 'auto', paddingRight: '4px' }}>
                    {col.items.length === 0 ? (
                      <p style={{ color: colors.muted, fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>None</p>
                    ) : col.items.map(lead => (
                      <div key={lead._id} onClick={() => setLeadDetailId(lead._id)} style={{ background: colors.card, border: `1px solid ${col.key === 'qualified' && lead.needsManualFollowUp ? colors.amber + '66' : colors.borderDim}`, borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', cursor: 'pointer' }}>
                        <strong style={{ fontSize: '13px' }}>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                        <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>{lead.phone}</p>

                        {col.key === 'active' && (
                          <>
                            <p style={{ color: colors.muted, fontSize: '11px', marginBottom: '6px' }}>Stage {lead.stageNumber}/{lead.totalStages} · {lead.minutesSinceLastMessage}m ago</p>
                            <button onClick={e => { e.stopPropagation(); setAssignModal(lead); }} style={{ padding: '5px 12px', background: `${colors.amber}22`, color: colors.amber, border: `1px solid ${colors.amber}44`, borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Assign</button>
                          </>
                        )}

                        {col.key === 'qualified' && (
                          <>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                              {lead.needsManualFollowUp && <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', fontWeight: '700', background: `${colors.amber}22`, color: colors.amber }}>⚠️ No phone</span>}
                              {lead.aiSummary?.score && <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', fontWeight: '700', background: lead.aiSummary.score >= 8 ? `${colors.lime}22` : `${colors.amber}22`, color: lead.aiSummary.score >= 8 ? colors.lime : colors.amber }}>🤖 {lead.aiSummary.score}/10</span>}
                            </div>
                            {lead.assignedAgent
                              ? <p style={{ color: colors.emerald, fontSize: '11px' }}>✅ Assigned to {lead.assignedAgent}</p>
                              : <button onClick={e => { e.stopPropagation(); setAssignModal(lead); }} style={{ padding: '5px 12px', background: `${colors.lime}22`, color: colors.lime, border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Assign Agent</button>}
                          </>
                        )}

                        {col.key === 'rejected' && (
                          <p style={{ color: colors.red, fontSize: '11px' }}>{lead.rejectionReason || 'Did not qualify'}</p>
                        )}

                        {col.key === 'closed' && (
                          <>
                            <p style={{ color: colors.muted, fontSize: '11px', marginBottom: '6px' }}>{lead.closeReason || 'Manually closed'}{lead.closedAt ? ' · ' + new Date(lead.closedAt).toLocaleDateString('en-ZA') : ''}</p>
                            <button onClick={e => handleReopen(e, lead._id)} style={{ padding: '5px 12px', background: `${colors.lime}22`, color: colors.lime, border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>🔓 Reopen</button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Stage Funnel ───────────────────────────────────── */}
        {tab === 'funnel' && (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Pipeline Funnel</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stages.map((stage, i) => (
                <div key={i} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '12px', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{stage.label}</span>
                    <span style={{ fontSize: '13px', color: colors.muted }}>{stage.count} leads · {stage.percentage}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stage.percentage}%`, background: stage.stage === 'qualified' ? colors.lime : stage.stage === 'not_qualified' ? colors.red : colors.cyan, borderRadius: '999px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Viewings ───────────────────────────────────────── */}
        {tab === 'viewings' && (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Viewing Requests ({viewingRequests.length})</h2>
            {viewingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: colors.muted }}>
                <p style={{ fontSize: '40px', marginBottom: '16px' }}>📅</p>
                <p>No viewing requests yet.</p>
              </div>
            ) : viewingRequests.map(v => (
              <div key={v._id} onClick={() => setLeadDetailId(v._id)} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '14px', padding: '18px 24px', marginBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '15px' }}>{v.name !== 'Unknown' ? v.name : v.phone}</strong>
                  <p style={{ color: colors.muted, fontSize: '13px', marginTop: '2px' }}>{v.phone}</p>
                  {v.propertyAddress && <p style={{ color: colors.muted, fontSize: '12px' }}>📍 {v.propertyAddress}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {v.viewingScheduledAt ? (
                    <>
                      <p style={{ color: colors.lime, fontWeight: '700' }}>{new Date(v.viewingScheduledAt).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                      <p style={{ color: colors.muted, fontSize: '12px' }}>{new Date(v.viewingScheduledAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</p>
                    </>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#fbbf24' }}>Pending schedule</span>
                  )}
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(52,211,153,0.15)', color: '#34d399', display: 'block', marginTop: '4px' }}>
                    {v.viewingStatus || 'requested'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Recent Messages ────────────────────────────────── */}
        {tab === 'messages' && (
          <div>
            {/* One card per sender, their recent messages inside it, ordered
                by who spoke last. The flat version gave every message its own
                card, so one person sending six things in a row filled the
                screen and quieter people dropped off the bottom. */}
            <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Recent Messages ({recentMessages.length} {recentMessages.length === 1 ? 'conversation' : 'conversations'})</h2>
            {recentMessages.length === 0 ? (
              <p style={{ color: colors.muted, textAlign: 'center', padding: '60px 0' }}>No messages yet.</p>
            ) : recentMessages.map((convo) => {
              const thread = convo.messages || [];
              const latest = thread[thread.length - 1];
              const hidden = (convo.totalMessages || thread.length) - thread.length;
              return (
                <div key={convo.leadId} onClick={() => setLeadDetailId(convo.leadId)}
                  style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '12px', padding: '14px 18px', marginBottom: '10px', cursor: 'pointer' }}>

                  {/* The sender, once */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: thread.length ? '10px' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <strong style={{ fontSize: '14px' }}>{convo.name && convo.name !== 'Unknown' ? convo.name : convo.phone}</strong>
                      {convo.takenOver && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: `${colors.amber}22`, color: colors.amber, flexShrink: 0 }}>taken over</span>}
                      <span style={{ fontSize: '11px', color: colors.muted, flexShrink: 0 }}>{convo.totalMessages || thread.length} msgs</span>
                    </div>
                    <span style={{ fontSize: '11px', color: colors.muted, flexShrink: 0 }}>
                      {latest ? new Date(latest.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  {/* …then the messages, oldest first so it reads like a chat */}
                  {hidden > 0 && (
                    <p style={{ fontSize: '11px', color: colors.muted, marginBottom: '6px' }}>+{hidden} earlier — open to read the rest</p>
                  )}
                  {thread.map((msg, j) => (
                    <div key={j} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '3px 0' }}>
                      <span style={{ fontSize: '12px', flexShrink: 0, opacity: 0.8 }}>{msg.direction === 'inbound' ? '📱' : '🤖'}</span>
                      <p style={{ color: msg.direction === 'inbound' ? colors.text : colors.muted, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>{msg.body}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Alerts ─────────────────────────────────────────── */}
        {tab === 'alerts' && (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Alerts ({alerts.length})</h2>
            {alerts.length === 0
              ? <div style={{ textAlign: 'center', padding: '60px 0', color: colors.muted }}><p style={{ fontSize: '40px', marginBottom: '16px' }}>✅</p><p>No alerts.</p></div>
              : alerts.map((alert, i) => (
                <div key={i} style={{ background: colors.card, border: `1px solid ${alert.severity === 'high' ? colors.red : colors.amber}44`, borderRadius: '14px', padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><strong>{alert.lead.name !== 'Unknown' ? alert.lead.name : alert.lead.phone}</strong><p style={{ color: colors.muted, fontSize: '13px', marginTop: '4px' }}>{alert.message}</p></div>
                  <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', background: alert.severity === 'high' ? `${colors.red}22` : `${colors.amber}22`, color: alert.severity === 'high' ? colors.red : colors.amber, fontWeight: '600', textTransform: 'uppercase' }}>{alert.severity}</span>
                </div>
              ))}
          </div>
        )}

        {/* ── Clients ────────────────────────────────────────── */}
        {tab === 'clients' && isSuperAdmin && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px' }}>Client Management ({clients.length})</h2>
              <button onClick={() => setClientModal({})} style={{ padding: '12px 24px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>+ Add Client</button>
            </div>
            {clientStats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Total',  value: clientStats.total  || 0 },
                  { label: 'Active', value: clientStats.active || 0, color: colors.lime },
                  { label: 'Trial',  value: clientStats.trial  || 0, color: colors.amber },
                  { label: 'MRR',    value: `R${(clientStats.mrr || 0).toLocaleString()}`, color: colors.emerald },
                ].map(s => (
                  <div key={s.label} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '16px 20px' }}>
                    <p style={{ color: colors.muted, fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase' }}>{s.label}</p>
                    <p style={{ fontSize: '28px', fontWeight: '800', color: s.color || colors.text }}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Search clients..." style={{ padding: '11px 16px', borderRadius: '10px', background: '#1C1C19', border: `1px solid ${colors.borderDim}`, color: colors.text, fontSize: '14px', width: '240px', outline: 'none' }} />
              {['all', 'active', 'trial', 'suspended', 'cancelled'].map(s => (
                <button key={s} onClick={() => setClientFilter(s)} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: clientFilter === s ? colors.lime : 'rgba(255,255,255,0.06)', color: clientFilter === s ? '#050505' : colors.muted, fontWeight: clientFilter === s ? '700' : '400', textTransform: 'capitalize', fontSize: '13px' }}>{s}</button>
              ))}
            </div>
            {filteredClients.length === 0
              ? <div style={{ textAlign: 'center', padding: '60px 0', color: colors.muted }}><p style={{ fontSize: '40px', marginBottom: '16px' }}>🌿</p><p>{clientSearch ? 'No clients match your search' : 'No clients yet — add your first one'}</p></div>
              : filteredClients.map(client => (
                <div key={client._id} style={{ background: colors.card, border: `1px solid ${!client.whatsappNumber ? colors.amber + '44' : colors.borderDim}`, borderRadius: '14px', padding: '18px 24px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '16px' }}>{client.businessName}</strong>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${STATUS_COLORS[client.status]}22`, color: STATUS_COLORS[client.status], fontWeight: '600' }}>{client.status}</span>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${PLAN_COLORS[client.plan]}22`, color: PLAN_COLORS[client.plan] }}>{client.plan}</span>
                        {!client.whatsappNumber && (
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${colors.amber}22`, color: colors.amber, fontWeight: '600' }}>⚠️ No WhatsApp number</span>
                        )}
                        {client.inviteToken && client.inviteExpiresAt && (
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${colors.cyan}18`, color: colors.cyan }}>
                            🔗 Invite expires {new Date(client.inviteExpiresAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <p style={{ color: colors.muted, fontSize: '13px' }}>
                        {client.contactEmail}
                        {client.industry ? ` · ${client.industry}` : ''}
                        {client.whatsappNumber ? ` · ${client.whatsappNumber}` : ''}
                        {` · ${client.workflowType || 'full'} workflow`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <div style={{ textAlign: 'center', padding: '6px 14px', background: colors.lime + '14', borderRadius: '8px' }}>
                        <p style={{ color: colors.lime, fontWeight: '700', fontSize: '16px' }}>{client.totalLeads || 0}</p>
                        <p style={{ color: colors.muted, fontSize: '10px' }}>Leads</p>
                      </div>
                      <div style={{ textAlign: 'center', padding: '6px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                        <p style={{ color: colors.text, fontWeight: '700', fontSize: '16px' }}>R{client.monthlyFee}</p>
                        <p style={{ color: colors.muted, fontSize: '10px' }}>/mo</p>
                      </div>
                      {/* Quick suspend/activate toggle */}
                      <button onClick={async () => {
                        const newStatus = client.status === 'suspended' ? 'active' : 'suspended';
                        try {
                          await api.put(`/tenants/${client._id}`, { status: newStatus });
                          loadData();
                        } catch (err) { alert('Failed to update status'); }
                      }} style={{ padding: '8px 14px', background: client.status === 'suspended' ? `${colors.lime}22` : `${colors.amber}22`, color: client.status === 'suspended' ? colors.lime : colors.amber, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                        {client.status === 'suspended' ? '▶ Activate' : '⏸ Suspend'}
                      </button>
                      <button onClick={() => setClientModal(client)} style={{ padding: '8px 14px', background: `${colors.lime}22`, color: colors.lime, border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                      <button onClick={async () => {
                        try {
                          const res = await api.post(`/invites/${client._id}/generate`);
                          setInviteUrl(res.data.data?.inviteUrl || '');
                          setInviteModal(client);
                          loadData();
                        } catch (err) { alert('Failed to generate invite link'); }
                      }} style={{ padding: '8px 14px', background: `${colors.cyan}22`, color: colors.cyan, border: `1px solid ${colors.cyan}33`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>🔗 Invite</button>
                      <button onClick={() => handleDeleteClient(client)} style={{ padding: '8px 14px', background: `${colors.red}22`, color: colors.red, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ── Users ──────────────────────────────────────────── */}
        {tab === 'users' && (
          <div>
            {/* Pending approvals — filter by tenant for admin */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>
                Pending Approvals
                {pendingUsers.length > 0 && <span style={{ marginLeft: '10px', background: colors.amber, color: '#050505', fontSize: '12px', padding: '3px 10px', borderRadius: '999px', fontWeight: '700' }}>{pendingUsers.length} waiting</span>}
              </h2>
              {pendingUsers.length === 0
                ? <div style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '14px', padding: '40px', textAlign: 'center', color: colors.muted }}><p style={{ fontSize: '32px', marginBottom: '12px' }}>✅</p><p>No pending approvals.</p></div>
                : pendingUsers.map(user => (
                  <div key={user._id} style={{ background: colors.card, border: `1px solid ${colors.amber}44`, borderRadius: '14px', padding: '18px 24px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '16px' }}>{user.fullName}</strong>
                      <p style={{ color: colors.muted, fontSize: '13px', marginTop: '2px' }}>{user.email} · {user.phone}</p>
                      <p style={{ color: colors.muted, fontSize: '12px', marginTop: '2px' }}>
                        Registered {new Date(user.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {user.requestedPlan && (
                          <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(184,240,64,0.12)', color: '#B8F040', fontWeight: '600', fontSize: '11px', textTransform: 'capitalize' }}>
                            {user.requestedPlan} plan
                          </span>
                        )}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setApproveModal(user)} style={{ padding: '10px 20px', background: `${colors.lime}22`, color: colors.lime, border: `1px solid ${colors.border}`, borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>✅ Approve</button>
                      <button onClick={() => handleRejectUser(user)} style={{ padding: '10px 16px', background: `${colors.red}22`, color: colors.red, border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>Reject</button>
                    </div>
                  </div>
                ))}
            </div>

            {/* All users — admin sees only their tenant's users */}
            {(() => {
              const visibleUsers = isSuperAdmin
                ? allUsers
                : allUsers.filter(u => u.tenantId === userTenantId);
              return (
                <div>
                  <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>
                    {isSuperAdmin ? `All Users (${allUsers.length})` : `Your Team (${visibleUsers.length})`}
                  </h2>
                  {visibleUsers.map(user => (
                    <div key={user._id} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '14px', padding: '16px 24px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{user.fullName}</strong>
                        <p style={{ color: colors.muted, fontSize: '13px', marginTop: '2px' }}>{user.email}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: user.approved ? `${colors.lime}22` : `${colors.amber}22`, color: user.approved ? colors.lime : colors.amber }}>
                          {user.approved ? '✅ Approved' : '⏳ Pending'}
                        </span>
                        {/* Protect super_admin accounts — show badge, no dropdown */}
                        {user.role === 'super_admin' || user._id === currentUser.id ? (
                          <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: `${colors.cyan}22`, color: colors.cyan, fontWeight: '600' }}>
                            {user.role} {user._id === currentUser.id ? '(you)' : '🔒'}
                          </span>
                        ) : (
                          <select
                            defaultValue={user.role}
                            onChange={async (e) => {
                              try {
                                await api.put(`/users/${user._id}`, { role: e.target.value });
                                loadData();
                              } catch (err) {
                                alert(err.response?.data?.message || 'Failed to update role');
                                e.target.value = user.role;
                              }
                            }}
                            style={{ padding: '4px 10px', background: `${colors.cyan}18`, border: `1px solid ${colors.cyan}33`, color: colors.cyan, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', outline: 'none' }}
                          >
                            <option value="borrower">borrower</option>
                            <option value="agent">agent</option>
                            <option value="admin">admin</option>
                            {isSuperAdmin && <option value="super_admin">super_admin</option>}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                  {visibleUsers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: colors.muted }}>
                      <p style={{ fontSize: '32px', marginBottom: '12px' }}>👥</p>
                      <p>No team members yet.</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Platform — super_admin only ─────────────────────── */}
        {tab === 'platform' && isSuperAdmin && <SuperAdminPanel />}

      </div>

      {assignModal  && <AssignModal  lead={assignModal}   agents={agents}   onClose={() => setAssignModal(null)}  onAssigned={() => { setAssignModal(null);  loadData(); }} />}
      {clientModal  && <AdminClientModal  client={clientModal._id ? clientModal : null} onClose={() => setClientModal(null)}  onSave={handleClientSave} />}
      {approveModal && <AdminApproveModal user={approveModal}  tenants={tenants} onClose={() => setApproveModal(null)} onApproved={() => { setApproveModal(null); loadData(); }} />}
      {leadDetailId && <LeadDetailModal leadId={leadDetailId} onClose={() => setLeadDetailId(null)} onUpdate={loadData} />}

      {/* Invite Link Modal */}
      {inviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '520px', background: colors.surface, borderRadius: '24px', border: `1px solid ${colors.border}`, padding: '32px' }}>
            <h3 style={{ color: colors.lime, marginBottom: '8px' }}>🔗 Invite Link</h3>
            <p style={{ color: colors.muted, fontSize: '14px', marginBottom: '24px' }}>
              Share this link with <strong style={{ color: colors.text }}>{inviteModal.businessName}</strong> staff. Anyone who registers via this link will be automatically linked to their agency.
            </p>
            <div style={{ background: '#1C1C19', border: `1px solid ${colors.borderDim}`, borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', wordBreak: 'break-all' }}>
              <p style={{ color: colors.lime, fontSize: '13px', fontFamily: 'monospace' }}>{inviteUrl}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button onClick={() => { navigator.clipboard.writeText(inviteUrl); }} style={{ flex: 1, padding: '12px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                Copy Link
              </button>
              <button onClick={() => setInviteModal(null)} style={{ padding: '12px 20px', background: 'transparent', border: `1px solid ${colors.borderDim}`, color: colors.muted, borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}>
                Close
              </button>
            </div>
            <p style={{ color: colors.muted, fontSize: '12px' }}>⚠️ This link expires in 30 days. Generate a new one if needed.</p>
          </div>
        </div>
      )}
    </div>
  );
}