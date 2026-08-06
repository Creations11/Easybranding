// src/components/ActionRail.jsx
//
// Items can now be CLOSED, POSTPONED or ANNOTATED. The rail is derived from
// live data, so before that the only response to an item was to fix the
// underlying thing or see it again tomorrow — wrong for work handled outside
// the system (an EFT seen in the bank) and for work that is real but not
// today. A rail that cannot record "dealt with" or "chase it Monday" becomes
// a list nobody reads.
//
// "What needs you today", at the top of Operations.
//
// Phase 2 of the dashboard plan. Every other panel on this screen reports
// STATE — how many leads, in which column, at what stage — and leaves the
// prioritisation to whoever is reading it. This one reports WORK, ranked, so
// the board can answer "is today fine?" before you have read a single row.
//
// Ranking, thresholds and wording all come from the server
// (services/owedWorkService.js) so the same judgement applies wherever this
// is rendered, and so the rules live next to the data they interrogate.

import { useState } from 'react';
import api from '../api';

const SEVERITY = {
  high:   { label: 'Now',   key: 'red' },
  medium: { label: 'Soon',  key: 'amber' },
  low:    { label: 'Later', key: 'muted' },
};

// Severity is carried by the chip TEXT as well as its colour. A red dot alone
// fails a colourblind viewer and a washed-out phone screen in sunlight, which
// is where this board is actually read.
const KIND_LABEL = {
  payment_pending:  'Payment',
  invoice_overdue:  'Invoice',
  takeover_idle:    'Takeover',
  send_failed:      'Delivery',
  awaiting_reply:   'Unanswered',
};

