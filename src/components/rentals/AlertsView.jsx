import { useState } from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useRentalAlerts, useRentalsActions, rentalsErrorMessage } from '../../hooks/useRentalsModeration';
import { useAct } from './useAct';
import { when, whatsapp, rand, TYPE } from './helpers';
import { Result, Sheet } from './ui';

// WhatsApp search alerts: people who asked to be told when a place like the
// one they searched for is listed (backend services/rentals/alerts.js and
// alertSender.js). Staff see who, what they asked for, and what they were
// told, and can take someone off when they ask by phone or email.

const SHOWING = [
  { id: 'active', label: 'Active' },
  { id: 'removed', label: 'Stopped' },
];

/** The search in words: "Ext 3 · backroom · up to R3,000 · 1+ bed · furnished". */
const searchWords = (c = {}) => [
  c.extension,
  c.propertyType && (TYPE[c.propertyType] || c.propertyType),
  c.maxRent && `up to ${rand(c.maxRent)}`,
  c.minBedrooms && `${c.minBedrooms}+ bed`,
  c.furnished && 'furnished',
].filter(Boolean).join(' · ') || 'anything in Fleurhof';

function AlertRow({ alert }) {
  const { removeAlert } = useRentalsActions();
  const { busy, result, act } = useAct();
  const who = alert.firstName || alert.phone;
  const onRemove = () => {
    if (!window.confirm(`Stop ${who}'s alert? They get no more messages about this search.`)) return;
    act(() => removeAlert(alert.id), `${who}'s alert is stopped.`);
  };
  return (
    <Sheet data-testid={`alert-${alert.id}`}>
      <div className="flex flex-wrap justify-between gap-2.5">
        <div>
          <span className="font-bold text-ink">{alert.firstName || 'No name given'}</span>{' '}
          <a href={whatsapp(alert.phone)} target="_blank" rel="noopener noreferrer" className="ml-1 font-mono text-xs text-emerald underline">{alert.phone}</a>
        </div>
        <span className="font-mono text-xs tabular-nums text-muted">
          {alert.matched} matched · {alert.told} sent
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
        <span className="text-dim">{searchWords(alert.criteria)}</span>
        <span>since {when(alert.createdAt)}</span>
        {alert.lastToldAt && <span>last sent {when(alert.lastToldAt)}</span>}
        {alert.removedAt && <span>stopped {when(alert.removedAt)}</span>}
      </div>
      {alert.status === 'active' && (
        <div className="mt-2">
          <Button variant="danger" onClick={onRemove} disabled={busy}>Stop alert</Button>
        </div>
      )}
      <Result result={result} />
    </Sheet>
  );
}

export default function AlertsView() {
  const [showing, setShowing] = useState('active');
  const { data, isLoading, isError, error } = useRentalAlerts(showing);
  return (
    <div>
      {data && (
        <Sheet className="flex flex-wrap items-center gap-3">
          {data.sending.on
            ? <Badge tone="good" dot>Sending</Badge>
            : <Badge tone="warn" dot>Not sending yet</Badge>}
          <span className="text-[13px] text-dim">
            {data.sending.on
              ? <>Alerts go out from <span className="font-mono">{data.sending.number}</span>.</>
              : <>Matches are recorded but nothing is sent until the approved template is switched on (RENTALS_ALERTS_TEMPLATE on Render). They will come from <span className="font-mono">{data.sending.number}</span>.</>}
          </span>
          <span className="ml-auto font-mono text-xs tabular-nums text-muted">{data.counts.active} active · {data.counts.removed} stopped</span>
        </Sheet>
      )}

      <div role="tablist" className="mb-3 flex gap-1.5">
        {SHOWING.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={showing === s.id} onClick={() => setShowing(s.id)}
            className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-lg border px-3 text-xs ${
              showing === s.id ? 'border-lime/30 bg-lime/10 font-bold text-lime' : 'border-white/10 bg-transparent text-muted hover:bg-raise'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted">Loading…</p>}
      {isError && <Sheet role="alert" className="text-red">Couldn't load alerts. {rentalsErrorMessage(error)}</Sheet>}
      {data && !data.alerts.length && <p className="text-muted">{showing === 'active' ? 'Nobody has asked for alerts yet.' : 'Nobody has stopped an alert.'}</p>}
      {data?.alerts.map((a) => <AlertRow key={a.id} alert={a} />)}
    </div>
  );
}
