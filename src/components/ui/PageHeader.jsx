// A section's title and one line under it, with its actions on the right.
// The console's sections all opened with the same Fraunces heading, written
// out by hand in each one.
export default function PageHeader({ title, sub, children }) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="mb-1 font-['Fraunces',serif] text-[clamp(24px,4vw,40px)] font-black">{title}</h1>
        {sub && <p className="text-[15px] text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
