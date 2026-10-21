// Shared by every part of the delivery tab (DeliveryTab.jsx and delivery/*).

export const REFRESH_MS = 20000;

// tone is a Badge tone (ui/Badge.jsx): one meaning each, never decoration.
export const STATUS_STYLE = {
  pending:    { label: 'waiting',     tone: 'warn' },
  assigned:   { label: 'accepted',    tone: 'system' },
  collected:  { label: 'collected',   tone: 'system' },
  on_the_way: { label: 'on the way',  tone: 'moving' },
  arrived:    { label: 'at the door', tone: 'moving' },
  delivered:  { label: 'delivered',   tone: 'good' },
  failed:     { label: 'stopped',     tone: 'bad' },
};

export const MOVING = ['assigned', 'collected', 'on_the_way', 'arrived'];

export const money = (n) => (n == null ? '—' : `R${Number(n).toFixed(2).replace(/\.00$/, '')}`);

// floor, not round: 89 minutes is "1h ago", not "2h ago".
export const ago = (iso) => {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
};

// Paid, nobody carrying it. The only state where someone at this screen can
// change the outcome, so it is defined once and used everywhere.
export const isUnclaimed = (d) => d.status === 'pending' && d.paymentStatus === 'paid' && !d.driverName;

export const NONE = [];
export const unwrap = (r) => r.data?.data ?? r.data;

// ── Managing drivers and shops (useDeliveryManage) ───────────
//
// Since 2026-10-07 the owner can do here what ADDDRIVER, REMOVEDRIVER,
// SUSPENDDRIVER, VERIFYDRIVER, ADDSHOP and APPROVESHOP do on WhatsApp. The API
// enforces the same rules and says why when it refuses, and that sentence is
// shown as it is. Anything that messages a driver or a shop says so in its
// confirmation first. Money (payouts, how a shop is paid) is still WhatsApp.


/** Only the fields that changed, so an edit never re-sends what nobody touched. */
export const changed = (before, after, keys) => {
  const out = {};
  for (const k of keys) {
    const a = typeof after[k] === 'string' ? after[k].trim() : after[k];
    const b = before[k] ?? (typeof a === 'boolean' ? false : '');
    if (String(a ?? '') !== String(b ?? '')) out[k] = a === '' ? null : a;
  }
  return out;
};
