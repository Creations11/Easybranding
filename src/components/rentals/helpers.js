// Shared by the parts of the rentals panel (RentalsPanel.jsx and rentals/*).

// tone is a Badge tone (ui/Badge.jsx).
export const STATUS = {
  draft: { label: 'Draft', tone: 'neutral' },
  pending_review: { label: 'Waiting for review', tone: 'warn' },
  published: { label: 'Live', tone: 'good' },
  rented: { label: 'Let', tone: 'system' },
  archived: { label: 'Archived', tone: 'neutral' },
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

/** Ask for the reason the landlord will be emailed. Null if the person backs out. */
export const askReason = (question) => {
  const reason = window.prompt(question);
  return reason && reason.trim() ? reason.trim() : null;
};

export const ROLES = [['landlord', 'Landlord'], ['renter', 'Renter']];

/** Only what changed, so an edit never re-sends a field nobody touched. */
export const changes = (before, after) => {
  const out = {};
  for (const k of ['fullName', 'email', 'phone']) if (after[k].trim() !== (before[k] || '')) out[k] = after[k].trim();
  if ([...after.roles].sort().join() !== [...before.roles].sort().join()) out.roles = after.roles;
  return out;
};
