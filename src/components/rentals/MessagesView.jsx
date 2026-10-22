import { useState } from 'react';
import Badge from '../ui/Badge';
import { useRentalNotices, rentalsErrorMessage } from '../../hooks/useRentalsModeration';
import { when } from './helpers';
import { Sheet } from './ui';

// The WhatsApp messages EasyRentals sends to linked accounts, beside the
// emails: a landlord's new application, a listing checked, an application
// update (backend services/rentals/whatsappNotify.js). Read-only: staff see
// whether they are on, what each person was told, and why one failed.

const STATE = {
  sent: { label: 'Sent', tone: 'good' },
  queued: { label: 'Waiting', tone: 'warn' },
  failed: { label: 'Failed', tone: 'bad' },
  skipped: { label: 'Skipped', tone: 'neutral' },
};

const SHOWING = [
  { id: 'all', label: 'All' },
  { id: 'queued', label: 'Waiting' },
  { id: 'failed', label: 'Failed' },
];

function NoticeRow({ n }) {
  const s = STATE[n.status] || STATE.skipped;
  return (
    <Sheet data-testid={`notice-${n.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <span className="font-bold text-ink">{n.what}</span>
          <span className="ml-2 text-xs text-muted">to {n.account || 'a deleted account'}</span>
        </div>
        <Badge tone={s.tone}>{s.label}</Badge>
      </div>
      {n.detail && <p className="mt-1 text-[13px] text-dim">{n.detail}</p>}
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
        {n.status === 'sent' && <span>sent {when(n.sentAt)}</span>}
        {n.status === 'queued' && <span>{n.attempts ? `tried ${n.attempts}×, trying again` : `goes at ${when(n.sendAfter)}`}</span>}
        {n.status === 'failed' && <span>gave up after {n.attempts} tries</span>}
        {n.status === 'skipped' && <span>they unlinked before it went</span>}
        {n.lastError && n.status !== 'sent' && <span className="font-mono text-red">{n.lastError}</span>}
      </div>
    </Sheet>
  );
}

export default function MessagesView() {
  const [showing, setShowing] = useState('all');
  const { data, isLoading, isError, error } = useRentalNotices(showing);
  return (
    <div>
      {data && (
        <Sheet className="flex flex-wrap items-center gap-3">
          {data.on ? <Badge tone="good" dot>On</Badge> : <Badge tone="warn" dot>Off</Badge>}
          <span className="text-[13px] text-dim">
            {data.on
              ? <>People who linked their WhatsApp get these beside the emails. At night they wait until 08:00.</>
              : <>Only emails go out. These start once Meta approves the three templates and RENTALS_WHATSAPP_NOTIFY is set to on (Render).</>}
          </span>
          <span className="ml-auto font-mono text-xs tabular-nums text-muted">
            {data.counts.sent} sent · {data.counts.queued} waiting · {data.counts.failed} failed
          </span>
        </Sheet>
      )}

      <div role="tablist" className="mb-3 flex gap-1.5">
        {SHOWING.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={showing === s.id} onClick={() => setShowing(s.id)}
            className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-lg border px-3 text-xs ${
              showing === s.id ? 'border-lime/30 bg-lime/10 font-bold text-lime' : 'border-white/10 bg-transparent text-muted hover:bg-raise'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted">Loading…</p>}
      {isError && <Sheet role="alert" className="text-red">Couldn't load the messages. {rentalsErrorMessage(error)}</Sheet>}
      {data && !data.notices.length && <p className="text-muted">No WhatsApp messages yet.</p>}
      {data?.notices.map((n) => <NoticeRow key={n.id} n={n} />)}
    </div>
  );
}
