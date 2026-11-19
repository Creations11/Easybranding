import { useState } from 'react';
import Badge from '../ui/Badge';
import { Select } from '../ui/Field';
import { useRentalEnquiries, rentalsErrorMessage } from '../../hooks/useRentalsModeration';
import { when, whatsapp } from './helpers';
import { Sheet } from './ui';

// Everyone who has written to EasyRentals on WhatsApp (Ayanda, 2026-11-19:
// "see all inquiries"). Read only: the answering happens in the Inbox, where
// the conversation is. "Waiting" means nobody has answered since they last
// wrote (backend services/rentals/staffLists.js).

const KINDS = [['', 'Everyone'], ['renter', 'Renters'], ['landlord', 'Landlords']];

function EnquiryRow({ e }) {
  return (
    <Sheet data-testid={`enquiry-${e.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <span className="font-bold text-ink">{e.name || 'No name'}</span>{' '}
          <a href={whatsapp(e.phone)} target="_blank" rel="noopener noreferrer" className="ml-1 font-mono text-xs text-emerald underline">{e.phone}</a>
          <span className="ml-2 text-xs text-muted">{e.kind === 'landlord' ? 'Landlord' : 'Renter'}</span>
        </div>
        {e.waiting ? <Badge tone="warn">Waiting for an answer</Badge> : <Badge tone="neutral">Answered</Badge>}
      </div>
      {e.place && <div className="mt-1 text-xs text-muted">About <span className="text-ink">{e.place.title}</span>{e.place.place ? `, ${e.place.place}` : ''}</div>}
      {e.lastMessage && <p className="mt-2 text-[14px] text-ink">“{e.lastMessage}”</p>}
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
        <span>last wrote {when(e.lastMessageAt)}</span>
        {e.lastReplyAt && <span>last answered {when(e.lastReplyAt)}</span>}
        <span>first wrote {when(e.firstSeenAt)}</span>
      </div>
    </Sheet>
  );
}

export default function EnquiriesView() {
  const [kind, setKind] = useState('');
  const [waiting, setWaiting] = useState(false);
  const { data, isLoading, isError, error } = useRentalEnquiries({ kind, waiting });
  return (
    <div>
      <Sheet className="text-[13px] text-dim">
        Everyone who has written to EasyRentals on WhatsApp, newest first. Answer them in the Inbox.
      </Sheet>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Select value={kind} onChange={(ev) => setKind(ev.target.value)} aria-label="Who" className="w-auto cursor-pointer bg-card">
          {KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted">
          <input type="checkbox" checked={waiting} onChange={(ev) => setWaiting(ev.target.checked)} />
          Only those waiting for an answer
        </label>
      </div>
      {isLoading && <p className="text-muted">Loading…</p>}
      {isError && <Sheet role="alert" className="text-red">Couldn't load enquiries. {rentalsErrorMessage(error)}</Sheet>}
      {data && !data.length && <p className="text-muted">{waiting ? 'Nobody is waiting for an answer.' : 'No enquiries yet.'}</p>}
      {data?.map((e) => <EnquiryRow key={e.id} e={e} />)}
    </div>
  );
}
