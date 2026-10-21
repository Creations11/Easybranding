import Button from '../ui/Button';
import { useRentalsActions } from '../../hooks/useRentalsModeration';
import { useAct } from './useAct';
import { whatsapp, when, askReason } from './helpers';
import { Result } from './ui';

export default function OwnerBox({ owner, ownerSuspended }) {
  const { suspend, reinstate } = useRentalsActions();
  const { busy, result, act } = useAct();
  if (!owner) return <p className="text-xs text-red">The landlord's account could not be found.</p>;

  const onSuspend = () => {
    const reason = askReason(`Why are you suspending ${owner.fullName}? They are signed out at once and all their listings leave the site.`);
    if (reason) act(() => suspend(owner.id, reason), `${owner.fullName} is suspended. Their listings are off the site.`);
  };
  const onReinstate = () => {
    if (!window.confirm(`Reinstate ${owner.fullName}? Their listings come back as they were.`)) return;
    act(() => reinstate(owner.id), `${owner.fullName} is reinstated.`);
  };

  return (
    <div className="mt-3 rounded-[10px] bg-surface p-3 text-[13px]">
      <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Landlord</div>
      <div className="font-semibold text-ink">
        {owner.fullName}
        {!owner.isActive && <span className="ml-2 text-[11px] text-red">suspended</span>}
      </div>
      <div className="mt-0.5 flex flex-wrap gap-3 text-muted">
        <a href={`mailto:${owner.email}`} className="text-cyan">{owner.email}</a>
        <a href={`tel:${owner.phone}`} className="font-mono text-cyan">{owner.phone}</a>
        <a href={whatsapp(owner.phone)} target="_blank" rel="noopener noreferrer" className="text-cyan">WhatsApp</a>
        <span>joined {when(owner.joinedAt)}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {owner.isActive
          ? <Button variant="danger" onClick={onSuspend} disabled={busy}>Suspend landlord</Button>
          : <Button variant="good" onClick={onReinstate} disabled={busy}>Reinstate landlord</Button>}
        {ownerSuspended && owner.isActive && <span className="text-xs text-amber">Listing hidden while the account was suspended.</span>}
      </div>
      <Result result={result} />
    </div>
  );
}
