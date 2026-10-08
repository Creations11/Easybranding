// src/hooks/useProspecting.js
//
// Prospecting: contacts, and Meta-APPROVED templates sent from the sales
// number (backend services/prospectingTemplatesService.js, 2026-10-08).
//
// The template list is read live from the sales number's own WhatsApp
// account, so only what can actually be sent from it is offered.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';

export const PROSPECTING_KEY = ['prospecting'];

/** The API's own sentence when it refuses, shown as it is. */
export const prospectingError = (err) =>
  err?.response?.data?.message || 'Something went wrong. Nothing was sent.';

/** Contacts. An EB agent only ever sees the ones they added or were given. */
export function useProspects(currentUser) {
  return useQuery({
    queryKey: [...PROSPECTING_KEY, 'contacts', currentUser?.role, currentUser?.id],
    queryFn: async () => {
      const data = (await api.get('/prospecting')).data.data || {};
      const all = data.prospects || [];
      const mine = currentUser?.role === 'eb_agent'
        ? all.filter((p) => String(p.assignedTo) === String(currentUser?.id) || String(p.createdBy) === String(currentUser?.id))
        : all;
      return { prospects: mine, stats: data.stats || null };
    },
  });
}

/** Approved templates on the sales number, and the number itself (name, quality). */
export function useProspectTemplates() {
  return useQuery({
    queryKey: [...PROSPECTING_KEY, 'templates'],
    queryFn: async () => (await api.get('/prospecting/templates')).data.data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProspectingActions() {
  const qc = useQueryClient();
  const run = async (req) => {
    const res = await req;
    qc.invalidateQueries({ queryKey: PROSPECTING_KEY });
    return res.data.data;
  };
  return {
    add: (contact) => run(api.post('/prospecting', contact)),
    addMany: (contacts) => run(api.post('/prospecting/bulk', { contacts })),
    sync: () => run(api.post('/prospecting/sync')),
    send: (body) => run(api.post('/prospecting/send', body)),
    setOutcome: (id, outcome) => run(api.patch(`/prospecting/${id}/outcome`, { outcome })),
    remove: (id) => run(api.delete(`/prospecting/${id}`)),
    refreshTemplates: async () => {
      const data = (await api.get('/prospecting/templates', { params: { refresh: '1' } })).data.data;
      qc.setQueryData([...PROSPECTING_KEY, 'templates'], data);
      return data;
    },
  };
}
