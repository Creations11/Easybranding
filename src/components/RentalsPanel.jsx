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
import { useRentalListings, useRentalPlacements } from '../hooks/useRentalsModeration';
import ListingsView from './rentals/ListingsView';
import AccountsView from './rentals/AccountsView';
import AlertsView from './rentals/AlertsView';
import MessagesView from './rentals/MessagesView';
import ApplicationsView from './rentals/ApplicationsView';
import EnquiriesView from './rentals/EnquiriesView';
import ViewingsView from './rentals/ViewingsView';
import OverviewView from './rentals/OverviewView';
import PlacementsView from './rentals/PlacementsView';
import WebsiteView from './rentals/WebsiteView';

// The parts live in ./rentals/: ListingsView (ListingCard, OwnerBox) and
// AccountsView (NewAccount, AccountRow, AccountForm), AlertsView, MessagesView, ApplicationsView, PlacementsView, WebsiteView.

const VIEWS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pending_review', label: 'Waiting for review' },
  { id: 'published', label: 'Live' },
  { id: 'draft', label: 'Drafts' },
  { id: 'rented', label: 'Let' },
  { id: 'archived', label: 'Archived' },
  { id: 'enquiries', label: 'Enquiries' },
  { id: 'viewings', label: 'Viewings' },
  { id: 'applications', label: 'Applications' },
  { id: 'placements', label: 'Placements' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'messages', label: 'WhatsApp' },
  { id: 'website', label: 'Website' },
];

export default function RentalsPanel() {
  // The overview first (2026-11-19); a tile opens its list, sometimes pre-filtered.
  const [view, setView] = useState('overview');
  const [opts, setOpts] = useState({});
  const go = (v, o = {}) => { setOpts(o); setView(v); };
  const waiting = useRentalListings('pending_review').data?.length || 0;
  // Placement fees to invoice: shown on the tab so a due one is not missed.
  const due = useRentalPlacements('due').data?.placements?.length || 0;

  return (
    <div>
      <div className="mb-5">
        <h1 className="mb-1 font-['Fraunces',serif] text-[clamp(24px,4vw,40px)] font-black text-ink">Rentals</h1>
        <p className="text-[15px] text-muted">
          EasyRentals. Every listing waits here until a person has checked it, and so does every change to a live one.
        </p>
        <p className="mt-1 text-[13px] text-muted">
          From the owner's phone: send <span className="font-mono text-dim">LISTINGS</span> to the EasyBranding WhatsApp, then{' '}
          <span className="font-mono text-dim">LISTING</span>, <span className="font-mono text-dim">PUBLISH</span> or{' '}
          <span className="font-mono text-dim">REJECTLISTING</span> with the 6-character reference.
        </p>
      </div>

      <div role="tablist" className="mb-4 flex flex-wrap gap-1.5">
        {VIEWS.map((v) => (
          <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => go(v.id)}
            className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-lg border px-3 text-xs ${
              view === v.id ? 'border-lime/30 bg-lime/10 font-bold text-lime' : 'border-white/10 bg-transparent text-muted hover:bg-raise'
            }`}>
            {v.label}{v.id === 'pending_review' && waiting ? ` (${waiting})` : ''}{v.id === 'placements' && due ? ` (${due})` : ''}
          </button>
        ))}
      </div>

      {view === 'overview' ? <OverviewView go={go} />
        : view === 'accounts' ? <AccountsView />
        : view === 'alerts' ? <AlertsView />
        : view === 'messages' ? <MessagesView />
        : view === 'enquiries' ? <EnquiriesView key={JSON.stringify(opts)} {...opts} />
        : view === 'viewings' ? <ViewingsView key={JSON.stringify(opts)} {...opts} />
        : view === 'applications' ? <ApplicationsView key={JSON.stringify(opts)} {...opts} />
        : view === 'placements' ? <PlacementsView />
        : view === 'website' ? <WebsiteView />
        : <ListingsView status={view} />}
    </div>
  );
}
