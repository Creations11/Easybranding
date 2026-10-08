// src/components/ProspectingPanel.jsx
//
// Prospecting: message businesses on WhatsApp from the sales number, with
// templates Meta has approved for it, and keep track of how each one went.
//
// Rebuilt 2026-10-08. The previous screen offered Twilio templates (Twilio was
// switched off on 2026-09-07, and its templates sit in a different WhatsApp
// account from the one the sales number sends from), sent one typed name to
// everybody, and asked nothing before sending. Now: the template list is read
// live from Meta for the sales number; each blank is filled per contact;
// people messaged this week or who said STOP are held back; one confirmation
// says exactly what goes to whom; and Meta's verdict on every message shows
// on the contact.
//
// The pieces are in components/prospecting/.
import { useState } from 'react';
import { useProspects } from '../hooks/useProspecting';
import { Empty, Notice } from './prospecting/ui';
import { c } from './prospecting/helpers';
import SendMessages from './prospecting/SendMessages';
import ContactList from './prospecting/ContactList';
import AddContacts from './prospecting/AddContacts';
import CampaignReport from './CampaignReport';
import { prospectingError } from '../hooks/useProspecting';

function Stat({ label, value, tint = c.text }) {
  return (
    <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '10px 12px', minWidth: 0, flex: '1 1 92px' }}>
      <div style={{ color: c.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ color: tint, fontSize: 22, fontWeight: 800, fontFamily: "'Fraunces', serif" }}>{value ?? '—'}</div>
    </div>
  );
}

export default function ProspectingPanel({ currentUser }) {
  const isAgent = currentUser?.role === 'eb_agent';
  const contactsQ = useProspects(currentUser);
  const prospects = contactsQ.data?.prospects || [];
  const [tab, setTab] = useState(null);
  const current = tab || (prospects.length ? 'send' : 'add');

  // The numbers come from the contacts this person can see, so an agent's
  // row describes their own list rather than the whole team's.
  const count = (test) => prospects.filter(test).length;
  const stats = [
    ['Contacts', prospects.length, c.text],
    ['Not messaged', count((p) => p.status === 'pending'), c.muted],
    ['Messaged', count((p) => !!p.sentAt), c.cyan],
    ['Delivered', count((p) => ['delivered', 'read'].includes(p.deliveryStatus)), c.emerald],
    ['Replied', count((p) => p.status === 'replied'), c.lime],
    ['Converted', count((p) => p.outcome === 'converted' || p.status === 'converted'), c.lime],
  ];

  const TABS = [
    ['send', '📤 Send messages'],
    ['contacts', `📇 Contacts${prospects.length ? ` (${prospects.length})` : ''}`],
    ['add', '➕ Add contacts'],
    ...(isAgent ? [] : [['campaigns', '📈 Campaigns']]),
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: 4, color: c.text }}>
          {isAgent ? 'My Prospecting' : 'Prospecting'}
        </h1>
        <p style={{ color: c.muted, fontSize: 15, margin: 0 }}>
          Message businesses on WhatsApp from the sales number, using templates Meta has approved.
        </p>
      </div>

      {contactsQ.isError && <Notice tone="error">Couldn't load contacts. {prospectingError(contactsQ.error)}</Notice>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {stats.map(([l, v, t]) => <Stat key={l} label={l} value={contactsQ.isPending ? null : v} tint={t} />)}
      </div>

      <div role="tablist" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={current === k} onClick={() => setTab(k)} style={{
            padding: '9px 16px', borderRadius: 999, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
            fontWeight: current === k ? 700 : 500, background: current === k ? c.lime + '1A' : 'transparent',
            color: current === k ? c.lime : c.muted, border: '1px solid ' + (current === k ? c.lime : c.borderDim),
          }}>{l}</button>
        ))}
      </div>

      {contactsQ.isPending && current !== 'add' ? <Empty icon="⏳">Loading contacts…</Empty> : (
        <>
          {current === 'send' && (prospects.length
            ? <SendMessages prospects={prospects} />
            : <Empty icon="📇">Add some contacts first, then come back to message them.</Empty>)}
          {current === 'contacts' && <ContactList prospects={prospects} canManage={!isAgent} onAdd={() => setTab('add')} />}
          {current === 'add' && <AddContacts canBulk={!isAgent} canSync={!isAgent} />}
          {current === 'campaigns' && <CampaignReport />}
        </>
      )}
    </div>
  );
}
