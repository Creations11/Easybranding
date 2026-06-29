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

export function useOverview() {
  return useIfNotAgent(
    ['admin-ops', 'overview'],
    () => api.get('/admin-ops/overview').then(r => r.data?.data?.overview),
    { staleTime: 20_000 }
  );
}

export function useActiveLeads() {
  return useIfNotAgent(
    ['admin-ops', 'conversations', 'active'],
    () => api.get('/admin-ops/conversations/active').then(r => r.data?.data?.leads || []),
    { staleTime: 15_000 }
  );
}

export function useQualifiedLeads() {
  return useIfNotAgent(
    ['admin-ops', 'leads', 'qualified'],
    () => api.get('/admin-ops/leads/qualified').then(r => r.data?.data?.leads || []),
    { staleTime: 30_000 }
  );
}

export function useRejectedLeads() {
  return useIfNotAgent(
    ['admin-ops', 'leads', 'rejected'],
    () => api.get('/admin-ops/leads/rejected').then(r => r.data?.data?.leads || []),
    { staleTime: 30_000 }
  );
}

// NEW (29 June 2026): closed leads — see file header.
export function useClosedLeads() {
  return useIfNotAgent(
    ['admin-ops', 'leads', 'closed'],
    () => api.get('/admin-ops/leads/closed').then(r => r.data?.data?.leads || []),
    { staleTime: 30_000 }
  );
}

export function useStages() {
  return useIfNotAgent(
    ['admin-ops', 'stages'],
    () => api.get('/admin-ops/stages').then(r => r.data?.data?.stages || []),
    { staleTime: 60_000 }
  );
}

export function useViewings() {
  return useIfNotAgent(
    ['admin-ops', 'viewings'],
    () => api.get('/admin-ops/viewings').then(r => r.data?.data?.viewings || []),
    { staleTime: 30_000 }
  );
}

export function useMessages() {
  return useIfNotAgent(
    ['admin-ops', 'messages', 'recent'],
    () => api.get('/admin-ops/messages/recent').then(r => r.data?.data?.messages || []),
    { staleTime: 15_000 }
  );
}

export function useAlerts() {
  return useIfNotAgent(
    ['admin-ops', 'alerts'],
    () => api.get('/admin-ops/alerts').then(r => r.data?.data?.alerts || []),
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

export function usePendingUsers() {
  return useIfNotAgent(
    ['users', 'pending'],
    () => api.get('/users/pending').then(r => r.data?.data?.users || []),
    { staleTime: 30_000 }
  );
}

export function useAgents() {
  return useIfNotAgent(
    ['admin-ops', 'agents'],
    () => api.get('/admin-ops/agents').then(r => r.data?.data?.agents || []),
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