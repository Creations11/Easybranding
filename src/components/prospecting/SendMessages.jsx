// src/components/prospecting/SendMessages.jsx
//
// Three steps, top to bottom, with the phone preview always in view:
//   1. Choose a message: the templates Meta has APPROVED for the sales number.
//   2. Fill in the blanks: each {{variable}} from the contact's name, their
//      business, or text typed once.
//   3. Choose who: at most 50 at a time; anyone messaged in the last week is
//      held back unless "send again" is ticked.
// Then one confirmation that says exactly what goes to whom, and a result that
// lists who was sent, skipped and why, and what failed.
import { useMemo, useState } from 'react';
import { useProspectTemplates, useProspectingActions, prospectingError } from '../../hooks/useProspecting';
import MessagePreview from './MessagePreview';
import { Button, Pill, Step, Empty, Notice } from './ui';
import { c, input, day, displayName, valueFor } from './helpers';

const MAX = 50;
const NONE = [];
const RESEND_DAYS = 7;
const recently = (p) => p.sentAt && Date.now() - new Date(p.sentAt).getTime() < RESEND_DAYS * 86_400_000;

const SOURCES = [
  ['name', "Contact's name"],
  ['business', 'Business name'],
  ['text', 'Same text for everyone'],
];

/** A first guess for each blank: {{1}} the name, {{2}} the business, a named one by its name. */
const guess = (key, i) => {
  if (/name/i.test(key) && !/business|company|agency|shop/i.test(key)) return { source: 'name', text: 'there' };
  if (/business|company|agency|shop/i.test(key)) return { source: 'business', text: 'your business' };
  if (i === 0) return { source: 'name', text: 'there' };
  if (i === 1) return { source: 'business', text: 'your business' };
  return { source: 'text', text: '' };
};

const startingMapping = (t) => ({
  header: Object.fromEntries((t?.variables.header || []).map((k, i) => [k, guess(k, i)])),
  body: Object.fromEntries((t?.variables.body || []).map((k, i) => [k, guess(k, i)])),
});

