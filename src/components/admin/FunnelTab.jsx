// A stage's bar: qualified lime, not qualified red, every other stage cyan.
const FILL = (stage) => (stage === 'qualified' ? 'bg-lime' : stage === 'not_qualified' ? 'bg-red' : 'bg-cyan');

export default function FunnelTab({ stages }) {
  return (
    <div>
      <h2 className="mb-5 text-xl">Pipeline Funnel</h2>
      <div className="flex flex-col gap-2">
        {stages.map((stage, i) => (
          <div key={i} className="rounded-xl border border-edge bg-card px-[18px] py-3.5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">{stage.label}</span>
              <span className="font-mono text-[13px] tabular-nums text-muted">{stage.count} leads · {stage.percentage}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className={`h-full rounded-full transition-[width] duration-500 ${FILL(stage.stage)}`} style={{ width: `${stage.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
