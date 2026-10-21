export default function Field({ id, label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-dim">{label}</label>
      {children}
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`min-h-[44px] w-full rounded-lg border border-white/12 bg-ground px-3.5 font-mono text-sm text-ink focus:border-lime focus:outline-none ${className}`}
    />
  );
}
