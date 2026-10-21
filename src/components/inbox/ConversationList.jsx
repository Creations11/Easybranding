// The left pane of the inbox: every conversation, filtered and searchable.
// It is the CRM's own list (GET /admin-ops/crm/leads), so "waiting on us"
// here is the same count as the WhatsApp API page's headline.
import { useMemo } from 'react';
import { ago } from '../crm/crmHelpers';
import { INBOX_FILTERS } from './inboxFilters';
import { initials, timeOf } from './chatText';


// Enough to scroll through; the search finds anybody beyond it.
const SHOWN = 200;

export default function ConversationList({ leads, filter, setFilter, query, setQuery, selectedId, onSelect, showBusiness, now }) {
  const counts = useMemo(
    () => Object.fromEntries(INBOX_FILTERS.map(([k, , test]) => [k, leads.filter((l) => test(l, now)).length])),
    [leads, now],
  );

  const list = useMemo(() => {
    const test = (INBOX_FILTERS.find(([k]) => k === filter) || INBOX_FILTERS[1])[2];
    const needle = query.trim().toLowerCase();
    const hit = (l) => !needle || [l.name, l.phone, l.business, l.lastText].some((v) => v && String(v).toLowerCase().includes(needle));
    const rows = leads.filter((l) => test(l, now) && hit(l));
    // Waiting: whoever has waited longest first, because they are the most
    // likely to have given up. Everything else: most recent first, as a
    // phone's chat list is.
    return filter === 'waiting'
      ? rows.sort((a, b) => new Date(a.waitingSince) - new Date(b.waitingSince))
      : rows.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
  }, [leads, filter, query, now]);

  return (
    <div className="flex min-h-0 flex-col">
      <div className="border-b border-edge p-3">
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, number or words"
          aria-label="Search conversations"
          className="min-h-[44px] w-full rounded-full border border-white/12 bg-ground px-4 text-base text-ink focus:border-lime focus:outline-none md:text-sm"
        />
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Show">
          {INBOX_FILTERS.map(([k, label]) => (
            <button
              key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
              className={`inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs ${
                filter === k
                  ? (k === 'waiting' ? 'border-amber/40 bg-amber/10 font-semibold text-amber' : 'border-lime/40 bg-lime/10 font-semibold text-lime')
                  : 'border-edge text-muted hover:bg-raise'
              }`}
            >
              {label} <span className="font-mono tabular-nums">{counts[k]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.length === 0 && (
          <p className="px-4 py-7 text-center text-[13px] text-muted">
            {query ? 'Nobody matches that.' : filter === 'waiting' ? 'Nobody is waiting on a reply. 🎉' : 'No conversations here.'}
          </p>
        )}
        {list.slice(0, SHOWN).map((l) => (
          <button
            key={l.id} type="button" onClick={() => onSelect(l.id)}
            aria-current={selectedId === l.id ? 'true' : undefined}
            className={`flex min-h-16 w-full cursor-pointer items-center gap-3 border-b border-edge px-3.5 py-3 text-left hover:bg-raise ${selectedId === l.id ? 'bg-raise' : ''}`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/8 text-sm font-bold text-ink">
              {initials(l.name, l.phone)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <span className="truncate text-[15px] font-semibold text-ink">{l.name || l.phone}</span>
                <span className="shrink-0 font-mono text-[11px] text-muted">{timeOf(l.lastActivityAt)}</span>
              </div>
              {/* The number, always, when there is a name: a WhatsApp profile
                  name is whatever the customer typed into their own phone, so
                  two "Thabo"s are indistinguishable, and the number is what
                  the owner calls back on (Baltmore, SendUs). */}
              {l.name && <div className="font-mono text-[11.5px] text-muted">{l.phone}</div>}
              {showBusiness && l.business && <div className="truncate text-[11.5px] text-cyan">{l.business}</div>}
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="truncate text-[13px] text-muted">{l.lastText || 'No messages yet'}</span>
                {l.waitingSince ? (
                  <span className="shrink-0 rounded-full bg-amber/15 px-2 py-0.5 font-mono text-[11px] font-bold text-amber" title="Waiting on a reply from us">
                    {ago(l.waitingSince, now)}
                  </span>
                ) : l.takenOver ? (
                  <span className="shrink-0 rounded-full bg-cyan/12 px-2 py-0.5 text-[11px] text-cyan">you</span>
                ) : null}
              </div>
            </div>
          </button>
        ))}
        {list.length > SHOWN && (
          <p className="px-4 py-4 text-center text-xs text-muted">
            Showing the first {SHOWN} of {list.length}. Search to find anyone else.
          </p>
        )}
      </div>
    </div>
  );
}
