// The Super Admin dashboard's colours (moved from SuperAdminDashboard.jsx).

// ── Design tokens ─────────────────────────────────────────────
export const c = {
  bg: '#06080A', sidebar: '#080B08', surface: '#0D110C',
  card: '#121710', lime: '#B8F040', earth: '#C4873A',
  moss: '#4A6741', sage: '#7A9E6E', cyan: '#22d3ee',
  emerald: '#34d399', amber: '#fbbf24', red: '#f87171',
  orange: '#f97316', text: '#EEF0E8', muted: '#8A9080',
  border: 'rgba(184,240,64,0.12)', borderDim: 'rgba(255,255,255,0.06)',
};

export const STATUS_COLOR = {
  active: c.lime, trial: c.amber, suspended: c.red,
  cancelled: c.muted, qualified: c.lime, not_qualified: c.red,
  taken_over: c.orange, closed: c.muted,
};

export const PLAN_COLOR = { starter: c.sage, growth: c.lime, enterprise: c.cyan };
