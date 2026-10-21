// A table that scrolls inside its own box on a phone instead of widening the
// page. Alignment goes through a lookup: Tailwind only generates classes it
// can read whole in the source, so `text-${align}` would never be built.
const ALIGN = { left: 'text-left', right: 'text-right' };

export function Th({ align = 'left', children }) {
  return (
    <th
      scope="col"
      className={`border-b border-edge px-5 py-[11px] font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted ${ALIGN[align] ?? ALIGN.left}`}
    >
      {children}
    </th>
  );
}

export function Td({ align = 'left', mono = false, className = '', children }) {
  return (
    <td
      className={`border-b border-white/5 px-5 py-[13px] text-sm ${align === 'right' ? 'text-right' : ''} ${mono ? 'font-mono tabular-nums' : ''} ${className}`}
    >
      {children}
    </td>
  );
}

export default function DataTable({ minWidth = 640, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth }}>{children}</table>
    </div>
  );
}
