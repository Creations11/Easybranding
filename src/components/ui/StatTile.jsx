// One figure with its label and a note: MoneyPanel's old tile() helper.
// Figures are mono with tabular digits so they compare down a column.
const NOTE_TONE = {
  muted: 'text-muted',
  good: 'text-sage',
  warn: 'text-amber',
  bad: 'text-red',
};

// What the figure itself means, when a strip colours each one (the admin
// dashboard's stats). Whole class names, so Tailwind can see them.
const VALUE_TONE = {
  ink: 'text-ink', lime: 'text-lime', cyan: 'text-cyan', red: 'text-red',
  amber: 'text-amber', emerald: 'text-emerald', muted: 'text-muted', earth: 'text-earth',
};

export default function StatTile({ label, value, note, noteTone = 'muted', highlight = false, tone }) {
  return (
    <div
      className={`flex min-w-[150px] flex-1 basis-[160px] flex-col gap-1.5 rounded-card border bg-card px-[17px] py-[15px] ${
        highlight ? 'border-edge-live' : 'border-edge'
      }`}
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      <span
        className={`font-mono text-[25px] font-bold leading-[1.05] tabular-nums ${
          tone ? VALUE_TONE[tone] : highlight ? 'text-lime' : 'text-ink'
        }`}
      >
        {value}
      </span>
      {note && <span className={`text-xs ${NOTE_TONE[noteTone]}`}>{note}</span>}
    </div>
  );
}
