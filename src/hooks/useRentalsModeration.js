// src/hooks/useRentalsModeration.js
//
// EasyRentals moderation: /api/rentals/admin (backend routes/rentalsAdminRoutes.js).
// Every listing waits here until a person at EasyBranding has looked at it;
// the API allows super_admin and eb_manager only, and the tab matches.
//
// Listings come back with the street address and the landlord's details,
// because the reviewer needs both to spot a fake listing. Photos come back as
// links relative to the API (a draft's are signed for an hour), so they are
// turned into absolute links here.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';

export const RENTALS_KEY = ['rentals', 'admin'];
const ADMIN = '/rentals/admin';

/** The API's origin, e.g. https://api.easybranding.co.za, for links it returns relative to itself. */
export const apiOrigin = () => {
  try {
    return new URL(api.defaults?.baseURL || '/', window.location.href).origin;
  } catch {
    return '';
  }
};

export const photoSrc = (url) => (typeof url === 'string' && url.startsWith('/') ? apiOrigin() + url : url);

// The server's own sentence when it refuses ("This listing is not waiting
// for review", a missing reason) says what to fix, so show it verbatim.
export const rentalsErrorMessage = (err) =>
  err?.response?.data?.message || 'Something went wrong. Nothing was changed.';

/** Listings in one status: pending_review (the queue), published, draft, rented, archived. */
export function useRentalListings(status, { enabled = true } = {}) {
  return useQuery({
    queryKey: [...RENTALS_KEY, 'listings', status],
    queryFn: () => api.get(`${ADMIN}/listings`, { params: { status } }).then((r) => r.data.data.listings),
    enabled,
  });
}

/** Rentals accounts, optionally narrowed by part of a name, email or number. */
export function useRentalAccounts(q) {
  return useQuery({
    queryKey: [...RENTALS_KEY, 'accounts', q || ''],
    queryFn: () => api.get(`${ADMIN}/accounts`, { params: q ? { q } : {} }).then((r) => r.data.data.accounts),
  });
}

/** The actions. Each resolves to the server's `data` and refreshes every rentals list. */
export function useRentalsActions() {
  const qc = useQueryClient();
  const run = async (req) => {
    const res = await req;
    qc.invalidateQueries({ queryKey: RENTALS_KEY });
    return res.data.data;
  };
  return {
    approve: (listingId) => run(api.post(`${ADMIN}/listings/${listingId}/approve`, {})),
    reject: (listingId, reason) => run(api.post(`${ADMIN}/listings/${listingId}/reject`, { reason })),
    takeDown: (listingId, reason) => run(api.post(`${ADMIN}/listings/${listingId}/unpublish`, { reason })),
    suspend: (accountId, reason) => run(api.post(`${ADMIN}/accounts/${accountId}/suspend`, { reason })),
    reinstate: (accountId) => run(api.post(`${ADMIN}/accounts/${accountId}/reinstate`, {})),
    // Making an account, and resetting a password, answer with a temporary
    // password the API shows exactly once: {account, temporaryPassword}.
    createAccount: (fields) => run(api.post(`${ADMIN}/accounts`, fields)),
    updateAccount: (accountId, fields) => run(api.patch(`${ADMIN}/accounts/${accountId}`, fields)),
    resetPassword: (accountId) => run(api.post(`${ADMIN}/accounts/${accountId}/reset-password`, {})),
    deleteAccount: (accountId) => run(api.delete(`${ADMIN}/accounts/${accountId}`)),
  };
}
