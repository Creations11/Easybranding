import { useRentalsOverview, rentalsErrorMessage } from '../../hooks/useRentalsModeration';
import { rand, whatsapp } from './helpers';
import { Sheet } from './ui';

// The Rentals tab's front page (Ayanda, 2026-11-19: "the rental tab needs an
// upgrade", overview first). Only what someone acts on today, and every
// number opens the list behind it: `go(view, options)` is RentalsPanel's.

const time = (d) => new Date(d).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' });
const ago = (d) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(d)) / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

/** One number, which is also the way to its list. */
function Tile({ label, value, note, urgent = false, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex min-h-[112px] cursor-pointer flex-col justify-between rounded-xl border px-4 py-3.5 text-left transition-colors hover:bg-raise ${
        urgent ? 'border-lime/40 bg-lime/10' : 'border-edge bg-card'
      }`}>
      <span className="text-[13px] text-muted">{label}</span>
      <span className={`font-['Fraunces',serif] text-[34px] font-black leading-none ${urgent ? 'text-lime' : 'text-ink'}`}>{value}</span>
      {note ? <span className="text-xs text-dim">{note}</span> : <span className="text-xs text-dim">&nbsp;</span>}
    </button>
  );
}

export default function OverviewView({ go }) {
  const { data: o, isLoading, isError, error } = useRentalsOverview();
  if (isLoading) return <p className="text-muted">Loading…</p>;
  if (isError) return <Sheet role="alert" className="text-red">Couldn't load the overview. {rentalsErrorMessage(error)}</Sheet>;
  if (!o) return null;
  const today = o.viewings.today || [];

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Tile label="Waiting for an answer" value={o.waiting.count} urgent={o.waiting.count > 0}
          note={o.waiting.today ? `${o.waiting.today} wrote today` : 'nobody new today'}
          onClick={() => go('enquiries', { onlyWaiting: true })} />
        <Tile label="Viewings today" value={today.length} urgent={today.length > 0}
          note={`${o.viewings.nextSevenDays} in the next 7 days`}
          onClick={() => go('viewings', { initialShow: 'upcoming' })} />
        <Tile label="New applications" value={o.applicationsNew} urgent={o.applicationsNew > 0}
          note="not looked at yet" onClick={() => go('applications', { initialStatus: 'submitted' })} />
        <Tile label="Listings to check" value={o.listingsToReview} urgent={o.listingsToReview > 0}
          note={`${o.listingsLive} live now`} onClick={() => go('pending_review')} />
        <Tile label="Agreed to view, no time yet" value={o.viewings.pickingATime}
          note="agreed to the fee" onClick={() => go('viewings', { initialShow: 'pending' })} />
        {o.feesDue && (
          <Tile label="Placement fees to invoice" value={o.feesDue.count} urgent={o.feesDue.count > 0}
            note={o.feesDue.owed ? `${rand(o.feesDue.owed)} owed` : 'nothing owed'} onClick={() => go('placements')} />
        )}
      </div>

      <h2 className="mb-2 text-[15px] font-bold text-ink">Today's viewings</h2>
      {today.length ? today.map((v) => (
        <Sheet key={v.id} data-testid={`today-${v.id}`} className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="mr-2 font-mono font-bold text-lime">{time(v.start)}</span>
            <span className="text-ink">{v.place ? v.place.title : 'A place that is gone'}</span>
            {v.place?.place && <span className="ml-1 text-xs text-muted">{v.place.place}</span>}
          </div>
          <div className="text-xs text-muted">
            {v.name || 'No name'}{' '}
            <a href={whatsapp(v.phone)} target="_blank" rel="noopener noreferrer" className="font-mono text-emerald underline">{v.phone}</a>
            {v.landlord && <span className="ml-2">landlord {v.landlord.name}</span>}
            {!v.inDiary && <span className="ml-2 text-red">not in the diary</span>}
          </div>
        </Sheet>
      )) : <p className="mb-4 text-[13px] text-muted">No viewings today.</p>}

      {o.waiting.newest.length > 0 && (
        <>
          <h2 className="mb-2 mt-5 text-[15px] font-bold text-ink">Waiting for an answer, newest first</h2>
          {o.waiting.newest.map((e) => (
            <Sheet key={e.id} className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-bold text-ink">{e.name || 'No name'}</span>
                <span className="ml-2 text-[14px] text-ink">“{e.lastMessage}”</span>
              </div>
              <div className="text-xs text-muted">
                {ago(e.lastMessageAt)}{' '}
                <a href={whatsapp(e.phone)} target="_blank" rel="noopener noreferrer" className="font-mono text-emerald underline">{e.phone}</a>
              </div>
            </Sheet>
          ))}
          <button type="button" onClick={() => go('enquiries', { onlyWaiting: true })}
            className="cursor-pointer text-[13px] text-lime underline">See everyone waiting</button>
        </>
      )}
    </div>
  );
}
