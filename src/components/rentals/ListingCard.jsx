import { useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useRentalsActions, photoSrc } from '../../hooks/useRentalsModeration';
import { useAct } from './useAct';
import { STATUS, TYPE, AMENITY, rand, when, askReason, mapsLink, mapEmbed } from './helpers';
import { Result, Sheet } from './ui';
import OwnerBox from './OwnerBox';

export default function ListingCard({ listing }) {
  const { approve, reject, takeDown } = useRentalsActions();
  const { busy, result, act } = useAct();
  const [showMap, setShowMap] = useState(false);
  const status = STATUS[listing.status] || { label: listing.status, tone: 'neutral' };
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
    <Sheet data-testid={`listing-${listing.id}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-base font-bold text-ink">{listing.title}</span>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <div className="font-mono text-xl font-bold tabular-nums text-ink">
          {rand(listing.rent)} <span className="font-sans text-xs font-normal text-muted">a month</span>
        </div>
      </div>

      <div className="mt-1.5 text-xs text-muted">{details.join(' · ')}</div>
      <div className="mt-1.5 text-[13px] text-ink"><span className="text-muted">Address:</span> {listing.addressLine || 'none given'}</div>
      {/* Where it really is: a listing in a field, or in another suburb, is
          one of the things a reviewer is here to catch. */}
      {listing.addressLine && (
        <div className="mt-1 flex flex-wrap gap-3 text-xs">
          <button type="button" onClick={() => setShowMap((v) => !v)} className="min-h-[44px] cursor-pointer text-lime underline">
            {showMap ? 'Hide the map' : 'Show on the map'}
          </button>
          <a href={mapsLink(listing)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center text-lime underline">
            Open in Google Maps
          </a>
        </div>
      )}
      {showMap && listing.addressLine && (
        <iframe title={`Map of ${listing.title}`} src={mapEmbed(listing)} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
          className="mt-1 h-64 w-full rounded-lg border border-edge" />
      )}

      {listing.photos?.length > 0 && (
        <div className="mt-2.5 flex gap-2 overflow-x-auto">
          {listing.photos.map((p, i) => (
            <a key={p.id} href={photoSrc(p.url)} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <img src={photoSrc(p.url)} alt={`Photo ${i + 1} of ${listing.title}`} loading="lazy"
                className="h-24 w-[132px] rounded-lg border border-edge object-cover" />
            </a>
          ))}
        </div>
      )}

      {listing.amenities?.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {listing.amenities.map((a) => (
            <span key={a} className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-sage">{AMENITY[a] || a}</span>
          ))}
        </div>
      )}

      {listing.description && (
        <p className="mt-2.5 whitespace-pre-line text-[13px] leading-normal text-ink">{listing.description}</p>
      )}

      <div className="mt-2 flex flex-wrap gap-3.5 text-xs text-muted">
        {listing.review?.submittedAt && <span>Sent for review {when(listing.review.submittedAt)}</span>}
        {listing.review?.outcome && listing.review?.reviewedAt && (
          <span>Last review: {listing.review.outcome} {when(listing.review.reviewedAt)}{listing.review.note ? `, "${listing.review.note}"` : ''}</span>
        )}
      </div>

      {listing.status === 'pending_review' && (
        <div className="mt-2.5 rounded-lg border border-dashed border-edge px-3 py-2 text-xs text-muted">
          Before approving, check: the photos show a real place and match the description; the rent and deposit are
          believable for Fleurhof; the text does not ask for money before a viewing or give bank details; the
          landlord's details look genuine.
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {listing.status === 'pending_review' && (
          <>
            <Button variant="primary" onClick={onApprove} disabled={busy}>Approve</Button>
            <Button variant="warn" onClick={onReject} disabled={busy}>Send back with a reason</Button>
          </>
        )}
        {listing.status === 'published' && (
          <Button variant="danger" onClick={onTakeDown} disabled={busy}>Take down</Button>
        )}
      </div>
      <Result result={result} />

      <OwnerBox owner={listing.owner} ownerSuspended={listing.ownerSuspended} />
    </Sheet>
  );
}
