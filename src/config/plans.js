// src/config/plans.js
//
// The price list, FETCHED from the API rather than declared here.
//
// ── Why this file no longer holds prices ────────────────────────────────
//
// It used to. So did ClientModal.jsx, and planLimits.js and paymentService.js
// in the API — five copies in two repositories, all disagreeing:
//
//   Onboarding.jsx        "Professional"  R999
//   ClientModal.jsx       "Starter"       R950
//   API planLimits.js     —               R950
//   API paymentService.js —               R950 fallback
//   What tenants pay      —               R99–R250
//
// A client was quoted R999 at signup and silently repriced to R950 the first
// time an admin opened them. Two of the copies lived in a different repo
// from the other three, which is why they drifted for months unnoticed.
//
// Consolidating them into one file per repo would have left two, and two
// copies drift exactly as five did. So the API serves the list and this
// fetches it. There is no local table to go stale.
//
// ── product is not plan ─────────────────────────────────────────────────
//
// `plan` (starter / growth / …) grants FEATURE LIMITS — agents, numbers,
// entitlements. A product is what somebody buys: it sets `monthlyFee`, the
// amount they are charged, and names the plan whose limits it needs.
//
// They genuinely differ in production — NovaCare is on `growth` at R150 —
// and conflating them is what produced the five copies.
import api from '../api';

let cache = null;

/**
 * The products, cheapest first.
 *
 * Throws rather than returning a default. Every fallback price in this
 * system has been wrong at least once — Tenant.monthlyFee defaults to 950,
 * and paymentService fell back to 950 — so a checkout that cannot reach the
 * price list must say so, not guess and charge somebody R950.
 */
export async function loadProducts() {
  if (cache) return cache;
  const res = await api.get('/products');
  const products = (res.data?.data || res.data)?.products;
  if (!Array.isArray(products) || !products.length) {
    throw new Error('Price list unavailable');
  }
  cache = products;
  return cache;
}

/** For a <select>: "Appointment Booker — R199/mo". */
export const productOptions = (products) =>
  (products || []).map((p) => ({
    value: p.key,
    label: `${p.label} — R${p.price}/mo`,
    price: p.price,
    plan: p.plan,
  }));

/** What a checkout writes onto the tenant when a product is chosen. */
export const tenantFieldsFor = (products, key) => {
  const p = (products || []).find((x) => x.key === key);
  if (!p) return null;
  return { plan: p.plan, monthlyFee: p.price };
};
