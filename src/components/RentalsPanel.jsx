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
import { useRentalListings } from '../hooks/useRentalsModeration';
import { btn } from './rentals/helpers';
import ListingsView from './rentals/ListingsView';
import AccountsView from './rentals/AccountsView';

// The parts live in ./rentals/: ListingsView (ListingCard, OwnerBox) and
// AccountsView (NewAccount, AccountRow, AccountForm).

const VIEWS = [
  { id: 'pending_review', label: 'Waiting for review' },
  { id: 'published', label: 'Live' },
  { id: 'draft', label: 'Drafts' },
  { id: 'rented', label: 'Let' },
  { id: 'archived', label: 'Archived' },
  { id: 'accounts', label: 'Accounts' },
];

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
