// src/components/prospecting/AddContacts.jsx
// One contact, or a pasted list. Numbers are checked by the API: a local
// 082… becomes +2782…, and anything that is not a number is turned away.
import { useState } from 'react';
import { useProspectingActions, prospectingError } from '../../hooks/useProspecting';
import { Card, Button, Notice } from './ui';
import { c, input, parseList } from './helpers';

export default function AddContacts({ canBulk, canSync }) {
  const { add, addMany, sync } = useProspectingActions();
  const [one, setOne] = useState({ phone: '', name: '', business: '' });
  const [list, setList] = useState('');
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState(null);

  const run = async (what, fn) => {
    setBusy(what); setNote(null);
    try { setNote({ tone: 'ok', text: await fn() }); } catch (err) { setNote({ tone: 'error', text: prospectingError(err) }); }
    finally { setBusy(''); }
  };

  const onOne = (e) => {
    e.preventDefault();
    if (!one.phone.trim()) return;
    run('one', async () => {
      await add({ phone: one.phone.trim(), name: one.name.trim(), agencyName: one.business.trim() || null });
      setOne({ phone: '', name: '', business: '' });
      return `${one.name.trim() || one.phone.trim()} is added.`;
    });
  };

  const parsed = parseList(list);
  const onList = () => run('list', async () => {
    const r = await addMany(parsed);
    setList('');
    const { added = 0, skipped = 0, errors = [] } = r.results || {};
    return `Added ${added}.${skipped ? ` ${skipped} already on the list.` : ''}${errors.length ? ` ${errors.length} were not numbers: ${errors.map((x) => x.phone).join(', ')}.` : ''}`;
  });

  return (
    <div>
      {note && <Notice tone={note.tone}>{note.text}</Notice>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, margin: '0 0 12px' }}>Add one contact</h3>
          <form onSubmit={onOne} style={{ display: 'grid', gap: 8 }}>
            <input aria-label="WhatsApp number" placeholder="WhatsApp number, e.g. 0821234567" value={one.phone} onChange={(e) => setOne({ ...one, phone: e.target.value })} style={input} />
            <input aria-label="Their name" placeholder="Their name (optional)" value={one.name} onChange={(e) => setOne({ ...one, name: e.target.value })} style={input} />
            <input aria-label="Business name" placeholder="Business name (optional)" value={one.business} onChange={(e) => setOne({ ...one, business: e.target.value })} style={input} />
            <Button type="submit" disabled={!one.phone.trim() || busy === 'one'}>{busy === 'one' ? 'Adding…' : 'Add contact'}</Button>
          </form>
        </Card>

        {canBulk && (
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, margin: '0 0 4px' }}>Paste a list</h3>
            <p style={{ color: c.muted, fontSize: 12, margin: '0 0 10px' }}>One per line: number, name, business. Name and business can be left out.</p>
            <textarea aria-label="Contact list" rows={7} value={list} onChange={(e) => setList(e.target.value)}
              placeholder={"0821234567, Thabo, Thabo's Cuts\n0731234567, Lerato\n0611234567"} style={{ ...input, resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: 13 }} />
            <Button onClick={onList} disabled={!parsed.length || busy === 'list'} style={{ width: '100%', marginTop: 8 }}>
              {busy === 'list' ? 'Adding…' : parsed.length ? `Add ${parsed.length} contact${parsed.length === 1 ? '' : 's'}` : 'Add contacts'}
            </Button>
            {canSync && (
              <Button tone="info" onClick={() => run('sync', async () => { const r = await sync(); return `Google Sheets: ${r?.synced ?? 0} new contact${r?.synced === 1 ? '' : 's'} added.`; })} disabled={busy === 'sync'} style={{ width: '100%', marginTop: 8 }}>
                {busy === 'sync' ? 'Syncing…' : '↻ Pull new rows from Google Sheets'}
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
