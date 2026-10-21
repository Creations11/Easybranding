// min-h-[44px] is the accessible touch-target floor. Do not shrink it.
const VARIANT = {
  primary:   'bg-lime text-ground font-bold border-transparent',
  secondary: 'bg-transparent text-ink font-semibold border-white/15',
  danger:    'bg-red/10 text-red font-semibold border-red/30',
  warn:      'bg-amber/10 text-amber font-bold border-amber/35',
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
