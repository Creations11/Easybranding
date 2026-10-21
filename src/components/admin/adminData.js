// The admin dashboard's data, as one query (moved from AdminDashboard.jsx).
import api from '../../api';

// Module scope, like App.jsx's getUser(): loadData reads the role through
// this rather than closing over component state, so the mount effect stays
// dependency-free.
export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('eb_user') || '{}'); }
  catch { return {}; }
};

// ── The dashboard's data, as one query ──────────────────────────────────
//
// One query rather than fourteen because the panels are judged together:
// whether EVERY call failed decides between blanking the page and showing a
// banner, and that needs all the results side by side. Moved from a mount
// effect onto react-query on 2026-10-05, which gives it two things the effect
// never had: a refresh that keeps the panels on screen while it runs, and a
// failed refresh that keeps the last good data instead of an error page.
export const ADMIN_DASHBOARD_KEY = ['admin-dashboard'];

// What the page shows before anything has loaded, and after a total failure.
export const NO_DATA = {
  overview: null, activeConversations: [], qualifiedLeads: [], rejectedLeads: [],
  closedLeads: [], alerts: [], agents: [],
  pendingUsers: [], allUsers: [], tenants: [], stages: [], recentMessages: [],
  viewingRequests: [], panelError: '',
};

export async function loadAdminData() {
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
  // 403 took down the whole dashboard for every paying client. It was then
  // only requested for the platform roles, and since 2026-10-21 not at all:
  // this page is role=admin only (App.jsx), so no platform role ever loads
  // it. Any other failure degrades a single panel instead of the page.

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

  // Only a wholesale failure is worth blanking the page for — a dead API or
  // an expired token fails every call, and a dashboard of empty panels with
  // no message would look like "you have no business" rather than "we could
  // not load it". Thrown, not returned: a query that throws keeps whatever it
  // last loaded, so a refresh that fails on a bad connection does not take
  // working panels away.
  const rejected = results.filter(r => r.status === 'rejected');
  const firstMessage = rejected[0]?.reason?.response?.data?.message || 'Failed to load admin data';
  if (rejected.length && rejected.length === results.length) throw new Error(firstMessage);

  return {
    overview: ovRes?.data.data?.overview ?? null,
    activeConversations: activeRes?.data.data?.leads || [],
    qualifiedLeads: qualRes?.data.data?.leads || [],
    rejectedLeads: rejRes?.data.data?.leads || [],
    closedLeads: closedRes?.data.data?.leads || [],
    alerts: alertRes?.data.data?.alerts || [],
    agents: agentRes?.data.data?.agents || [],
    pendingUsers: pendingRes?.data.data?.users || [],
    allUsers: usersRes?.data.data?.users || [],
    tenants: clientRes?.data.data?.tenants || [],
    stages: stagesRes?.data.data?.stages || [],
    // Grouped by sender. Falls back to the flat array so the tab still
    // renders against an older API that has not deployed `conversations` yet.
    recentMessages: messagesRes?.data.data?.conversations
      || messagesRes?.data.data?.messages
      || [],
    viewingRequests: viewingsRes?.data.data?.viewings || [],
    // A PARTIAL failure still has to be visible, though: an empty panel is
    // indistinguishable from a panel with nothing in it, so the user is told
    // which way it is — just without losing the panels that did load.
    panelError: rejected.length ? firstMessage : '',
  };
}
