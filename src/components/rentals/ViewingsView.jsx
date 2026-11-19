import { useState } from 'react';
import Badge from '../ui/Badge';
import { Select } from '../ui/Field';
import { useRentalViewings, rentalsErrorMessage } from '../../hooks/useRentalsModeration';
import { when, whatsapp } from './helpers';
import { Sheet } from './ui';

// Every viewing booked (Ayanda, 2026-11-19: "see all bookings"). Read only:
// renters book, move and cancel on WhatsApp or the website, and each booking
// also goes in the viewings diary. A booking that did not reach the diary
// says so here, with Google's reason.

const SHOW = [
  ['upcoming', 'Upcoming'],
  ['past', 'Past'],
  ['cancelled', 'Cancelled'],
  ['pending', 'Agreed to the fee, no time yet'],
  ['all', 'All'],
];

const STATE = {
  booked: { label: 'Booked', tone: 'good' },
  pending: { label: 'Picking a time', tone: 'warn' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

const BY = { renter: 'by the renter', staff: 'by EasyRentals', listing_closed: 'because the place closed' };

function ViewingRow({ v }) {
  const s = STATE[v.status] || { label: v.status, tone: 'neutral' };
  return (
    <Sheet data-testid={`viewing-${v.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <span className="font-bold text-ink">{v.start ? when(v.start) : 'No time yet'}</span>
          <span className="ml-2 text-[14px] text-ink">{v.place ? v.place.title : 'A place that is gone'}</span>
          {v.place?.place && <span className="ml-1 text-xs text-muted">{v.place.place}</span>}
        </div>
        <Badge tone={s.tone}>{s.label}</Badge>
      </div>
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
        <span>
          Renter: <span className="text-ink">{v.name || 'No name'}</span>{' '}
          <a href={whatsapp(v.phone)} target="_blank" rel="noopener noreferrer" className="font-mono text-emerald underline">{v.phone}</a>
        </span>
        {v.landlord && <span>Landlord: <span className="text-ink">{v.landlord.name}</span></span>}
        <span>booked on {v.via === 'website' ? 'the website' : 'WhatsApp'}</span>
        {v.feeAgreed && <span>agreed to the renter fee</span>}
        {v.status === 'booked' && (v.inDiary
          ? <span>in the diary</span>
          : <span className="text-red">not in the diary{v.diaryError ? `: ${v.diaryError}` : ''}</span>)}
        {v.status === 'cancelled' && <span>cancelled {when(v.cancelledAt)}{BY[v.cancelledBy] ? ` ${BY[v.cancelledBy]}` : ''}</span>}
      </div>
    </Sheet>
  );
}

export default function ViewingsView() {
  const [show, setShow] = useState('upcoming');
  const { data, isLoading, isError, error } = useRentalViewings(show);
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Select value={show} onChange={(e) => setShow(e.target.value)} aria-label="Show" className="w-auto cursor-pointer bg-card">
          {SHOW.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>
      {isLoading && <p className="text-muted">Loading…</p>}
      {isError && <Sheet role="alert" className="text-red">Couldn't load viewings. {rentalsErrorMessage(error)}</Sheet>}
      {data && !data.length && <p className="text-muted">No viewings here.</p>}
      {data?.map((v) => <ViewingRow key={v.id} v={v} />)}
    </div>
  );
}