export default function ActionRail({ query, colors, onOpenLead }) {
  const c = colors;
  const { data, isLoading, isError, refetch } = query || {};
  const items = data?.items || [];
  const total = data?.total ?? 0;

  // Which item is open for editing, and what is being typed into it.
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ note: '', label: '' });
  const [busy, setBusy] = useState(null);
  const [failed, setFailed] = useState(null);

  // Close / postpone / annotate. The rail is derived live, so an item can
  // only be answered by recording what the owner DID about it — see
  // models/OwedWorkAction.js.
  //
  // A failure must be visible. Silently leaving an item on the board after
  // "Close" was pressed teaches the owner the buttons are unreliable, and
  // then they stop using the rail rather than reporting it.
  const act = async (item, body) => {
    // NOT disabled while in flight. `disabled={busy === item.id}` was the one
    // structural difference between these buttons and "Add note", and the
    // owner reported for two days that Add note worked and the others did
    // not — the exact symptom of a stuck busy flag. The server action is an
    // upsert keyed on the item, so a double click is harmless; a button that
    // can wedge is not.
    setBusy(item.id);
    setFailed(null);
    // Belt and braces: even if the request never settles, the label stops
    // saying "Closing…" rather than leaving the row looking broken.
    const release = setTimeout(() => setBusy(null), 8000);
    try {
      await api.post(`/admin-ops/owed-work/${encodeURIComponent(item.id)}/action`, body);
      setEditing(null);
      await refetch?.();
    } catch (err) {
      // Deliberately does NOT say "nothing changed". On 2026-08-06 the
      // server wrote the action and THEN threw on a missing import, so the
      // owner was told nothing had changed while four items had in fact
      // been closed and snoozed. A failure message can only honestly report
      // what it knows: the request failed. Refresh, don't assume.
      setFailed({
        id: item.id,
        msg: (err.response?.data?.message || 'That did not go through.') + ' Refresh to see the current state.',
      });
    } finally {
      clearTimeout(release);
      setBusy(null);
    }
  };

  const btn = (tone) => ({
    padding: '4px 10px', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer',
    background: tone + '18', color: tone, border: '1px solid ' + tone + '3a',
    borderRadius: 7, whiteSpace: 'nowrap',
  });

  const shell = (children) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: c.text }}>Needs you</h3>
        {total > items.length && (
          <span style={{ fontSize: 12, color: c.amber }}>
            showing {items.length} of {total}
          </span>
        )}
      </div>
      {children}
    </div>
  );

  if (isLoading) {
    return shell(<div style={{ fontSize: 13, color: c.muted }}>Checking what needs attention…</div>);
  }

  // Same three-state discipline as the leads columns: a failed check must not
  // look like a clean board. "Nothing needs you" is the single most reassuring
  // thing this panel can say, so it must never be said on missing data.
  if (isError) {
    return shell(
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        background: c.red + '11', border: '1px solid ' + c.red + '33', borderRadius: 12,
      }}>
        <span style={{ fontSize: 13, color: c.red }}>
          Couldn't check for outstanding work — this is not an all-clear.
        </span>
        <button
          onClick={() => refetch?.()}
          style={{
            padding: '5px 12px', background: c.red + '22', color: c.red,
            border: '1px solid ' + c.red + '44', borderRadius: 8,
            cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!items.length) {
    return shell(
      <div style={{
        padding: '12px 16px', background: c.card, border: '1px solid ' + c.borderDim,
        borderRadius: 12, fontSize: 13, color: c.sage,
      }}>
        Nothing outstanding — no unanswered customers, unconfirmed payments, overdue invoices, idle takeovers or failed sends.
      </div>
    );
  }

  // 66 items, 35 of them R10/R25 invoices left over from development, is not
  // a per-item job — and closing them one at a time replaces each row with an
  // identical-looking one, which is how this rail came to look broken.
  //
  // Only offered for a kind with several items: a "clear all" next to two
  // rows is noise, and next to one row it is a trap.
  const counts = data?.counts || {};
  const bulkable = Object.entries(counts).filter(([, n]) => n >= 5);

  const bulk = async (kind, state, snoozeHours) => {
    const label = KIND_LABEL[kind] || kind;
    if (state === 'closed' && !window.confirm(
      `Close all ${counts[kind]} ${label.toLowerCase()} items? They will not come back.`
    )) return;
    setBusy('bulk:' + kind);
    setFailed(null);
    try {
      await api.post('/admin-ops/owed-work/bulk', { kind, state, snoozeHours });
      await refetch?.();
    } catch (err) {
      setFailed({ id: 'bulk:' + kind, msg: err.response?.data?.message || 'That did not go through. Refresh to see the current state.' });
    } finally { setBusy(null); }
  };

  return shell(
    <div>
      {bulkable.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          marginBottom: 10, padding: '9px 12px', background: c.card,
          border: '1px solid ' + c.borderDim, borderRadius: 10,
        }}>
          <span style={{ fontSize: 11, color: c.muted }}>Clear a whole group:</span>
          {bulkable.map(([kind, n]) => (
            <button
              key={kind}
              onClick={() => bulk(kind, 'closed')}
              disabled={busy === 'bulk:' + kind}
              title={`Close all ${n} — they will not come back`}
              style={btn(c.sage)}
            >
              {busy === 'bulk:' + kind ? 'Clearing…' : `✓ ${KIND_LABEL[kind] || kind} (${n})`}
            </button>
          ))}
          {failed?.id?.startsWith('bulk:') && (
            <span style={{ fontSize: 12, color: c.red }}>{failed.msg}</span>
          )}
        </div>
      )}
      {items.map((item) => {
        const sev = SEVERITY[item.severity] || SEVERITY.low;
        const tone = c[sev.key] || c.muted;
        const clickable = Boolean(item.leadId && onOpenLead);

        return (
          <div
            key={item.id}
            onClick={clickable ? () => onOpenLead(item.leadId) : undefined}
            className={clickable ? 'card-hover' : undefined}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              background: c.card,
              // A left rule carries severity as FORM, not just colour, and
              // survives being read at a glance from across a desk.
              borderLeft: '3px solid ' + tone,
              border: '1px solid ' + c.borderDim,
              borderLeftWidth: 3, borderLeftColor: tone,
              borderRadius: 12, padding: '13px 16px', marginBottom: 8,
              cursor: clickable ? 'pointer' : 'default',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
                  color: tone, background: tone + '1a', border: '1px solid ' + tone + '33',
                  borderRadius: 6, padding: '2px 7px',
                }}>
                  {sev.label}
                </span>
                <span style={{ fontSize: 11, color: c.muted }}>{KIND_LABEL[item.kind] || item.kind}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{item.title}</span>
              </div>
              <div style={{ fontSize: 12, color: c.muted, lineHeight: 1.5 }}>{item.detail}</div>

              {/* A note the owner left. Shown on the card because a note
                  nobody sees is the same as no note. */}
              {item.note && (
                <div style={{
                  marginTop: 8, fontSize: 12, color: c.text, lineHeight: 1.5,
                  background: c.lime + '10', border: '1px solid ' + c.lime + '2a',
                  borderRadius: 8, padding: '7px 10px',
                }}>
                  📝 {item.note}
                </div>
              )}

              {/* Back because it was postponed, not because it is new. */}
              {item.wasSnoozed && (
                <div style={{ marginTop: 6, fontSize: 11, color: c.amber }}>
                  ⏰ You postponed this — it is due again.
                </div>
              )}

              {failed?.id === item.id && (
                <div style={{ marginTop: 8, fontSize: 12, color: c.red }}>{failed.msg}</div>
              )}

              {editing === item.id ? (
                <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 10 }}>
                  <input
                    autoFocus
                    value={draft.label}
                    onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                    placeholder="Label (optional) — e.g. the customer's name"
                    style={{
                      width: '100%', marginBottom: 6, padding: '7px 10px', fontSize: 12,
                      fontFamily: 'inherit', background: c.bg, color: c.text,
                      border: '1px solid ' + c.borderDim, borderRadius: 8,
                    }}
                  />
                  <textarea
                    value={draft.note}
                    onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                    placeholder="Note — what is actually happening with this?"
                    rows={2}
                    style={{
                      width: '100%', padding: '7px 10px', fontSize: 12, fontFamily: 'inherit',
                      background: c.bg, color: c.text, border: '1px solid ' + c.borderDim,
                      borderRadius: 8, resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <button
                      onClick={() => act(item, { state: 'note', note: draft.note, label: draft.label })}
                        style={btn(c.lime)}
                    >
                      {busy === item.id ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => setEditing(null)} style={btn(c.muted)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}
                >
                  <button
                    onClick={() => act(item, { state: 'closed' })}
                    title="Dealt with — do not show this again"
                    style={btn(c.sage)}
                  >
                    {busy === item.id ? 'Working…' : '✓ Close'}
                  </button>
                  <button
                    onClick={() => act(item, { state: 'snoozed', snoozeHours: 24 })}
                    title="Real, but not today — back tomorrow"
                    style={btn(c.amber)}
                  >
                    ⏰ Tomorrow
                  </button>
                  <button
                    onClick={() => act(item, { state: 'snoozed', snoozeHours: 24 * 7 })}
                    title="Back in a week"
                    style={btn(c.amber)}
                  >
                    Next week
                  </button>
                  <button
                    onClick={() => { setEditing(item.id); setDraft({ note: item.note || '', label: item.label || '' }); }}
                    style={btn(c.lime)}
                  >
                    {item.note || item.label ? '✎ Edit note' : '✎ Add note'}
                  </button>
                </div>
              )}
            </div>
            {clickable && (
              <span style={{ fontSize: 11, color: c.lime, whiteSpace: 'nowrap', paddingTop: 2 }}>
                Open →
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
