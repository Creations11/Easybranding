// A titled block on a dashboard: replaces the <h3> + wrapper that MoneyPanel,
// SalesFunnel, LadderConversion and others each hand-rolled.
export default function Panel({ title, meta, children, className = '' }) {
  return (
    <section className={`mb-[18px] ${className}`}>
      {(title || meta) && (
        <div className="mb-2.5 flex flex-wrap items-baseline gap-2.5">
          {title && <h3 className="m-0 text-sm font-bold text-ink">{title}</h3>}
          {meta && <span className="text-xs text-muted">{meta}</span>}
        </div>
      )}
      {children}
    </section>
  );
}
