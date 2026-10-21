// The client modal's headings and labels.

/** A lime section heading: "Business Details", "Plan & Status"… */
export const SectionTitle = ({ children, className = '' }) => (
  <p className={`mb-3 mt-4 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-lime ${className}`}>{children}</p>
);

export const Label = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="mb-1.5 block text-xs text-muted">{children}</label>
);

/** A line of help under a label. */
export const Hint = ({ children }) => <p className="mb-2 text-xs text-muted">{children}</p>;
