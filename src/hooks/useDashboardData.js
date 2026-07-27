// src/hooks/useDashboardData.js
// ─────────────────────────────────────────────────────────────
// React Query hooks for dashboard data
// Each hook handles its own loading/error/caching
// Safe to import — won't fetch if user is an eb_agent
//
// FIX APPLIED (29 June 2026):
// Added useClosedLeads, matching the existing pattern exactly —
// previously there was no hook to fetch closed leads at all, which
// was the actual reason a closed lead had no way to be found or
// reopened in the dashboard (no missing button — the data itself
// was never fetched). Pairs with the new GET /admin-ops/leads/closed
// route and getClosedLeads controller added the same day.
// ─────────────────────────────────────────────────────────────
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { useAuth } from '../context/AuthContext';

// ── Tenant scope (super-admin only) ──────────────────────────
// A super-admin sees every tenant by default, which mixes platform
// oversight with working EasyBranding's own customers. The Operations
// view can narrow to one tenant; scope flows through here so the query
// key changes (React Query refetches) and the request carries ?tenantId.
export const SCOPE_KEY = 'wabos.opsScope';
export const getStoredScope = () => {
  try { return localStorage.getItem(SCOPE_KEY) || ''; } catch { return ''; }
};
export const setStoredScope = (v) => {
  try { v ? localStorage.setItem(SCOPE_KEY, v) : localStorage.removeItem(SCOPE_KEY); } catch { /* ignore */ }
};
const scopedUrl = (path, scope) => {
  if (!scope) return path;
  return path + (path.includes('?') ? '&' : '?') + 'tenantId=' + scope;
};

// ── Helper: only fetch for non-agent roles ───────────────────
function useIfNotAgent(queryKey, queryFn, options = {}) {
  const { isEBAgent, isAuthenticated } = useAuth();

  return useQuery({
    queryKey,
    queryFn,
    enabled: isAuthenticated && !isEBAgent,
    staleTime: options.staleTime ?? 30_000,
    retry: options.retry ?? 2,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? true,
    ...options,
  });
}

// ── Individual data hooks ────────────────────────────────────

export function useOverview(scope = '') {
  return useIfNotAgent(
    ['admin-ops', 'overview', scope],
    () => api.get(scopedUrl('/admin-ops/overview', scope)).then(r => r.data?.data?.overview),
    { staleTime: 20_000 }
  );
}

// All leads, regardless of status — used as a completeness check
// against the four status-specific admin-ops lists below, which
// (per their "active conversations right now" framing) may be
// time-windowed rather than exhaustive.
export function useAllLeads() {
  return useIfNotAgent(
    ['leads', 'all'],
    () => api.get('/leads').then(r => r.data?.data?.leads || []),
    { staleTime: 30_000 }
  );
}

export function useActiveLeads(scope = '') {
  return useIfNotAgent(
    ['admin-ops', 'conversations', 'active', scope],
    // limit=100: the Leads board's Active column has no per-column pagination,
    // so fetch enough that its count matches the overview "Active" stat (both
    // now use the same not-terminal definition server-side). Fine at current
    // scale; this view needs real pagination if one tenant's active count
    // grows large.
    () => api.get(scopedUrl('/admin-ops/conversations/active?limit=100', scope)).then(r => r.data?.data?.leads || []),
    { staleTime: 15_000 }
  );
}

// These three endpoints default to limit=20 server-side. The Leads board has
// no per-column pagination, and SuperAdminDashboard puts any lead the four
// status calls DIDN'T return into an "Other" column — so a truncated response
// doesn't look like truncation, it looks like the lead is uncategorised.
// Confirmed in production 2026-07-27: 70 closed leads, 20 returned, 50 sitting
// under "Other" as if nobody had closed them.
//
// 200 is headroom, not a fix for scale — `closed` accumulates forever, so this
// board needs real per-column pagination before that count approaches it.
const BOARD_LIMIT = 200;

export function useQualifiedLeads(scope = '') {
  return useIfNotAgent(
    ['admin-ops', 'leads', 'qualified', scope],
    () => api.get(scopedUrl(`/admin-ops/leads/qualified?limit=${BOARD_LIMIT}`, scope)).then(r => r.data?.data?.leads || []),
    { staleTime: 30_000 }
  );
}

