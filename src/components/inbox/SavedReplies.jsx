// Saved replies above the message box: tap one and it goes into the box for
// you to read and send, never straight to the customer. "Save" keeps what is
// in the box as a new one; "Edit" lets you remove them.
import { useState } from 'react';

export default function SavedReplies({ saved, current, onPick }) {
  const [editing, setEditing] = useState(false);
  const typed = current.trim();
  const canSave = typed && !saved.replies.includes(typed);
  if (!saved.replies.length && !canSave) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-2.5 pt-2" aria-label="Saved replies">
      {saved.replies.map((r) => (
        <span key={r} className="inline-flex max-w-[240px] shrink-0 items-center rounded-full border border-edge bg-raise text-xs text-ink">
          <button type="button" onClick={() => onPick(r)} title={r}
            className="min-h-[44px] cursor-pointer truncate px-3 text-left">{r}</button>
          {editing && (
            <button type="button" onClick={() => saved.remove(r)} aria-label={`Delete saved reply: ${r}`}
              className="min-h-[44px] cursor-pointer pr-3 pl-1 text-red">×</button>
          )}
        </span>
      ))}
      {canSave && (
        <button type="button" onClick={() => saved.add(typed)}
          className="min-h-[44px] shrink-0 cursor-pointer rounded-full border border-dashed border-lime/40 px-3 text-xs text-lime">
          + Save this reply
        </button>
      )}
      {saved.replies.length > 0 && (
        <button type="button" onClick={() => setEditing((e) => !e)}
          className="min-h-[44px] shrink-0 cursor-pointer px-2 text-xs text-muted underline">
          {editing ? 'Done' : 'Edit'}
        </button>
      )}
    </div>
  );
}
