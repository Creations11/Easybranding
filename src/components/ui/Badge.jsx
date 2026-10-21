const TONE = {
  good:    'bg-emerald/12 border-emerald/30 text-emerald',
  live:    'bg-lime/12 border-lime/30 text-lime',
  warn:    'bg-amber/12 border-amber/30 text-amber',
  bad:     'bg-red/12 border-red/30 text-red',
  system:  'bg-cyan/12 border-cyan/30 text-cyan',
  neutral: 'bg-muted/10 border-white/10 text-muted',
};

export default function Badge({ tone = 'neutral', dot = false, mono = false, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-[11px] py-[5px] text-xs font-semibold ${TONE[tone]} ${mono ? 'font-mono' : ''}`}
    >
      {dot && <span className="h-[5px] w-[5px] rounded-full bg-current" />}
      {children}
    </span>
  );
}
