import { useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Select } from '../ui/Field';
import { useRentalPlacements, useRentalsActions, rentalsErrorMessage } from '../../hooks/useRentalsModeration';
import { useAct } from './useAct';
import { askReason, rand, when, whatsapp } from './helpers';
import { Result, Sheet } from './ui';

// EasyRentals' placement fee (backend services/rentals/placements.js,
// 2026-10-29). A landlord agrees to it when they send a listing for review;
// it is due when they mark the place let to a tenant who applied through
// EasyRentals. Nothing invoices them automatically: this is where staff see
// what to invoice, then record it paid or waived.

const PLACEMENT_STATUS = {
  accepted: { label: 'Waiting for move-in', tone: 'system' },
  due: { label: 'Due', tone: 'warn' },
  paid: { label: 'Paid', tone: 'good' },
  waived: { label: 'Waived', tone: 'neutral' },
  fell_through: { label: 'Fell through', tone: 'neutral' },
};

const FILTERS = [
  ['due', 'Due'],
  ['accepted', 'Waiting for move-in'],
  ['paid', 'Paid'],
  ['waived', 'Waived'],
  ['fell_through', 'Fell through'],
  ['', 'All'],
];

function PlacementRow({ p }) {
  const { settlePlacement } = useRentalsActions();
  const { busy, result, act } = useAct();
  const s = PLACEMENT_STATUS[p.status] || { label: p.status, tone: 'neutral' };
  const who = p.landlord?.fullName || 'the landlord';
  const onPaid = () => {
    // Optional: an EFT reference or the partner's invoice number, for the record.
    const note = window.prompt(`Record ${rand(p.fee)} from ${who} as paid? Add a reference if you have one, or leave it empty.`);
    if (note === null) return;
    act(() => settlePlacement(p.id, 'paid', note.trim() || undefined), `${rand(p.fee)} from ${who} is recorded as paid.`);
  };
  const onWaive = () => {
    const reason = askReason(`Why is ${who}'s ${rand(p.fee)} not being charged?`);
    if (!reason) return;
    act(() => settlePlacement(p.id, 'waived', reason), `${who}'s fee is waived.`);
  };
  return (
    <Sheet data-testid={`placement-${p.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <span className="font-bold text-ink">{rand(p.fee)}</span>
          <span className="ml-2 text-[13px] text-dim">
            {p.listing?.title || 'A listing'}{p.listing?.rent ? `, ${rand(p.listing.rent)} a month` : ''}
          </span>
        </div>
        <Badge tone={s.tone}>{s.label}</Badge>
      </div>
      <div className="mt-1 text-[13px]">
        <span className="text-ink">{who}</span>
        {p.landlord?.phone && (
          <a href={whatsapp(p.landlord.phone)} target="_blank" rel="noopener noreferrer" className="ml-2 font-mono text-xs text-emerald underline">{p.landlord.phone}</a>
        )}
        {p.landlord?.email && <span className="ml-2 text-xs text-muted">{p.landlord.email}</span>}
      </div>
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
        <span>accepted {when(p.acceptedAt)}</span>
        {p.dueAt && <span>let {when(p.dueAt)}</span>}
        {p.settledAt && <span>{p.status} {when(p.settledAt)}</span>}
        <span className="text-dim">agreed to {p.version}</span>
      </div>
      {p.note && <div className="mt-1 text-xs text-dim">{p.note}</div>}
      {p.status === 'due' && (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="good" onClick={onPaid} disabled={busy}>Mark paid</Button>
          <Button variant="secondary" onClick={onWaive} disabled={busy}>Waive</Button>
        </div>
      )}
      <Result result={result} />
    </Sheet>
  );
}

export default function PlacementsView() {
  const [status, setStatus] = useState('due');
  const { data, isLoading, isError, error } = useRentalPlacements(status);
  const list = data?.placements;
  return (
    <div>
      <Sheet className="text-[13px] text-dim">
        A placement fee is due when a landlord marks a place let to a tenant who applied through EasyRentals.
        Invoice them, then mark it <span className="font-bold text-ink">paid</span>, or{' '}
        <span className="font-bold text-ink">waive</span> it with a reason.
        {data && typeof data.owed === 'number' && (
          <span className="mt-1 block text-[15px] font-bold text-ink" data-testid="placements-owed">
            {data.owed ? `${rand(data.owed)} to invoice` : 'Nothing to invoice right now.'}
          </span>
        )}
      </Sheet>
      <div className="mb-3 flex items-center gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Show" className="w-auto cursor-pointer bg-card">
          {FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>
      {isLoading && <p className="text-muted">Loading…</p>}
      {isError && <Sheet role="alert" className="text-red">Couldn't load placements. {rentalsErrorMessage(error)}</Sheet>}
      {list && !list.length && <p className="text-muted">No placements{status ? ' like that' : ' yet'}.</p>}
      {list?.map((p) => <PlacementRow key={p.id} p={p} />)}
    </div>
  );
}
