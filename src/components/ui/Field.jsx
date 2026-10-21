export default function Field({ id, label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-dim">{label}</label>
      {children}
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </div>
  );
}

// Mono by default: most console inputs hold numbers, phones and codes. Pass
// mono={false} for names and addresses, which read badly in a code face.
const control = (mono, className) =>
  `min-h-[44px] w-full rounded-lg border border-white/12 bg-ground px-3.5 text-sm text-ink focus:border-lime focus:outline-none ${mono ? 'font-mono' : ''} ${className}`;

export function Input({ mono = true, className = '', ...props }) {
  return <input {...props} className={control(mono, className)} />;
}

export function Select({ mono = false, className = '', children, ...props }) {
  return <select {...props} className={control(mono, className)}>{children}</select>;
}
