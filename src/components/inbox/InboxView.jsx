// src/components/inbox/InboxView.jsx
//
// The WhatsApp API page's Inbox: where you talk to customers.
//
// Replaced two things on 2026-10-21 (Ayanda: "move it into WhatsApp API
// inbox"). The old Inbox was read-only cards of recent messages, and the old
// Chat tab was its own page in WhatsApp's own colours that listed only
// "active" leads and never refreshed an open conversation, so a customer's
// reply appeared only after you sent something.
//
// This is one place for both:
//
//   list     every conversation, from the CRM's own query, so "waiting on
//            us" is the same number as the page's headline; filtered by
//            waiting / open / taken over / follow-ups due / closed, the
//            most recent first.
//   thread   the conversation, refreshed every few seconds while open, and
//            the take-over rule and the out-of-window hold, unchanged.
//   details  stage, notes and follow-up beside it on a wide screen.
//
// On a phone it is one pane at a time: the list sits in the page, and a
// conversation takes the whole screen with a back arrow, because a chat app
// owns the screen until you leave it and the composer has to sit exactly
// above the keyboard.
import { useMemo, useState } from 'react';
import useMediaQuery, { MOBILE_QUERY } from '../../hooks/useMediaQuery';
import { useCrmLeads } from '../../hooks/useCrm';
import Button from '../ui/Button';
import ConversationList from './ConversationList';
import Thread from './Thread';
import LeadPanel from './LeadPanel';
import BroadcastPanel from './BroadcastPanel';

const WIDE = '(min-width: 1280px)';
const NONE = [];

export default function InboxView({ scope, showBusiness, businessName, onOpenRecord }) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const isWide = useMediaQuery(WIDE);
  const crmQ = useCrmLeads(scope);
  const leads = crmQ.data?.leads || NONE;
  const now = crmQ.dataUpdatedAt;

  const waitingCount = useMemo(() => leads.filter((l) => l.waitingSince).length, [leads]);
  const [filter, setFilter] = useState(null); // null until chosen: waiting if anyone is, else all open
  const shownFilter = filter ?? (waitingCount ? 'waiting' : 'open');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [details, setDetails] = useState(false);
  const [broadcast, setBroadcast] = useState({ open: false, text: '', preview: null, result: null, busy: false });

  const selected = leads.find((l) => l.id === selectedId) || null;
  // A platform login has no business of its own: "Message everyone" needs a
  // client chosen in Viewing, and says which one.
  const canBroadcast = !showBusiness || !!scope;

  const list = (
    <ConversationList
      leads={leads} filter={shownFilter} setFilter={setFilter} query={query} setQuery={setQuery}
      selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setDetails(false); }}
      showBusiness={showBusiness} now={now}
    />
  );

  const toolbar = (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <p className="text-[13px] text-muted">
        {crmQ.isPending ? 'Loading conversations…' : `${leads.length} conversations${waitingCount ? ` · ${waitingCount} waiting on us` : ''}`}
      </p>
      {canBroadcast ? (
        <Button variant="secondary" onClick={() => setBroadcast({ open: true, text: '', preview: null, result: null, busy: false })}>
          📣 Message everyone{scope && businessName ? ` at ${businessName}` : ''}
        </Button>
      ) : (
        <span className="text-xs text-muted">Pick a client in Viewing to message all their customers.</span>
      )}
    </div>
  );

  const broadcastPanel = broadcast.open && (
    <BroadcastPanel state={broadcast} setState={setBroadcast} scope={scope} business={scope ? businessName : ''} />
  );

  // ── Phone ────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div>
        {toolbar}
        <div className="overflow-hidden rounded-xl border border-edge bg-surface">{list}</div>
        {selectedId && (
          <div className="fixed inset-0 z-[900] flex min-h-0 flex-col bg-ground">
            {details && selected ? (
              <LeadPanel lead={selected} now={now} onClose={() => setDetails(false)} onOpenRecord={() => onOpenRecord(selectedId)} />
            ) : (
              <Thread
                leadId={selectedId} isMobile business={showBusiness ? selected?.business : ''}
                onBack={() => setSelectedId(null)} onDetails={selected ? () => setDetails(true) : undefined}
              />
            )}
          </div>
        )}
        {broadcastPanel}
      </div>
    );
  }

  // ── Desktop: list | thread | details ─────────────────────────
  return (
    <div>
      {toolbar}
      <div className="flex h-[calc(100vh-300px)] min-h-[440px] overflow-hidden rounded-[14px] border border-edge">
        <div className="flex w-[340px] shrink-0 flex-col border-r border-edge bg-surface">{list}</div>
        {selectedId ? (
          <Thread
            leadId={selectedId} business={showBusiness ? selected?.business : ''}
            onDetails={!isWide && selected ? () => setDetails((d) => !d) : undefined}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-ground">
            <p className="text-sm text-muted">Pick a conversation to read it.</p>
          </div>
        )}
        {selected && (isWide || details) && (
          <div className="w-[300px] shrink-0 border-l border-edge">
            <LeadPanel lead={selected} now={now} onOpenRecord={() => onOpenRecord(selectedId)} onClose={isWide ? undefined : () => setDetails(false)} />
          </div>
        )}
      </div>
      {broadcastPanel}
    </div>
  );
}
