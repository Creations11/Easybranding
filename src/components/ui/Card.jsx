const BORDER = {
  default: 'border-edge',
  live: 'border-edge-live',
  warn: 'border-amber/30',
  bad: 'border-red/30',
};

export default function Card({ children, tone = 'default', className = '' }) {
  return (
    <div className={`rounded-card border bg-surface ${BORDER[tone]} ${className}`}>
      {children}
    </div>
  );
}
