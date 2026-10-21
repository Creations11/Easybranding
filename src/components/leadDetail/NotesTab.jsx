import { useState } from 'react';
import { useCrmActions, useLeadNotes, crmError } from '../../hooks/useCrm';
import Button from '../ui/Button';
import { Textarea } from '../ui/Field';

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
        <div className="mb-3 rounded-[10px] border border-amber/20 bg-amber/7 px-3 py-2.5 text-xs text-amber">
          A note saved only in this browser: “{legacy.slice(0, 160)}{legacy.length > 160 ? '…' : ''}”
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="warn" onClick={() => save(legacy, () => { forgetLocalNote(leadId); setLegacy(null); })} disabled={busy}>Save it for everyone</Button>
            <Button variant="ghost" onClick={() => { forgetLocalNote(leadId); setLegacy(null); }}>Discard</Button>
          </div>
        </div>
      )}
      <Textarea
        aria-label="New note"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What happened, what was agreed, what to do next…"
        rows={4}
        className="bg-ground"
      />
      <div className="mt-2 mb-3.5 flex items-center justify-between gap-2">
        <span className={`text-[11px] ${problem ? 'text-red' : 'text-muted'}`}>{problem || 'Everyone who can see this lead sees its notes.'}</span>
        <Button variant="primary" onClick={() => save(text, () => setText(''))} disabled={busy || !text.trim()}>
          {busy ? 'Saving…' : 'Add note'}
        </Button>
      </div>
      {notesQ.isPending ? <p className="text-[13px] text-muted">Loading notes…</p>
        : (notesQ.data || []).length === 0 ? <p className="text-[13px] text-muted">No notes yet.</p>
          : notesQ.data.map((n) => (
            <div key={n.id} className="mb-2 rounded-[10px] bg-ground px-3 py-2.5">
              <div className="whitespace-pre-wrap text-[13px] text-ink [overflow-wrap:anywhere]">{n.text}</div>
              <div className="mt-1 text-[11px] text-muted">{n.by || 'staff'} · {new Date(n.at).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          ))}
    </div>
  );
}