export function useRejectedLeads(scope = '') {
  return useIfNotAgent(
    ['admin-ops', 'leads', 'rejected', scope],
    () => api.get(scopedUrl(`/admin-ops/leads/rejected?limit=${BOARD_LIMIT}`, scope)).then(r => r.data?.data?.leads || []),
    { staleTime: 30_000 }
  );
}

// NEW (29 June 2026): closed leads — see file header.
export function useClosedLeads(scope = '') {
  return useIfNotAgent(
    ['admin-ops', 'leads', 'closed', scope],
    () => api.get(scopedUrl(`/admin-ops/leads/closed?limit=${BOARD_LIMIT}`, scope)).then(r => r.data?.data?.leads || []),
    { staleTime: 30_000 }
  );
}

export function useStages(scope = '') {
  return useIfNotAgent(
    ['admin-ops', 'stages', scope],
    () => api.get(scopedUrl('/admin-ops/stages', scope)).then(r => r.data?.data?.stages || []),
    { staleTime: 60_000 }
  );
}

export function useViewings(scope = '') {
  return useIfNotAgent(
    ['admin-ops', 'viewings', scope],
    () => api.get(scopedUrl('/admin-ops/viewings', scope)).then(r => r.data?.data?.viewings || []),
    { staleTime: 30_000 }
  );
}

export function useMessages(scope = '') {
  return useIfNotAgent(
    ['admin-ops', 'messages', 'recent', scope],
    () => api.get(scopedUrl('/admin-ops/messages/recent', scope)).then(r => r.data?.data?.messages || []),
    { staleTime: 15_000 }
  );
}

export function useAlerts(scope = '') {
  return useIfNotAgent(
    ['admin-ops', 'alerts', scope],
    () => api.get(scopedUrl('/admin-ops/alerts', scope)).then(r => r.data?.data?.alerts || []),
    { staleTime: 15_000 }
  );
}

export function useTenants() {
  return useIfNotAgent(
    ['tenants'],
    () => api.get('/tenants').then(r => r.data?.data?.tenants || []),
    { staleTime: 60_000 }
  );
}

export function useTenantStats() {
  return useIfNotAgent(
    ['tenants', 'stats'],
    () => api.get('/tenants/stats').then(r => r.data?.data?.stats),
    { staleTime: 60_000 }
  );
}

export function useUsers() {
  return useIfNotAgent(
    ['users'],
    () => api.get('/users').then(r => r.data?.data?.users || []),
    { staleTime: 60_000 }
  );
}

// Industry flow templates available to allocate to a client (Clients tab
// Allocate button). Static-ish list — cache generously.
export function useFlowTemplates() {
  return useIfNotAgent(
    ['admin-ops', 'flow-templates'],
    () => api.get('/admin-ops/automation/flow-templates').then(r => r.data?.data?.templates || []),
    { staleTime: 300_000 }
  );
}

export function usePendingUsers() {
  return useIfNotAgent(
    ['users', 'pending'],
    () => api.get('/users/pending').then(r => r.data?.data?.users || []),
    { staleTime: 30_000 }
  );
}

export function useAgents(scope = '') {
  return useIfNotAgent(
    ['admin-ops', 'agents', scope],
    () => api.get(scopedUrl('/admin-ops/agents', scope)).then(r => r.data?.data?.agents || []),
    { staleTime: 60_000 }
  );
}

export function useHealth() {
  const { isSuperAdmin, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['health'],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_API_URL}/health`)
        .then(r => r.json())
        .catch(() => ({ status: 'unknown', error: 'Failed to fetch' })),
    enabled: isAuthenticated && isSuperAdmin,
    staleTime: 60_000,
    retry: 1,
  });
}

// ── Refetch helper — call this after mutations ───────────────
export function useRefetchAll() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin-ops'] });
    queryClient.invalidateQueries({ queryKey: ['tenants'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['prospecting'] });
    queryClient.invalidateQueries({ queryKey: ['health'] });
  };
}