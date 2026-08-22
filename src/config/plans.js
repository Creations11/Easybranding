// src/config/plans.js
//
// The ONE place a plan's public name and price are written down.
//
// ── Why this file exists ────────────────────────────────────────────────
//
// The same plan key meant different things depending on which screen you
// were on. On 2026-08-22 there were four answers to "what does `starter`
// cost":
//
//   Onboarding.jsx       "Professional"  R999    (matches the homepage)
//   ClientModal.jsx      "Starter"       R950    (stale)
//   API planLimits.js    —               R950    (vestigial, see below)
//   What tenants pay     —               R950, R150, …
//
// So a client was quoted R999 during signup and silently became R950 the
// first time an admin opened them in the client modal. Onboarding.jsx's own
// header records this drift being "fixed" in June — it was fixed in one
// file, which created the second divergence rather than closing it.
//
// The prices here match the live homepage, because that is the number a
// customer has actually been shown and agreed to. If the homepage changes,
// change it here and both screens follow.
//
// ── plan is NOT price ───────────────────────────────────────────────────
//
// Worth stating plainly, because the dropdowns imply otherwise: the plan
// key drives FEATURE LIMITS on the API (maxAgents, maxNumbers in
// planLimits.js). What a tenant actually pays is `monthlyFee`, negotiated
// per client and written on the tenant.
//
// Those genuinely diverge in production and that is not a bug — NovaCare is
// on `growth` at R599, vmpublishers on `starter` at R150. The price below is
// the STARTING price the plan is sold at; monthlyFee is what was agreed.
// Any report that infers revenue from `plan` will be wrong.
//
// The `price` field on the API's planLimits.js is vestigial — nothing reads
// it for billing. Do not "sync" the two; they answer different questions.

export const PLANS = {
  r99: {
    label: 'R99 Lead Capture',
    price: 99,
    description: '1 WhatsApp number, 1 agent — lead capture only',
  },
  starter: {
    label: 'Professional',
    price: 999,
    description: '1 WhatsApp number, up to 5 agents',
  },
  growth: {
    label: 'Business',
    price: 2499,
    description: '2 WhatsApp numbers, unlimited agents',
  },
  enterprise: {
    label: 'Enterprise',
    price: null, // custom — quoted per client, never written as 0
    description: 'Custom — contact us for pricing',
  },
};

/** Dropdown options, in ladder order, cheapest first. */
export const planOptions = () =>
  Object.entries(PLANS).map(([value, p]) => ({
    value,
    label: p.price ? `${p.label} — R${p.price.toLocaleString('en-ZA')}/mo` : `${p.label} — ${p.description}`,
  }));

/**
 * The starting price for a plan, or null for Enterprise.
 *
 * Null rather than 0 on purpose: 0 is a real fee meaning "free", and
 * writing it for a custom-quote client would make them look like a
 * non-paying tenant in every revenue report.
 */
export const startingPrice = (plan) => PLANS[plan]?.price ?? null;
