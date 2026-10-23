import { useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Select } from '../ui/Field';
import { useRentalApplications, useRentalsActions, rentalsErrorMessage } from '../../hooks/useRentalsModeration';
import { useAct } from './useAct';
import { when, whatsapp } from './helpers';
import { Result, Sheet } from './ui';

// Rental applications, for one job above all: the privacy policy says an
// application and its documents are kept "for up to 12 months after it
// closes" and that a person "can ask us to delete yours sooner". The sweep
// keeps the first promise by itself (backend services/rentals/retention.js);
// Delete now is how staff keep the second.

const APP_STATUS = {
  submitted: { label: 'New', tone: 'warn' },
  under_review: { label: 'Being reviewed', tone: 'system' },
  shortlisted: { label: 'Shortlisted', tone: 'live' },
  accepted: { label: 'Accepted', tone: 'good' },
  rejected: { label: 'Declined', tone: 'neutral' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
};

const FILTERS = [
  ['', 'All'],
  ['submitted', 'New'],
  ['shortlisted', 'Shortlisted'],
  ['accepted', 'Accepted'],
  ['rejected', 'Declined'],
  ['withdrawn', 'Withdrawn'],
];

function ApplicationRow({ app }) {
  const { deleteApplication } = useRentalsActions();
  const { busy, result, act } = useAct();
  const s = APP_STATUS[app.status] || { label: app.status, tone: 'neutral' };
  const onDelete = () => {
    const docs = app.documents?.length ? ` and their ${app.documents.length} document${app.documents.length === 1 ? '' : 's'}` : '';
    if (!window.confirm(`Delete ${app.fullName}'s application${docs} now? It cannot be undone. Do this when they have asked for it.`)) return;
    act(() => deleteApplication(app.id), `${app.fullName}'s application is deleted.`);
  };
  return (
    <Sheet data-testid={`application-${app.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <span className="font-bold text-ink">{app.fullName}</span>{' '}
          <a href={whatsapp(app.phone)} target="_blank" rel="noopener noreferrer" className="ml-1 font-mono text-xs text-emerald underline">{app.phone}</a>
          <span className="ml-2 text-xs text-muted">{app.email}</span>
        </div>
        <Badge tone={s.tone}>{s.label}</Badge>
      </div>
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
        <span>applied {when(app.createdAt)}</span>
        <span>{app.documents?.length || 0} document{app.documents?.length === 1 ? '' : 's'}</span>
        {app.closedAt && <span>closed {when(app.closedAt)}</span>}
        {app.deleteAfter
          ? <span className="text-dim">deleted automatically on {when(app.deleteAfter).split(',')[0]}</span>
          : <span>kept while it is open</span>}
      </div>
      <div className="mt-2">
        <Button variant="danger" onClick={onDelete} disabled={busy}>Delete now</Button>
      </div>
      <Result result={result} />
    </Sheet>
  );
}

export default function ApplicationsView() {
  const [status, setStatus] = useState('');
  const { data, isLoading, isError, error } = useRentalApplications(status);
  return (
    <div>
      <Sheet className="text-[13px] text-dim">
        The privacy policy keeps an application and its documents for up to 12 months after it closes, and they are deleted
        by themselves before then. When someone asks for theirs to go sooner, use <span className="font-bold text-ink">Delete now</span>.
      </Sheet>
      <div className="mb-3 flex items-center gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Show" className="w-auto cursor-pointer bg-card">
          {FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>
      {isLoading && <p className="text-muted">Loading…</p>}
      {isError && <Sheet role="alert" className="text-red">Couldn't load applications. {rentalsErrorMessage(error)}</Sheet>}
      {data && !data.length && <p className="text-muted">No applications{status ? ' like that' : ' yet'}.</p>}
      {data?.map((a) => <ApplicationRow key={a.id} app={a} />)}
    </div>
  );
}
