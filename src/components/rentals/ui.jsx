import Button from '../ui/Button';

const RESULT = {
  good: 'border-emerald/20 bg-emerald/8 text-emerald',
  bad: 'border-red/20 bg-red/8 text-red',
};

/** What an action did, under the card it was done on. */
export function Result({ result }) {
  if (!result) return null;
  return (
    <div role="status" className={`mt-2.5 rounded-lg border px-3 py-2 text-[13px] ${RESULT[result.tone]}`}>
      {result.text}
    </div>
  );
}

/**
 * The temporary password the API made, shown once. Staff give it to the
 * person; it is not stored anywhere this screen can show it again.
 */
export function TemporaryPassword({ who, password, onDone }) {
  return (
    <div role="status" className="mt-2.5 rounded-lg border border-lime/25 bg-lime/8 px-3 py-2.5 text-[13px] text-ink">
      <div>Temporary password for {who}. Give it to them now: it is not shown again.</div>
      <code data-testid="temporary-password" className="mt-1.5 inline-block select-all font-mono text-[15px] font-bold text-lime">{password}</code>
      <div className="mt-2"><Button variant="ghost" onClick={onDone}>Done</Button></div>
    </div>
  );
}

/** One record on the screen: a listing or an account. */
export const Sheet = ({ className = '', ...props }) => (
  <div {...props} className={`mb-3 rounded-xl border border-edge bg-card px-4 py-3.5 ${className}`} />
);
