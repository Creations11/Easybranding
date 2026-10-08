// src/components/crm/CrmToolbar.jsx
// Search and filters shared by the board and the list, so switching view
// keeps what you were looking at.
import { c, EMPTY_FILTERS } from './crmHelpers';

const chip = (on, tint = c.lime) => ({
  padding: '6px 12px', borderRadius: 999, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
  background: on ? tint + '1A' : 'transparent', color: on ? tint : c.muted, border: '1px solid ' + (on ? tint : c.borderDim),
});

export default function CrmToolbar({ filters, setFilters, tenants, showBusiness, counts }) {
  const set = (patch) => setFilters({ ...filters, ...patch });
  const dirty = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 14 }}>
      <input
        aria-label="Search leads"
        placeholder="Search name, number, business or message"
        value={filters.q}
        onChange={(e) => set({ q: e.target.value })}
        style={{ flex: '1 1 220px', minWidth: 0, padding: '9px 12px', borderRadius: 10, background: c.card, color: c.text, border: '1px solid ' + c.borderDim, fontFamily: 'inherit', fontSize: 13, outline: 'none' }}
      />
      <button type="button" onClick={() => set({ waiting: !filters.waiting })} style={chip(filters.waiting, c.red)}>⏳ Waiting on us{counts?.waiting ? ` (${counts.waiting})` : ''}</button>
      <button type="button" onClick={() => set({ due: !filters.due })} style={chip(filters.due, c.amber)}>⏰ Follow-up due{counts?.followUpsDue ? ` (${counts.followUpsDue})` : ''}</button>
      {['hot', 'warm', 'cool'].map((i) => (
        <button key={i} type="button" onClick={() => set({ intent: filters.intent === i ? '' : i })} style={chip(filters.intent === i)}>{i}</button>
      ))}
      {showBusiness && tenants?.length > 1 && (
        <select aria-label="Business" value={filters.business} onChange={(e) => set({ business: e.target.value })} style={{ padding: '7px 10px', borderRadius: 10, background: c.card, color: c.text, border: '1px solid ' + c.borderDim, fontFamily: 'inherit', fontSize: 12 }}>
          <option value="">All businesses</option>
          {tenants.map((t) => <option key={t._id} value={t._id}>{t.businessName}</option>)}
        </select>
      )}
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.muted, cursor: 'pointer' }}>
        <input type="checkbox" checked={filters.showClosed} onChange={(e) => set({ showClosed: e.target.checked })} /> Show lost
      </label>
      {dirty && <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} style={{ ...chip(false), border: 'none' }}>Clear</button>}
    </div>
  );
}
