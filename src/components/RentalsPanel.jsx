// src/components/RentalsPanel.jsx
//
// EasyRentals moderation. Every listing waits here until a person has looked
// at it: approve it, send it back with a reason, take a live one down, or
// suspend a landlord. The API is /api/rentals/admin (super_admin and
// eb_manager); docs/RENTALS.md in the backend says why every listing, and
// every change to a live one, comes through here.
//
// Two things this screen must never do:
//   - publish without the person saying so: approving puts a stranger's
//     listing in front of the public, so it is confirmed in words first;
//   - turn a listing down without a reason: the landlord is emailed exactly
//     what is typed, so a reason is required and shown before it goes.
import { useState } from 'react';
import { colors as c } from '../utils/theme';
import {
  useRentalListings, useRentalAccounts, useRentalsActions, rentalsErrorMessage, photoSrc,
} from '../hooks/useRentalsModeration';

const VIEWS = [
  { id: 'pending_review', label: 'Waiting for review' },
  { id: 'published', label: 'Live' },
  { id: 'draft', label: 'Drafts' },
  { id: 'rented', label: 'Let' },
  { id: 'archived', label: 'Archived' },
  { id: 'accounts', label: 'Accounts' },
];

const STATUS = {
  draft: { label: 'Draft', tone: c.muted },
  pending_review: { label: 'Waiting for review', tone: c.amber },
  published: { label: 'Live', tone: c.emerald },
  rented: { label: 'Let', tone: c.cyan },
  archived: { label: 'Archived', tone: c.muted },
};

const TYPE = { room: 'Room', backroom: 'Backroom', cottage: 'Cottage', apartment: 'Flat', house: 'House' };
const AMENITY = {
  wifi: 'Wi-Fi', parking: 'Parking', prepaid_electricity: 'Prepaid electricity', water_included: 'Water included',
  own_entrance: 'Own entrance', own_bathroom: 'Own bathroom', own_kitchen: 'Own kitchen', security: 'Security',
  garden: 'Garden', pets_allowed: 'Pets allowed',
};

const rand = (n) => (typeof n === 'number' ? 'R' + n.toLocaleString('en-ZA') : '');
// Fleurhof is in South Africa, so is every time on this screen.
const when = (d) => (d
  ? new Date(d).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' })
  : '');
const whatsapp = (e164) => 'https://wa.me/' + String(e164 || '').replace(/^\+/, '');

const btn = (tone, disabled) => ({
  padding: '6px 12px', fontSize: 12, fontFamily: 'inherit', borderRadius: 8,
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
  background: tone + '18', color: tone, border: '1px solid ' + tone + '44',
});

const card = { background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '14px 16px', marginBottom: 12 };

function Result({ result }) {
  if (!result) return null;
  return (
    <div role="status" style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13, background: result.tone + '14', color: result.tone, border: '1px solid ' + result.tone + '33' }}>
      {result.text}
    </div>
  );
}

/** Ask for the reason the landlord will be emailed. Null if the person backs out. */
const askReason = (question) => {
  const reason = window.prompt(question);
  return reason && reason.trim() ? reason.trim() : null;
};

