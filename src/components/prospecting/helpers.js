// src/components/prospecting/helpers.js
// Plain values and functions the Prospecting screens share. Kept out of the
// component files so React's fast refresh keeps working.
import { colors } from '../../utils/theme';

export const c = colors;

export const input = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: 14, fontFamily: 'inherit',
  borderRadius: 10, background: 'rgba(255,255,255,0.04)', color: c.text, border: '1px solid ' + c.borderDim, outline: 'none',
};

// Every date on this screen is South African time.
export const day = (d) => (d
  ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' })
  : '');

export const displayName = (p) => (p?.name && p.name !== 'Unknown' ? p.name : p?.phone);

/** What a blank becomes when the contact has no name or business: never empty, which Meta rejects. */
export const FALLBACKS = { name: 'there', business: 'your business' };

/** One blank for one contact: their name, their business, or the typed text (mirrors the API). */
export const valueFor = (rule, contact) => {
  const r = rule || { source: 'text', text: '' };
  const own = r.source === 'name' ? (contact?.name && contact.name !== 'Unknown' ? contact.name : null)
    : r.source === 'business' ? contact?.agencyName || null
      : null;
  return String(own || String(r.text ?? '').trim() || FALLBACKS[r.source] || '').trim();
};

/** Template text with every {{blank}} filled for one contact (prospectingTemplatesService.renderFor). */
export const fill = (text, rules, contact) =>
  String(text || '').replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (m, k) => valueFor(rules?.[k], contact) || m);

/** "0821234567, Thabo, Thabo's Cuts" per line; name and business may be left out. */
export const parseList = (text) => text.split('\n').map((line) => {
  const [phone, name, business] = line.split(',').map((x) => x.trim());
  return { phone, name: name || 'Unknown', agencyName: business || null };
}).filter((x) => x.phone);
