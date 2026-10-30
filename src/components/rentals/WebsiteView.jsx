import { useState } from 'react';
import { useRentalSiteActivity, rentalsErrorMessage } from '../../hooks/useRentalsModeration';
import { Sheet } from './ui';

// What people do on the EasyRentals website (backend
// services/rentals/siteActivity.js): how many came, where from, which places
// they looked at, and how many opened Apply or WhatsApp. Counted without
// cookies, so a visitor is a person on one day: someone who comes back the
// next day counts again.

const PERIODS = [
  { days: 1, label: 'Today' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

const SOURCE = {
  facebook: 'Facebook',
  google: 'Google',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  direct: 'Typed in or a saved link',
  other: 'Another website',
};

const SITE = 'https://rentals.easybranding.co.za';
const day = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' });

function Section({ title, children }) {
  return (
    <Sheet>
      <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-dim">{title}</h3>
      {children}
    </Sheet>
  );
}

/** A name and its numbers on one line. */
function Row({ name, numbers, testId }) {
  return (
    <div data-testid={testId} className="flex flex-wrap justify-between gap-2 border-t border-white/5 py-1.5 text-[13px] first:border-t-0">
      <span className="text-ink">{name}</span>
      <span className="font-mono text-xs tabular-nums text-muted">{numbers}</span>
    </div>
  );
}

export default function WebsiteView() {
  const [days, setDays] = useState(7);
  const { data, isLoading, isError, error } = useRentalSiteActivity(days);
  const t = data?.totals;

  return (
    <div>
      <div role="tablist" className="mb-3 flex gap-1.5">
        {PERIODS.map((p) => (
          <button key={p.days} type="button" role="tab" aria-selected={days === p.days} onClick={() => setDays(p.days)}
            className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-lg border px-3 text-xs ${
              days === p.days ? 'border-lime/30 bg-lime/10 font-bold text-lime' : 'border-white/10 bg-transparent text-muted hover:bg-raise'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted">Loading…</p>}
      {isError && <Sheet role="alert" className="text-red">Couldn't load the website numbers. {rentalsErrorMessage(error)}</Sheet>}

      {t && (
        <>
          <Sheet data-testid="website-totals">
            <p className="text-[15px] text-ink">
              <b>{t.visitors}</b> {t.visitors === 1 ? 'visitor' : 'visitors'} · <b>{t.views}</b> pages seen · <b>{t.placeViews}</b> place views ·{' '}
              <b>{t.applyViews}</b> opened Apply · <b>{t.whatsappTaps}</b> WhatsApp taps
            </p>
            <p className="mt-1 text-xs text-muted">
              {t.visitors ? `${Math.round((t.onPhone / t.visitors) * 100)}% on a phone. ` : ''}
              A visitor is one person on one day, counted without cookies, so someone who comes back tomorrow counts again.
              Counting started on 30 October 2026.
            </p>
          </Sheet>

          <Section title="Where they came from">
            {data.sources.length
              ? data.sources.map((s) => <Row key={s.source} testId={`source-${s.source}`} name={SOURCE[s.source] || s.source} numbers={`${s.visitors} ${s.visitors === 1 ? 'visitor' : 'visitors'}`} />)
              : <p className="text-[13px] text-muted">Nobody yet in this period.</p>}
            {data.campaigns.length > 0 && (
              <div className="mt-2 text-xs text-muted">
                Tagged links: {data.campaigns.map((c) => `${c.campaign} (${c.visitors})`).join(', ')}
              </div>
            )}
          </Section>

          <Section title="Places">
            {data.places.length
              ? data.places.map((p) => (
                <Row key={p.listingId} testId={`place-${p.listingId}`}
                  name={<a href={`${SITE}/listings/${p.listingId}`} target="_blank" rel="noopener noreferrer" className="underline">{p.title}{p.example ? ' (example)' : ''}</a>}
                  numbers={`${p.views} views · ${p.visitors} people · ${p.applyViews} opened Apply · ${p.whatsappTaps} WhatsApp`} />
              ))
              : <p className="text-[13px] text-muted">No place has been looked at in this period.</p>}
          </Section>

          <Section title="Pages">
            {data.pages.length
              ? data.pages.map((p) => <Row key={p.path} name={<span className="font-mono text-xs">{p.path}</span>} numbers={`${p.views} views · ${p.visitors} people`} />)
              : <p className="text-[13px] text-muted">No pages seen in this period.</p>}
          </Section>

          {data.byDay.length > 1 && (
            <Section title="Each day">
              {[...data.byDay].reverse().map((d) => <Row key={d.day} name={day(d.day)} numbers={`${d.visitors} visitors · ${d.views} pages`} />)}
            </Section>
          )}
        </>
      )}
    </div>
  );
}
