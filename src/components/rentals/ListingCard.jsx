import { colors as c } from '../../utils/theme';
import { useRentalsActions, photoSrc } from '../../hooks/useRentalsModeration';
import { useAct } from './useAct';
import { STATUS, TYPE, AMENITY, rand, when, btn, card, askReason } from './helpers';
import { Result } from './ui';
import OwnerBox from './OwnerBox';

export default function ListingCard({ listing }) {
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
