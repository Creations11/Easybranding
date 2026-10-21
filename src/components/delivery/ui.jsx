// The small pieces every section of the delivery tab is drawn with. Status
// chips are ui/Badge, buttons ui/Button and inputs ui/Field's Input/Select;
// what is here is particular to this tab.

export const Card = ({ children, onClick, active }) => {
  // Clickable cards are real buttons to the keyboard and to screen readers.
  // The target check keeps Enter on an inner link from also toggling the card.
  const key = onClick
    ? (e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      }
    : undefined;
  return (
    <div
      onClick={onClick}
      onKeyDown={key}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-expanded={onClick ? !!active : undefined}
      className={`mb-2.5 rounded-xl border bg-card p-3.5 ${active ? 'border-lime' : 'border-edge'} ${onClick ? 'cursor-pointer hover:bg-raise' : ''}`}
    >{children}</div>
  );
};

/** A card's name and its status, on one line. */
export const CardHead = ({ title, children }) => (
  <div className="flex items-center justify-between gap-2.5">
    <div className="text-sm font-semibold text-ink">{title}</div>
    {children}
  </div>
);

/** Says what is actually true, rather than "no data". */
export const Empty = ({ children }) => (
  <div className="rounded-xl border border-dashed border-edge px-3.5 py-7 text-center text-[13px] text-muted">
    {children}
  </div>
);

/** A label and its value. `mono` for figures, so they line up down a card. */
export const Row = ({ left, right, mono = false }) => (
  <div className="my-[3px] flex justify-between gap-3 text-[13px]">
    <span className="text-muted">{left}</span>
    <span className={`text-right text-ink ${mono ? 'font-mono tabular-nums' : ''}`}>{right}</span>
  </div>
);

const SAID_TONE = { good: 'text-emerald', bad: 'text-red' };

export const Said = ({ result }) => (result ? (
  <div role="status" className={`mt-2 whitespace-pre-wrap break-words text-xs ${SAID_TONE[result.tone]}`}>{result.text}</div>
) : null);

export const Field = ({ label, children }) => (
  <label className="grid gap-1 text-xs text-muted">{label}{children}</label>
);

// A section or filter choice. Selected reads in its tone; the rest are quiet.
const PILL_ON = {
  lime: 'border-lime bg-lime/10 text-lime font-semibold',
  red: 'border-red bg-red/10 text-red font-semibold',
};

export const Pill = ({ selected = false, tone = 'lime', className = '', ...props }) => (
  <button
    type="button"
    {...props}
    className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-full border px-3.5 text-[13px] ${
      selected ? PILL_ON[tone] : 'border-edge bg-transparent text-muted hover:bg-raise'
    } ${className}`}
  />
);
