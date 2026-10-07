// src/hooks/useDeliveryManage.js
//
// Adding, editing and removing a delivery business's drivers and shops:
// /api/delivery/manage (backend routes/deliveryManageRoutes.js). The rules
// are the same as the WhatsApp commands (ADDDRIVER, REMOVEDRIVER, ADDSHOP,
// APPROVESHOP...), enforced by the API, which answers a refusal with a
// sentence to show as it is.
//
// Money is not here, on purpose: payouts and how a shop is paid stay on
// WhatsApp.
//
// `q` is the "?tenantId=…" the delivery tab already carries for a platform
// role, or "" for a business's own admin.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';

const BASE = '/delivery/manage';
const enc = (phone) => encodeURIComponent(phone);

/** The API's own sentence when it refuses ("is out with 1 delivery right now…"). */
export const manageErrorMessage = (err) =>
  err?.response?.data?.message || 'Something went wrong. Nothing was changed.';

/** The shop categories, from the API, so the dashboard keeps no copy. */
export function useShopCategories() {
  return useQuery({
    queryKey: ['delivery', 'categories'],
    queryFn: () => api.get(`${BASE}/categories`).then((r) => r.data.data),
    staleTime: Infinity,
  });
}

/** Each action resolves to the API's `data` and refreshes the delivery tab. */
export function useDeliveryManage(q) {
  const qc = useQueryClient();
  const run = async (req) => {
    const res = await req;
    qc.invalidateQueries({ queryKey: ['delivery'] });
    return res.data.data;
  };
  const at = (path) => `${BASE}${path}${q}`;
  return {
    addDriver: (fields) => run(api.post(at('/drivers'), fields)),
    updateDriver: (phone, fields) => run(api.patch(at(`/drivers/${enc(phone)}`), fields)),
    suspendDriver: (phone) => run(api.post(at(`/drivers/${enc(phone)}/suspend`), {})),
    activateDriver: (phone) => run(api.post(at(`/drivers/${enc(phone)}/activate`), {})),
    verifyDriver: (phone) => run(api.post(at(`/drivers/${enc(phone)}/verify`), {})),
    rejectDriver: (phone, reason) => run(api.post(at(`/drivers/${enc(phone)}/reject`), { reason })),
    removeDriver: (phone) => run(api.delete(at(`/drivers/${enc(phone)}`))),

    addShop: (fields) => run(api.post(at('/shops'), fields)),
    updateShop: (id, fields) => run(api.patch(at(`/shops/${id}`), fields)),
    approveShop: (id) => run(api.post(at(`/shops/${id}/approve`), {})),
    switchShopOff: (id) => run(api.post(at(`/shops/${id}/switch-off`), {})),
    switchShopOn: (id) => run(api.post(at(`/shops/${id}/switch-on`), {})),
    removeShop: (id) => run(api.delete(at(`/shops/${id}`))),
  };
}
