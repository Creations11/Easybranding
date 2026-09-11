// src/hooks/useClientBilling.js
//
// The platform's clients and what they owe us — /api/admin-ops/billing.
//
// Every action here used to be a script or a hand edit on the server (Venbus's
// R100 on 2026-09-11 took a script, a manual invoice update and a separate
// reactivation). The endpoints do each in one call; this is their client.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';

export const BILLING_KEY = ['admin-ops', 'billing', 'clients'];
const base = (tenantId) => `/admin-ops/billing/clients/${tenantId}`;

// The server's own sentence when it refuses (duplicate reference, future date,
// no open invoice…) — it says exactly what to fix, so show it verbatim.
export const billingErrorMessage = (err) =>
  err?.response?.data?.message || 'Something went wrong — nothing was changed.';

export function useClientBilling() {
  return useQuery({
    queryKey: BILLING_KEY,
    queryFn: () => api.get('/admin-ops/billing/clients').then((r) => r.data.data),
  });
}

/** The four actions. Each resolves to the server's `data`, and refreshes the list. */
export function useBillingActions() {
  const qc = useQueryClient();
  const run = async (req) => {
    const res = await req;
    qc.invalidateQueries({ queryKey: BILLING_KEY });
    return res.data.data;
  };
  return {
    recordEft: (tenantId, body) => run(api.post(`${base(tenantId)}/eft-payment`, body)),
    suspend: (tenantId, reason) => run(api.post(`${base(tenantId)}/suspend`, { reason })),
    reactivate: (tenantId) => run(api.post(`${base(tenantId)}/reactivate`, {})),
    sendPayLink: (tenantId, invoiceId) => run(api.post(`${base(tenantId)}/payment-link`, { invoiceId })),
  };
}
