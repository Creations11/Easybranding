// min-h-[44px] is the accessible touch-target floor. Do not shrink it.
const VARIANT = {
  primary:   'bg-lime text-ground font-bold border-transparent',
  secondary: 'bg-transparent text-ink font-semibold border-white/15',
  danger:    'bg-red/10 text-red font-semibold border-red/30',
  warn:      'bg-amber/10 text-amber font-bold border-amber/35',
  good:      'bg-emerald/10 text-emerald font-semibold border-emerald/30',
  live:      'bg-lime/10 text-lime font-semibold border-lime/30',   // a lime action that is not the page's main one
  system:    'bg-cyan/10 text-cyan font-semibold border-cyan/25',
  attention: 'bg-orange/10 text-orange font-semibold border-orange/30',  // a person stepping in: take over, not spam
  ghost:     'bg-transparent text-muted font-semibold border-transparent hover:bg-raise',
};

export default function Button({ variant = 'secondary', className = '', ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border px-[18px] text-[13px] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT[variant]} ${className}`}
    />
  );
}
