// src/components/crm/crmHelpers.js
// Words, colours and filters the Operations CRM shares. Plain values only,
// so the component files keep React's fast refresh.
import { colors as c } from '../../utils/theme';

export { c };

export const STAGE_LABEL = {
  greeting: 'Greeting', discovery: 'Discovery', qualification: 'Qualifying', recommendation: 'Offered',
  objection_handling: 'Handling objections', trial_close: 'Trial close', commitment: 'Committed',
  quote_generated: 'Quoted', payment_sent: 'Payment link sent', payment_confirmed: 'Paid', onboarding: 'Onboarding',
};

// The milestone order (backend config/salesMilestones.js). Staff may move a
// lead forward through the conversation stages only; quoted, link sent and
// paid are earned by a real quote, payment link or payment.
export const MILESTONE_ORDER = ['greeting', 'discovery', 'qualification', 'recommendation', 'objection_handling', 'trial_close',
  'commitment', 'quote_generated', 'payment_sent', 'payment_confirmed', 'onboarding'];
export const STAFF_STAGES = ['discovery', 'qualification', 'recommendation', 'objection_handling', 'trial_close', 'commitment'];
const LEGACY = { objection: 'objection_handling', post_sale: 'onboarding' };
export const canonical = (s) => (s ? LEGACY[s] || s : null);
/** Where a person may move this lead: forward, conversation stages only. */
export const nextStagesFor = (stage) => {
  const at = MILESTONE_ORDER.indexOf(canonical(stage));
  return STAFF_STAGES.filter((s) => MILESTONE_ORDER.indexOf(s) > at);
};

export const BUCKET_TINT = {
  new: c.muted, talking: c.cyan, offered: c.amber, committed: c.orange, link_sent: c.lime, won: c.emerald, lost: c.red,
};

export const INTENT = {
  hot: { label: 'hot', tint: c.red, icon: '🔥' },
  warm: { label: 'warm', tint: c.amber, icon: '☀️' },
  cool: { label: 'cool', tint: c.cyan, icon: '❄️' },
  lost: { label: 'lost', tint: c.muted, icon: '✖' },
};

/** "4m", "3h", "2d": short, because it sits on a card. */
export const ago = (d, now = Date.now()) => {
  if (!d) return '';
  const mins = Math.max(0, Math.floor((now - new Date(d).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

export const day = (d) => (d
  ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' })
  : '');

export const who = (l) => l.name || l.phone;

export const isOpen = (l) => l.bucket !== 'won' && l.bucket !== 'lost';
export const followUpDue = (l, now = Date.now()) => isOpen(l) && l.followUpAt && new Date(l.followUpAt).getTime() <= now;

export const EMPTY_FILTERS = { q: '', intent: '', waiting: false, due: false, business: '', showClosed: false };

/** The toolbar's filters, applied the same way on the board and the list. */
export const applyFilters = (leads, f, now = Date.now()) => {
  const needle = f.q.trim().toLowerCase();
  return leads.filter((l) =>
    (!needle || [l.name, l.phone, l.business, l.lastText, l.closeReason].some((v) => v && String(v).toLowerCase().includes(needle)))
    && (!f.intent || l.intent === f.intent)
    && (!f.waiting || !!l.waitingSince)
    && (!f.due || followUpDue(l, now))
    && (!f.business || l.tenantId === f.business));
};

/** Who to look at first: waiting longest, then follow-ups due, then hot, then most recent. */
export const byUrgency = (now = Date.now()) => (a, b) => {
  const w = (l) => (l.waitingSince ? new Date(l.waitingSince).getTime() : Infinity);
  if (w(a) !== w(b)) return w(a) - w(b);
  const d = (l) => (followUpDue(l, now) ? 0 : 1);
  if (d(a) !== d(b)) return d(a) - d(b);
  const h = (l) => (l.intent === 'hot' ? 0 : l.intent === 'warm' ? 1 : 2);
  if (h(a) !== h(b)) return h(a) - h(b);
  return new Date(b.lastActivityAt || 0) - new Date(a.lastActivityAt || 0);
};
