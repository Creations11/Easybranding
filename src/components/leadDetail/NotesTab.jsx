import { useState } from 'react';
import { useCrmActions, useLeadNotes, crmError } from '../../hooks/useCrm';
import { t } from './tokens';

// ── Notes ─────────────────────────────────────────────────────
// Shared since 2026-10-08 (POST /admin-ops/crm/leads/:id/notes): everyone who
// can see the lead sees them, with who wrote each and when. Before that they
// lived in one browser's localStorage and nobody else ever read them; any
// such note still on this device is offered for saving once (see NotesTab).
const OLD_NOTES_KEY = 'eb_lead_notes';
const oldLocalNote = (leadId) => {
  try { return JSON.parse(localStorage.getItem(OLD_NOTES_KEY) || '{}')[leadId]?.text || null; } catch { return null; }
};
const forgetLocalNote = (leadId) => {
  try {
    const all = JSON.parse(localStorage.getItem(OLD_NOTES_KEY) || '{}');
    delete all[leadId];
    localStorage.setItem(OLD_NOTES_KEY, JSON.stringify(all));
  } catch { /* nothing to forget */ }
};

export default function NotesTab({ leadId }) {
  const notesQ = useLeadNotes(leadId);
  const { addNote } = useCrmActions();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [legacy, setLegacy] = useState(() => oldLocalNote(leadId));

  const save = async (body, after) => {
    setBusy(true); setProblem('');
    try { await addNote(leadId, body); after?.(); } catch (err) { setProblem(crmError(err)); } finally { setBusy(false); }
  };

  return (
    <div>
      {legacy && (
        <div style={{ background: `${t.amber}12`, border: `1px solid ${t.amber}33`, borderRadius: 10, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: t.amber }}>
          A note saved only in this browser: “{legacy.slice(0, 160)}{legacy.length > 160 ? '…' : ''}”
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button onClick={() => save(legacy, () => { forgetLocalNote(leadId); setLegacy(null); })} disabled={busy} style={{ padding: '6px 12px', background: t.amber, color: '#080A06', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Save it for everyone</button>
            <button onClick={() => { forgetLocalNote(leadId); setLegacy(null); }} style={{ padding: '6px 12px', background: 'transparent', color: t.muted, border: `1px solid ${t.borderDim}`, borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Discard</button>
          </div>
        </div>
      )}
      <textarea
        aria-label="New note"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What happened, what was agreed, what to do next…"
        rows={4}
        style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: t.surface, border: `1px solid ${t.borderDim}`, borderRadius: '10px', color: t.text, fontSize: '14px', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 14px', gap: 8 }}>
        <span style={{ color: problem ? t.red : t.muted, fontSize: 11 }}>{problem || 'Everyone who can see this lead sees its notes.'}</span>
        <button onClick={() => save(text, () => setText(''))} disabled={busy || !text.trim()} style={{ padding: '8px 18px', background: text.trim() ? t.lime : `${t.lime}44`, color: '#080A06', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: text.trim() ? 'pointer' : 'not-allowed', fontSize: '13px' }}>
          {busy ? 'Saving…' : 'Add note'}
        </button>
      </div>
      {notesQ.isPending ? <p style={{ color: t.muted, fontSize: 13 }}>Loading notes…</p>
        : (notesQ.data || []).length === 0 ? <p style={{ color: t.muted, fontSize: 13 }}>No notes yet.</p>
          : notesQ.data.map((n) => (
            <div key={n.id} style={{ background: t.surface, borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
              <div style={{ color: t.text, fontSize: 13, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{n.text}</div>
              <div style={{ color: t.muted, fontSize: 11, marginTop: 4 }}>{n.by || 'staff'} · {new Date(n.at).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          ))}
    </div>
  );
}