/** Run an action and turn its outcome into the line shown under the card. */
function useAct() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const act = async (fn, okText) => {
    setBusy(true);
    try {
      await fn();
      setResult({ tone: c.emerald, text: okText });
    } catch (err) {
      setResult({ tone: c.red, text: rentalsErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };
  return { busy, result, act };
}

function OwnerBox({ owner, ownerSuspended }) {
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

function ListingCard({ listing }) {
  const { approve, reject, takeDown } = useRentalsActions();
  const { busy, result, act } = useAct();
  const status = STATUS[listing.status] || { label: listing.status, tone: c.muted };
  const details = [
    TYPE[listing.propertyType] || listing.propertyType,
    `${listing.extension}, ${listing.area}`,
    `${listing.bedrooms} bed`,
    `${listing.bathrooms} bath`,
    listing.deposit ? `deposit ${rand(listing.deposit)}` : 'no deposit',
    listing.furnished ? 'furnished' : 'unfurnished',
    listing.availableFrom ? `available ${when(listing.availableFrom).split(',')[0]}` : 'available now',
  ];

  const onApprove = () => {
    if (!window.confirm(`Publish "${listing.title}"? Anyone can see it straight away, and the landlord is emailed.`)) return;
    act(() => approve(listing.id), 'Approved. It is live now, and the landlord is emailed.');
  };
  const onReject = () => {
    const reason = askReason(`What needs to change before "${listing.title}" can go live? The landlord is emailed exactly this.`);
    if (reason) act(() => reject(listing.id, reason), 'Sent back to the landlord with your reason.');
  };
  const onTakeDown = () => {
    const reason = askReason(`Why is "${listing.title}" coming down? The landlord is emailed exactly this.`);
    if (reason) act(() => takeDown(listing.id, reason), 'Taken down. The landlord is emailed your reason.');
  };

  return (
    <div data-testid={`listing-${listing.id}`} style={card}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 700, color: c.text }}>{listing.title}</span>
          <span style={{ marginLeft: 10, fontSize: 11, padding: '2px 8px', borderRadius: 999, background: status.tone + '22', color: status.tone, textTransform: 'uppercase', letterSpacing: 0.5 }}>{status.label}</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: c.text }}>{rand(listing.rent)} <span style={{ fontSize: 12, color: c.muted, fontWeight: 400 }}>a month</span></div>
      </div>

      <div style={{ fontSize: 12, color: c.muted, marginTop: 6 }}>{details.join(' · ')}</div>
      <div style={{ fontSize: 13, color: c.text, marginTop: 6 }}><span style={{ color: c.muted }}>Address:</span> {listing.addressLine || 'none given'}</div>

      {listing.photos?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 10 }}>
          {listing.photos.map((p, i) => (
            <a key={p.id} href={photoSrc(p.url)} target="_blank" rel="noopener noreferrer">
              <img src={photoSrc(p.url)} alt={`Photo ${i + 1} of ${listing.title}`} loading="lazy"
                style={{ width: 132, height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid ' + c.borderDim }} />
            </a>
          ))}
        </div>
      )}

      {listing.amenities?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {listing.amenities.map((a) => (
            <span key={a} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: c.surface, color: c.sage }}>{AMENITY[a] || a}</span>
          ))}
        </div>
      )}

      {listing.description && (
        <p style={{ fontSize: 13, color: c.text, marginTop: 10, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{listing.description}</p>
      )}

      <div style={{ fontSize: 12, color: c.muted, marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        {listing.review?.submittedAt && <span>Sent for review {when(listing.review.submittedAt)}</span>}
        {listing.review?.outcome && listing.review?.reviewedAt && (
          <span>Last review: {listing.review.outcome} {when(listing.review.reviewedAt)}{listing.review.note ? `, "${listing.review.note}"` : ''}</span>
        )}
      </div>

      {listing.status === 'pending_review' && (
        <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 12, color: c.muted, border: '1px dashed ' + c.borderDim }}>
          Before approving, check: the photos show a real place and match the description; the rent and deposit are
          believable for Fleurhof; the text does not ask for money before a viewing or give bank details; the
          landlord's details look genuine.
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {listing.status === 'pending_review' && (
          <>
            <button onClick={onApprove} disabled={busy} style={btn(c.lime, busy)}>Approve</button>
            <button onClick={onReject} disabled={busy} style={btn(c.amber, busy)}>Send back with a reason</button>
          </>
        )}
        {listing.status === 'published' && (
          <button onClick={onTakeDown} disabled={busy} style={btn(c.red, busy)}>Take down</button>
        )}
      </div>
      <Result result={result} />

      <OwnerBox owner={listing.owner} ownerSuspended={listing.ownerSuspended} />
    </div>
  );
}

function ListingsView({ status }) {
  const { data, isLoading, isError, error, refetch } = useRentalListings(status);
  if (isLoading) return <p style={{ color: c.muted }}>Loading…</p>;
  if (isError) {
    return (
      <div role="alert" style={{ ...card, color: c.red }}>
        Couldn't load listings. {rentalsErrorMessage(error)}{' '}
        <button onClick={() => refetch()} style={btn(c.red, false)}>Try again</button>
      </div>
    );
  }
  if (!data.length) {
    return <p style={{ color: c.muted }}>{status === 'pending_review' ? 'Nothing is waiting for review.' : 'No listings here.'}</p>;
  }
  return data.map((l) => <ListingCard key={l.id} listing={l} />);
}

function AccountRow({ account }) {
  const { suspend, reinstate } = useRentalsActions();
  const { busy, result, act } = useAct();
  const onSuspend = () => {
    const reason = askReason(`Why are you suspending ${account.fullName}? They are signed out at once and all their listings leave the site.`);
    if (reason) act(() => suspend(account.id, reason), `${account.fullName} is suspended.`);
  };
  const onReinstate = () => {
    if (!window.confirm(`Reinstate ${account.fullName}?`)) return;
    act(() => reinstate(account.id), `${account.fullName} is reinstated.`);
  };
  return (
    <div data-testid={`account-${account.id}`} style={card}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <span style={{ fontWeight: 700, color: c.text }}>{account.fullName}</span>
          <span style={{ marginLeft: 8, fontSize: 12, color: c.muted }}>{account.roles.join(' and ')}</span>
          {!account.isActive && <span style={{ marginLeft: 8, fontSize: 11, color: c.red }}>suspended{account.suspendedReason ? `: ${account.suspendedReason}` : ''}</span>}
        </div>
        <span style={{ fontSize: 12, color: c.muted }}>{account.listings === 1 ? '1 listing' : `${account.listings} listings`}</span>
      </div>
      <div style={{ fontSize: 12, color: c.muted, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <span>{account.email}</span>
        <span>{account.phone}</span>
        <span>joined {when(account.createdAt)}</span>
        <span>{account.lastLoginAt ? `last signed in ${when(account.lastLoginAt)}` : 'never signed in again'}</span>
      </div>
      <div style={{ marginTop: 8 }}>
        {account.isActive
          ? <button onClick={onSuspend} disabled={busy} style={btn(c.red, busy)}>Suspend</button>
          : <button onClick={onReinstate} disabled={busy} style={btn(c.emerald, busy)}>Reinstate</button>}
      </div>
      <Result result={result} />
    </div>
  );
}

function AccountsView() {
  const [typed, setTyped] = useState('');
  const [q, setQ] = useState('');
  const { data, isLoading, isError, error } = useRentalAccounts(q);
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); setQ(typed.trim()); }} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input aria-label="Find an account" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Name, email or number"
          style={{ flex: 1, maxWidth: 360, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', borderRadius: 8, background: c.surface, color: c.text, border: '1px solid ' + c.borderDim }} />
        <button type="submit" style={btn(c.lime, false)}>Find</button>
      </form>
      {isLoading && <p style={{ color: c.muted }}>Loading…</p>}
      {isError && <div role="alert" style={{ ...card, color: c.red }}>Couldn't load accounts. {rentalsErrorMessage(error)}</div>}
      {data && !data.length && <p style={{ color: c.muted }}>{q ? 'Nobody matches that.' : 'Nobody has signed up yet.'}</p>}
      {data?.map((a) => <AccountRow key={a.id} account={a} />)}
    </div>
  );
}

export default function RentalsPanel() {
  const [view, setView] = useState('pending_review');
  const waiting = useRentalListings('pending_review').data?.length || 0;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: 4, color: c.text }}>Rentals</h1>
        <p style={{ color: c.muted, fontSize: 15 }}>
          EasyRentals. Every listing waits here until a person has checked it, and so does every change to a live one.
        </p>
      </div>

      <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {VIEWS.map((v) => (
          <button key={v.id} role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)}
            style={{ ...btn(view === v.id ? c.lime : c.muted, false), fontWeight: view === v.id ? 700 : 400 }}>
            {v.label}{v.id === 'pending_review' && waiting ? ` (${waiting})` : ''}
          </button>
        ))}
      </div>

      {view === 'accounts' ? <AccountsView /> : <ListingsView status={view} />}
    </div>
  );
}
