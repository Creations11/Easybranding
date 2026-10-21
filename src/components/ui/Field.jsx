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
// A background passed in className replaces the default rather than joining
// it: with two bg- classes on one element, which wins is decided by the order
// of the generated stylesheet, not by which one the caller passed.
const control = (mono, className) =>
  `min-h-[44px] w-full rounded-lg border border-white/12 px-3.5 text-sm text-ink focus:border-lime focus:outline-none ${/(^|\s)bg-/.test(className) ? '' : 'bg-ground'} ${mono ? 'font-mono' : ''} ${className}`;

export function Input({ mono = true, className = '', ...props }) {
  return <input {...props} className={control(mono, className)} />;
}

export function Select({ mono = false, className = '', children, ...props }) {
  return <select {...props} className={control(mono, className)}>{children}</select>;
}
