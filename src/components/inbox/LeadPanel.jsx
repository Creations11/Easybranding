// The right pane of the inbox: who this is and where the sale stands, so you
// can move the stage or leave a note without leaving the conversation. The
// full record (follow-ups, close, spam) is one tap away in LeadDetailModal.
import { useState } from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useLeadNotes, useCrmActions, crmError } from '../../hooks/useCrm';
import { STAGE_LABEL, INTENT, ago, day, nextStagesFor, isOpen } from '../crm/crmHelpers';

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-3 py-1 text-[13px]">
    <span className="text-muted">{label}</span>
    <span className="text-right text-ink">{children}</span>
  </div>
);

export default function LeadPanel({ lead, now, onOpenRecord, onClose }) {
  const notes = useLeadNotes(lead?.id);
  const crm = useCrmActions();
  const [note, setNote] = useState('');
  const [stage, setStage] = useState('');
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState(null);

  if (!lead) return null;
  const next = isOpen(lead) ? nextStagesFor(lead.stage) : [];
  const intent = lead.intent && INTENT[lead.intent];

  const run = async (fn, ok) => {
    setBusy(true);
    setSaid(null);
    try { await fn(); setSaid({ tone: 'good', text: ok }); return true; }
    catch (e) { setSaid({ tone: 'bad', text: crmError(e) }); return false; }
    finally { setBusy(false); }
  };

  const move = () => stage && run(() => crm.moveStage(lead.id, stage), `Moved to ${STAGE_LABEL[stage] || stage}.`).then((ok) => ok && setStage(''));
  const addNote = () => note.trim() && run(() => crm.addNote(lead.id, note.trim()), 'Note saved.').then((ok) => ok && setNote(''));

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-y-auto bg-surface p-4" aria-label="About this lead">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{lead.name || lead.phone}</p>
          {lead.business && <p className="truncate text-xs text-cyan">{lead.business}</p>}
        </div>
        {onClose && <button type="button" onClick={onClose} aria-label="Close details" className="min-h-10 min-w-10 cursor-pointer text-xl text-muted">×</button>}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <Badge tone="system">{STAGE_LABEL[lead.stage] || lead.stage || 'New'}</Badge>
        {intent && <Badge tone={lead.intent === 'hot' ? 'bad' : lead.intent === 'warm' ? 'warn' : 'neutral'}>{intent.icon} {intent.label}</Badge>}
        {lead.waitingSince && <Badge tone="warn">waiting {ago(lead.waitingSince, now)}</Badge>}
        {lead.takenOver && <Badge tone="live">you're replying</Badge>}
        {lead.fromAd && <Badge>from an ad</Badge>}
      </div>

      <div className="mb-4 border-y border-edge py-1.5">
        <Row label="Number"><a href={`tel:${lead.phone}`} className="font-mono text-ink no-underline">{lead.phone}</a></Row>
        <Row label="Messages"><span className="font-mono tabular-nums">{lead.messageCount}</span></Row>
        <Row label="Follow-up">{lead.followUpAt ? `${day(lead.followUpAt)}${lead.followUpReason ? ` · ${lead.followUpReason}` : ''}` : 'none set'}</Row>
        {lead.assignedTo && <Row label="Assigned">{lead.assignedTo}</Row>}
        <Row label="First message">{day(lead.createdAt)}</Row>
      </div>

      {next.length > 0 && (
        <div className="mb-4">
          <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Move the sale on</p>
          <div className="flex gap-2">
            <select value={stage} onChange={(e) => setStage(e.target.value)} aria-label="Next stage"
              className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-white/12 bg-ground px-3 text-sm text-ink focus:border-lime focus:outline-none">
              <option value="">Choose a stage…</option>
              {next.map((s) => <option key={s} value={s}>{STAGE_LABEL[s] || s}</option>)}
            </select>
            <Button variant="live" onClick={move} disabled={!stage || busy}>Move</Button>
          </div>
        </div>
      )}

      <div className="mb-3">
        <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Notes</p>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Only your team sees notes."
          aria-label="New note"
          className="w-full resize-y rounded-lg border border-white/12 bg-ground px-3 py-2 text-sm text-ink focus:border-lime focus:outline-none" />
        <Button variant="secondary" className="mt-1.5" onClick={addNote} disabled={!note.trim() || busy}>Save note</Button>
      </div>

      {said && <p role="status" className={`mb-3 text-xs ${said.tone === 'good' ? 'text-emerald' : 'text-red'}`}>{said.text}</p>}

      <div className="mb-4 space-y-2">
        {notes.isPending && <p className="text-xs text-muted">Loading notes…</p>}
        {notes.data?.length === 0 && <p className="text-xs text-muted">No notes yet.</p>}
        {notes.data?.map((n) => (
          <div key={n.id} className="rounded-lg bg-raise px-3 py-2">
            <p className="whitespace-pre-wrap break-words text-[13px] text-ink">{n.text}</p>
            <p className="mt-1 text-[11px] text-muted">{n.by ? `${n.by} · ` : ''}{day(n.at)}</p>
          </div>
        ))}
      </div>

      <Button variant="secondary" className="mt-auto w-full" onClick={onOpenRecord}>Open the full record</Button>
    </aside>
  );
}
