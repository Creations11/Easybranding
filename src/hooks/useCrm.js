// src/hooks/useCrm.js
//
// The Operations CRM: every lead in its sales column, who is waiting on us,
// and the few things a person may change (backend services/crmService.js).
// Keyed under 'admin-ops' so the page's Refresh (useRefetchAll) refreshes it.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { scopedUrl } from './useDashboardData';

export const crmError = (err) => err?.response?.data?.message || 'Something went wrong. Nothing was changed.';

export function useCrmLeads(scope = '') {
  return useQuery({
    queryKey: ['admin-ops', 'crm', scope],
    queryFn: () => api.get(scopedUrl('/admin-ops/crm/leads', scope)).then((r) => r.data.data),
    staleTime: 20_000,
    refetchInterval: 60_000,
  });
}

export function useLeadNotes(leadId) {
  return useQuery({
    queryKey: ['admin-ops', 'crm', 'notes', leadId],
    queryFn: () => api.get(`/admin-ops/crm/leads/${leadId}/notes`).then((r) => r.data.data.notes),
    enabled: !!leadId,
  });
}

export function useCrmActions() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-ops'] });
    qc.invalidateQueries({ queryKey: ['lead-detail'] });
  };
  const run = async (req) => {
    const res = await req;
    refresh();
    return res.data.data;
  };
  return {
    moveStage: (leadId, stage) => run(api.post(`/admin-ops/crm/leads/${leadId}/stage`, { stage })),
    addNote: (leadId, text) => run(api.post(`/admin-ops/crm/leads/${leadId}/notes`, { text })),
    // "Lost" is a close with a reason; reopen undoes it (adminOpsController).
    markLost: (leadId, reason) => run(api.post(`/admin-ops/leads/${leadId}/close`, { reason: `Lost: ${reason}` })),
    reopen: (leadId) => run(api.post(`/admin-ops/leads/${leadId}/reopen`, {})),
  };
}
