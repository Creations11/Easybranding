// src/hooks/useSystemHealth.js
//
// /api/admin-ops/system-health — ads, quiet streams, quiet fallbacks,
// delivery, CI, the agent, clients that cannot send, takeover slots.
//
// Polled, because this is the screen you leave open: a health page that only
// tells the truth at the moment you loaded it is a screenshot.
import { useQuery } from '@tanstack/react-query';
import api from '../api';

export const HEALTH_KEY = ['admin-ops', 'system-health'];

export function useSystemHealth() {
  return useQuery({
    queryKey: HEALTH_KEY,
    queryFn: () => api.get('/admin-ops/system-health').then((r) => r.data.data),
    refetchInterval: 60_000,
  });
}
