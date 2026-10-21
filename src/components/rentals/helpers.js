// Shared by the parts of the rentals panel (RentalsPanel.jsx and rentals/*).
import { colors as c } from '../../utils/theme';

export const STATUS = {
  draft: { label: 'Draft', tone: c.muted },
  pending_review: { label: 'Waiting for review', tone: c.amber },
  published: { label: 'Live', tone: c.emerald },
  rented: { label: 'Let', tone: c.cyan },
  archived: { label: 'Archived', tone: c.muted },
};

export const TYPE = { room: 'Room', backroom: 'Backroom', cottage: 'Cottage', apartment: 'Flat', house: 'House' };
export const AMENITY = {
  wifi: 'Wi-Fi', parking: 'Parking', prepaid_electricity: 'Prepaid electricity', water_included: 'Water included',
  own_entrance: 'Own entrance', own_bathroom: 'Own bathroom', own_kitchen: 'Own kitchen', security: 'Security',
  garden: 'Garden', pets_allowed: 'Pets allowed',
};

export const rand = (n) => (typeof n === 'number' ? 'R' + n.toLocaleString('en-ZA') : '');
// Fleurhof is in South Africa, so is every time on this screen.
export const when = (d) => (d
  ? new Date(d).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' })
  : '');
export const whatsapp = (e164) => 'https://wa.me/' + String(e164 || '').replace(/^\+/, '');

export const btn = (tone, disabled) => ({
  padding: '6px 12px', fontSize: 12, fontFamily: 'inherit', borderRadius: 8,
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
  background: tone + '18', color: tone, border: '1px solid ' + tone + '44',
});

export const card = { background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '14px 16px', marginBottom: 12 };

/** Ask for the reason the landlord will be emailed. Null if the person backs out. */
export const askReason = (question) => {
  const reason = window.prompt(question);
  return reason && reason.trim() ? reason.trim() : null;
};

export const field = {
  width: '100%', boxSizing: 'border-box', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit',
  borderRadius: 8, background: c.surface, color: c.text, border: '1px solid ' + c.borderDim,
};
export const ROLES = [['landlord', 'Landlord'], ['renter', 'Renter']];

/** Only what changed, so an edit never re-sends a field nobody touched. */
export const changes = (before, after) => {
  const out = {};
  for (const k of ['fullName', 'email', 'phone']) if (after[k].trim() !== (before[k] || '')) out[k] = after[k].trim();
  if ([...after.roles].sort().join() !== [...before.roles].sort().join()) out.roles = after.roles;
  return out;
};
