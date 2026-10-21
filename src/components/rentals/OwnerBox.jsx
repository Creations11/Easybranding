import { colors as c } from '../../utils/theme';
import { useRentalsActions } from '../../hooks/useRentalsModeration';
import { useAct } from './useAct';
import { whatsapp, when, btn, askReason } from './helpers';
import { Result } from './ui';

export default function OwnerBox({ owner, ownerSuspended }) {
  const { suspend, reinstate } = useRentalsActions();
  const { busy, result, act } = useAct();
  if (!owner) return <p style={{ fontSize: 12, color: c.red }}>The landlord's account could not be found.</p>;

  const onSuspend = () => {
    const reason = askReason(`Why are you suspending ${owner.fullName}? They are signed out at once and all their listings leave the site.`);
    if (reason) act(() => suspend(owner.id, reason), `${owner.fullName} is suspended. Their listings are off the site.`);
  };
  const onReinstate = () => {
    if (!window.confirm(`Reinstate ${owner.fullName}? Their listings come back as they were.`)) return;
    act(() => reinstate(owner.id), `${owner.fullName} is reinstated.`);
  };

  return (
    <div style={{ marginTop: 12, padding: 12, background: c.surface, borderRadius: 10, fontSize: 13 }}>
      <div style={{ color: c.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Landlord</div>
      <div style={{ color: c.text, fontWeight: 600 }}>
        {owner.fullName}
        {!owner.isActive && <span style={{ marginLeft: 8, fontSize: 11, color: c.red }}>suspended</span>}
      </div>
      <div style={{ color: c.muted, marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <a href={`mailto:${owner.email}`} style={{ color: c.cyan }}>{owner.email}</a>
        <a href={`tel:${owner.phone}`} style={{ color: c.cyan }}>{owner.phone}</a>
        <a href={whatsapp(owner.phone)} target="_blank" rel="noopener noreferrer" style={{ color: c.cyan }}>WhatsApp</a>
        <span>joined {when(owner.joinedAt)}</span>
      </div>
      <div style={{ marginTop: 8 }}>
        {owner.isActive
          ? <button onClick={onSuspend} disabled={busy} style={btn(c.red, busy)}>Suspend landlord</button>
          : <button onClick={onReinstate} disabled={busy} style={btn(c.emerald, busy)}>Reinstate landlord</button>}
        {ownerSuspended && owner.isActive && <span style={{ marginLeft: 8, fontSize: 12, color: c.amber }}>Listing hidden while the account was suspended.</span>}
      </div>
      <Result result={result} />
    </div>
  );
}