function TemplateCard({ t, selected, onPick }) {
  return (
    <button
      type="button"
      onClick={() => t.sendable && onPick(t)}
      aria-pressed={selected}
      title={t.reason || ''}
      style={{
        textAlign: 'left', fontFamily: 'inherit', cursor: t.sendable ? 'pointer' : 'not-allowed',
        background: selected ? c.lime + '14' : 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 14px',
        border: '1px solid ' + (selected ? c.lime : c.borderDim), opacity: t.sendable ? 1 : 0.55,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <span style={{ color: selected ? c.lime : c.text, fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>{t.label}</span>
        <Pill text={t.category === 'MARKETING' ? 'marketing' : t.category.toLowerCase()} tint={t.category === 'MARKETING' ? c.cyan : c.muted} />
      </div>
      <div style={{ color: c.muted, fontSize: 12, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {t.body}
      </div>
      {!t.sendable && <div style={{ color: c.amber, fontSize: 11, marginTop: 6 }}>{t.reason}</div>}
    </button>
  );
}

function Blank({ k, where, rule, onChange }) {
  const label = rule.source === 'text' ? 'Text for everyone' : rule.source === 'name' ? 'If there is no name, use' : 'If there is no business, use';
  // Flex, not grid: the dashboard forces every grid to one column on a phone,
  // and these two controls read better side by side wherever they fit.
  return (
    <div style={{ marginBottom: 12 }}>
      <code style={{ color: c.lime, fontSize: 13 }}>{`{{${k}}}`}{where === 'header' ? ' in the title' : ''}</code>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
        <select aria-label={`Fill {{${k}}} from`} value={rule.source} onChange={(e) => onChange({ ...rule, source: e.target.value, text: rule.source === e.target.value ? rule.text : '' })} style={{ ...input, padding: '9px 10px', flex: '1 1 170px', width: 'auto' }}>
          {SOURCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label style={{ flex: '1 1 170px', display: 'grid', gap: 3, fontSize: 11, color: c.muted }}>
          {label}
          <input aria-label={`${label} for {{${k}}}`} value={rule.text} onChange={(e) => onChange({ ...rule, text: e.target.value })} style={{ ...input, padding: '9px 10px' }} />
        </label>
      </div>
    </div>
  );
}

export default function SendMessages({ prospects }) {
  const templatesQ = useProspectTemplates();
  const { send, refreshTemplates } = useProspectingActions();
  const templates = templatesQ.data?.templates ?? NONE;
  const sender = templatesQ.data?.sender || null;

  const [showAll, setShowAll] = useState(false);
  const [tSearch, setTSearch] = useState('');
  const [chosen, setChosen] = useState(null);
  const [mapping, setMapping] = useState({ header: {}, body: {} });
  const [buttonValues, setButtonValues] = useState({});
  const [picked, setPicked] = useState([]);
  const [who, setWho] = useState('new');
  const [cSearch, setCSearch] = useState('');
  const [sendAgain, setSendAgain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [problem, setProblem] = useState('');

  const template = templates.find((t) => t.name === chosen) || null;

  const shownTemplates = useMemo(() => {
    const q = tSearch.trim().toLowerCase();
    return templates
      .filter((t) => showAll || t.category === 'MARKETING')
      .filter((t) => !q || t.label.toLowerCase().includes(q) || t.body.toLowerCase().includes(q));
  }, [templates, showAll, tSearch]);

  const eligible = (p) => sendAgain || !recently(p);
  const shownContacts = useMemo(() => {
    const q = cSearch.trim().toLowerCase();
    return prospects
      .filter((p) => (who === 'new' ? !p.sentAt : true))
      .filter((p) => !q || [p.name, p.phone, p.agencyName].some((v) => v && String(v).toLowerCase().includes(q)));
  }, [prospects, who, cSearch]);

  const pick = (t) => {
    setChosen(t.name);
    setMapping(startingMapping(t));
    setButtonValues({});
    setResult(null);
  };
  const toggle = (id) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX ? prev : [...prev, id]));
  const pickFirst = () => setPicked(shownContacts.filter(eligible).slice(0, MAX).map((p) => p._id));

  const sample = prospects.find((p) => p._id === picked[0]) || null;
  const blanksDone = template && [...Object.entries(mapping.header), ...Object.entries(mapping.body)]
    .every(([, r]) => r.source !== 'text' || r.text.trim())
    && template.urlButtons.every((b) => String(buttonValues[b.index] || '').trim());
  const ready = template && blanksDone && picked.length > 0 && !busy;

  const onSend = async () => {
    if (!ready) return;
    const firstBody = template.body.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (m, k) => valueFor(mapping.body[k], sample) || m);
    const question =
      `Send "${template.label}" to ${picked.length} contact${picked.length === 1 ? '' : 's'} from ${sender?.number || 'the sales number'}?\n\n` +
      `${sample ? `${displayName(sample)} will read:\n` : ''}"${firstBody.slice(0, 280)}${firstBody.length > 280 ? '…' : ''}"\n\n` +
      (template.category === 'MARKETING' ? 'This is a marketing message. Meta can decline some after accepting them; each contact shows what happened.' : '');
    if (!window.confirm(question)) return;
    setBusy(true); setProblem(''); setResult(null);
    try {
      const r = await send({ prospectIds: picked, templateName: template.name, mapping, buttonValues, sendAgain });
      setResult(r);
      setPicked([]);
    } catch (err) {
      setProblem(prospectingError(err));
    } finally {
      setBusy(false);
    }
  };

  if (templatesQ.isPending) return <Empty icon="⏳">Reading the approved templates from Meta…</Empty>;
  if (templatesQ.isError) {
    return (
      <div>
        <Notice tone="error">{prospectingError(templatesQ.error)}</Notice>
        <Button tone="quiet" onClick={() => templatesQ.refetch()}>Try again</Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, alignItems: 'start' }}>
      <div style={{ minWidth: 0 }}>
        <Step n={1} title="Choose a message" done={!!template}
          hint={`${templates.filter((t) => t.sendable).length} approved and ready on ${sender?.number || 'the sales number'}. Only what Meta has approved there can be sent.`}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <input aria-label="Find a template" placeholder="Find a template" value={tSearch} onChange={(e) => setTSearch(e.target.value)} style={{ ...input, flex: '1 1 180px' }} />
            <Button tone="quiet" onClick={() => refreshTemplates().catch((e) => setProblem(prospectingError(e)))}>↻ Refresh</Button>
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: c.muted, marginBottom: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
            Also show utility templates (invoices, alerts). Prospects normally get marketing ones.
          </label>
          <div style={{ display: 'grid', gap: 8, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
            {shownTemplates.length === 0
              ? <Empty icon="🔍">No approved template matches that.</Empty>
              : shownTemplates.map((t) => <TemplateCard key={t.name} t={t} selected={t.name === chosen} onPick={pick} />)}
          </div>
        </Step>

        {template && (template.variables.header.length + template.variables.body.length + template.urlButtons.length > 0) && (
          <Step n={2} title="Fill in the blanks" done={blanksDone} hint="Each contact gets their own name and business where you have them.">
            {template.variables.header.map((k) => (
              <Blank key={'h' + k} k={k} where="header" rule={mapping.header[k]} onChange={(r) => setMapping((m) => ({ ...m, header: { ...m.header, [k]: r } }))} />
            ))}
            {template.variables.body.map((k) => (
              <Blank key={'b' + k} k={k} where="body" rule={mapping.body[k]} onChange={(r) => setMapping((m) => ({ ...m, body: { ...m.body, [k]: r } }))} />
            ))}
            {template.urlButtons.map((b) => (
              <div key={b.index} style={{ marginTop: 6 }}>
                <div style={{ color: c.muted, fontSize: 12, marginBottom: 4 }}>"{b.text}" opens <code style={{ color: c.lime }}>{b.url}</code>. Fill in the end:</div>
                <input aria-label={`Link ending for ${b.text}`} value={buttonValues[b.index] || ''} onChange={(e) => setButtonValues((v) => ({ ...v, [b.index]: e.target.value }))} style={input} />
              </div>
            ))}
          </Step>
        )}

        <Step n={template?.variables && (template.variables.header.length + template.variables.body.length + template.urlButtons.length > 0) ? 3 : 2}
          title="Choose who" done={picked.length > 0}
          hint={`Up to ${MAX} at a time. Anyone who sent STOP is always skipped.`}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {[['new', 'Not messaged yet'], ['all', 'Everyone']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setWho(v)} style={{
                padding: '6px 12px', borderRadius: 999, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
                background: who === v ? c.lime + '1A' : 'transparent', color: who === v ? c.lime : c.muted, border: '1px solid ' + (who === v ? c.lime : c.borderDim),
              }}>{l}</button>
            ))}
            <input aria-label="Find a contact" placeholder="Find by name, number or business" value={cSearch} onChange={(e) => setCSearch(e.target.value)} style={{ ...input, flex: '1 1 160px', padding: '6px 10px', fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: picked.length ? c.lime : c.muted, fontWeight: 600 }}>{picked.length} of {MAX} chosen</span>
            <span style={{ display: 'flex', gap: 6 }}>
              <Button tone="quiet" style={{ padding: '6px 10px', fontSize: 12 }} onClick={pickFirst}>Pick the first {MAX}</Button>
              {picked.length > 0 && <Button tone="quiet" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setPicked([])}>Clear</Button>}
            </span>
          </div>
          <div style={{ border: '1px solid ' + c.borderDim, borderRadius: 10, maxHeight: 300, overflowY: 'auto' }}>
            {shownContacts.length === 0
              ? <div style={{ padding: 20, textAlign: 'center', color: c.muted, fontSize: 13 }}>{who === 'new' ? 'Everyone here has been messaged. Switch to Everyone, or add contacts.' : 'No contacts match.'}</div>
              : shownContacts.map((p) => {
                const can = eligible(p);
                const on = picked.includes(p._id);
                return (
                  <label key={p._id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: '1px solid ' + c.borderDim,
                    cursor: can ? 'pointer' : 'not-allowed', background: on ? c.lime + '0D' : 'transparent', opacity: can ? 1 : 0.5,
                  }}>
                    <input type="checkbox" aria-label={`Choose ${displayName(p)}`} checked={on} disabled={!can} onChange={() => toggle(p._id)} style={{ accentColor: c.lime }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text }}>{displayName(p)}</span>
                      <span style={{ display: 'block', fontSize: 11, color: c.muted }}>{p.phone}{p.agencyName ? ' · ' + p.agencyName : ''}</span>
                    </span>
                    {p.sentAt && <span style={{ fontSize: 11, color: recently(p) ? c.amber : c.muted }}>messaged {day(p.sentAt)}</span>}
                  </label>
                );
              })}
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: c.muted, marginTop: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={sendAgain} onChange={(e) => setSendAgain(e.target.checked)} />
            Send again to people messaged in the last {RESEND_DAYS} days
          </label>
        </Step>
      </div>

      <div style={{ position: 'sticky', top: 16, minWidth: 0 }}>
        {sender && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap', fontSize: 12, color: c.muted }}>
            Sending from <strong style={{ color: c.text }}>{sender.number}</strong>{sender.name ? ` · ${sender.name}` : ''}
            {sender.quality && <Pill text={`quality ${sender.quality.toLowerCase()}`} tint={sender.quality === 'GREEN' ? c.emerald : sender.quality === 'YELLOW' ? c.amber : c.red} />}
          </div>
        )}
        {template
          ? <MessagePreview template={template} mapping={mapping} contact={sample} senderName={sender?.name} />
          : <Empty icon="💬">Choose a message to see it as your contact will.</Empty>}

        <div style={{ marginTop: 14 }}>
          {problem && <Notice tone="error">{problem}</Notice>}
          <Button onClick={onSend} disabled={!ready} style={{ width: '100%', padding: 14, fontSize: 15 }}>
            {busy ? 'Sending…' : picked.length ? `Review and send to ${picked.length}` : 'Choose a message and contacts'}
          </Button>
        </div>

        {result && (
          <div style={{ marginTop: 14 }}>
            <Notice tone={result.failed.length ? 'warn' : 'ok'}>
              {`Meta accepted ${result.sent.length}. ${result.skipped.length ? `${result.skipped.length} skipped. ` : ''}${result.failed.length ? `${result.failed.length} failed.` : ''}\nWhether each one arrived shows on the contact as Meta reports it.`}
            </Notice>
            {[...result.skipped.map((s) => [s, s.reason, c.amber]), ...result.failed.map((f) => [f, f.error, c.red])].map(([x, why, tint]) => (
              <div key={x.id} style={{ fontSize: 12, color: tint, margin: '4px 0' }}><strong>{x.name}</strong>: {why}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
