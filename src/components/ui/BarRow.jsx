// One labelled bar with its figure: the row LadderConversion and SalesFunnel
// each drew for themselves.
//
// pct === null means "never offered" and renders "—"; 0 means "offered and
// nobody took it". Those are different findings (LadderConversion's header
// says why) and must never look alike, so an unknown row draws no bar at all.
//
// `value` is the bold figure; it defaults to the percentage. `meta` is one
// note, or an array of notes that each get their own column so they line up
// down the rows.
//
// Every class is written out whole in a lookup: Tailwind only builds classes
// it can read complete in the source, so `text-${tone}` would never exist.
const FILL = { lime: 'bg-lime', cyan: 'bg-cyan', amber: 'bg-amber', emerald: 'bg-emerald' };
const TEXT = { lime: 'text-lime', cyan: 'text-cyan', amber: 'text-amber', emerald: 'text-emerald', ink: 'text-ink', muted: 'text-muted' };

export default function BarRow({ label, pct, value, valueTone, meta, tone = 'lime', emphasis = false }) {
  const unknown = pct === null || pct === undefined;
  const figure = value ?? (unknown ? '—' : `${pct}%`);
  const figureTone = unknown ? 'text-muted' : TEXT[valueTone ?? tone];
  const notes = meta === undefined ? [] : Array.isArray(meta) ? meta : [meta];

  return (
    <div className={`flex items-center gap-[11px] py-[7px] ${emphasis ? '-mx-[18px] bg-amber/5 px-[18px]' : ''}`}>
      <span className={`flex-[0_0_120px] text-[12.5px] ${unknown ? 'text-muted' : 'text-ink'}`}>
        {label}
      </span>
      <div className="h-2 min-w-[30px] flex-1 overflow-hidden rounded-full bg-white/5">
        {!unknown && <div className={`h-full rounded-full ${FILL[tone]}`} style={{ width: `${pct}%` }} />}
      </div>
      <span className={`flex-[0_0_38px] text-right font-mono text-xs font-bold tabular-nums ${figureTone}`}>
        {figure}
      </span>
      {notes.map((note, i) => (
        <span
          key={i}
          className={`${notes.length === 1 ? 'flex-[0_0_96px]' : 'flex-[0_0_50px]'} text-right font-mono text-[11px] tabular-nums text-muted`}
        >
          {note}
        </span>
      ))}
    </div>
  );
}
