// src/components/DeliveryTab.jsx
// ─────────────────────────────────────────────────────────────
// The delivery business, on a screen.
//
// Everything this shows has until now existed only inside WhatsApp: the
// owner typed ORDERS, DRIVERS, MONEY, PAYOUTS, KYC and read the replies. That
// works on a phone at the side of the road and is miserable at a desk with
// twenty jobs moving, because each answer replaces the last and nothing can
// be looked at side by side.
//
// ── What it talks to ──────────────────────────────────────────
//
// /api/delivery/*, which is the SAME data the WhatsApp commands read, behind
// the dashboard's own login. It deliberately does not use /api/v1/deliveries:
// that one authenticates with an API key, and an API key in a browser is a
// key given to anybody who opens the developer tools.
//
// Drivers and shops are also managed here (add, edit, suspend, approve,
// remove) through /api/delivery/manage, since 2026-10-07. Money is not:
// payouts and how a shop is paid stay on WhatsApp.
//
// ── Deliberate shape ──────────────────────────────────────────
//
// Four sections, because the owner asks four different questions and they
// have different urgencies: what is moving right now, who can carry it, who
// is paying, and what the books say.
//
// Orders refresh on a timer; the rest do not. A delivery changes every few
// minutes and a driver's papers change once. Polling everything would be
// noise and, on a phone on data, somebody's airtime. The order you have open
// refreshes with the list, so its history never goes stale under your eyes.
//
// Every call is a react-query query, keyed by business (since 2026-10-05).
// The key is what keeps one shop's answer out of another shop's screen; it
// replaced a hand-rolled "ticket" that did the same job less reliably.
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { colors } from '../utils/theme';
import { useDeliveryManage, useShopCategories, manageErrorMessage } from '../hooks/useDeliveryManage';

const REFRESH_MS = 20000;

const STATUS_STYLE = {
  pending:    { label: 'waiting',     tint: colors.amber },
  assigned:   { label: 'accepted',    tint: colors.cyan },
  collected:  { label: 'collected',   tint: colors.cyan },
  on_the_way: { label: 'on the way',  tint: colors.sage },
  arrived:    { label: 'at the door', tint: colors.sage },
  delivered:  { label: 'delivered',   tint: colors.emerald },
  failed:     { label: 'stopped',     tint: colors.red },
};

const MOVING = ['assigned', 'collected', 'on_the_way', 'arrived'];

const money = (n) => (n == null ? '—' : `R${Number(n).toFixed(2).replace(/\.00$/, '')}`);

// floor, not round: 89 minutes is "1h ago", not "2h ago".
const ago = (iso) => {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
};

// Paid, nobody carrying it. The only state where someone at this screen can
// change the outcome, so it is defined once and used everywhere.
const isUnclaimed = (d) => d.status === 'pending' && d.paymentStatus === 'paid' && !d.driverName;

const Chip = ({ text, tint }) => (
  <span style={{
    background: `${tint}1A`, color: tint, border: `1px solid ${tint}40`,
    borderRadius: '999px', padding: '2px 10px', fontSize: '11px', fontWeight: 600,
    whiteSpace: 'nowrap',
  }}>{text}</span>
);

const Card = ({ children, onClick, active }) => {
  // Clickable cards are real buttons to the keyboard and to screen readers.
  // The target check keeps Enter on an inner link from also toggling the card.
  const key = onClick
    ? (e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      }
    : undefined;
  return (
    <div
      onClick={onClick}
      onKeyDown={key}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-expanded={onClick ? !!active : undefined}
      style={{
        background: colors.card,
        border: `1px solid ${active ? colors.lime : colors.borderDim}`,
        borderRadius: '12px', padding: '14px', marginBottom: '10px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >{children}</div>
  );
};

/** Says what is actually true, rather than "no data". */
const Empty = ({ children }) => (
  <div style={{
    color: colors.muted, fontSize: '13px', padding: '28px 14px',
    textAlign: 'center', border: `1px dashed ${colors.borderDim}`, borderRadius: '12px',
  }}>{children}</div>
);

const Row = ({ left, right }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', margin: '3px 0', fontSize: '13px' }}>
    <span style={{ color: colors.muted }}>{left}</span>
    <span style={{ color: colors.text, textAlign: 'right' }}>{right}</span>
  </div>
);

const pill = (selected, tint = colors.lime) => ({
  background: selected ? `${tint}1A` : 'transparent',
  border: `1px solid ${selected ? tint : colors.borderDim}`,
  color: selected ? tint : colors.muted,
  borderRadius: '999px', padding: '7px 14px', cursor: 'pointer',
  fontSize: '13px', fontWeight: selected ? 600 : 400,
});

const NONE = [];
const unwrap = (r) => r.data?.data ?? r.data;

// The roles that carry no business of their own and pick one (see below).
const PLATFORM_ROLES = ['super_admin', 'eb_manager', 'eb_agent'];
const storedRole = () => {
  try { return JSON.parse(localStorage.getItem('eb_user') || '{}').role; }
  catch { return undefined; }
};

export default function DeliveryTab() {
  // Which business is being looked at. A tenant's own admin never sets this —
  // their session already names one. A PLATFORM role (super_admin,
  // eb_manager, eb_agent) carries no tenant at all, so it picks one, and
  // every call below carries the choice. Getting this wrong hid the tab from
  // the only person who runs deliveries (2026-10-01).
  const [tenantId, setTenantId] = useState(null);
  const [section, setSection] = useState('orders');
  const [open, setOpen] = useState(null);          // the reference being looked at
  const qc = useQueryClient();

  const scope = tenantId ?? '';
  const q = tenantId ? `?tenantId=${tenantId}` : '';
  const scoped = (path) => () => api.get(`/delivery/${path}${q}`).then(unwrap);

  // The session's own overview, always asked for. For a business owner it IS
  // the overview. For a platform role it carries the businesses to pick from,
  // and staying subscribed to it is what keeps that list, and the "Another
  // business" button, after one is picked: the scoped overview stops
  // answering needsTenant once a business is named, and recomputing the list
  // from that answer is what once took the way back away.
  const home = useQuery({ queryKey: ['delivery', '', 'overview'], queryFn: () => api.get('/delivery/overview').then(unwrap) });
  const choices = home.data?.needsTenant ? home.data.tenants || NONE : NONE;

  // A platform session has nothing to show until a business is named. Asking
  // anyway only collects refusals, and their retries, before the picker can
  // appear. A business owner's panels all load at once, as they always did.
  const canLoad = !!tenantId || !PLATFORM_ROLES.includes(storedRole());

  // Only the moving part polls: the order list, and the one order that is
  // open, so its history keeps up with the list above it.
  const polling = section === 'orders' ? REFRESH_MS : false;

  const scopedOverview = useQuery({ queryKey: ['delivery', scope, 'overview'], queryFn: scoped('overview'), enabled: !!tenantId });
  const overviewQ   = tenantId ? scopedOverview : home;
  const ordersQ     = useQuery({ queryKey: ['delivery', scope, 'orders'], queryFn: scoped('orders'), enabled: canLoad, refetchInterval: polling });
  const driversQ    = useQuery({ queryKey: ['delivery', scope, 'drivers'], queryFn: scoped('drivers'), enabled: canLoad });
  const businessesQ = useQuery({ queryKey: ['delivery', scope, 'businesses'], queryFn: scoped('businesses'), enabled: canLoad });
  const payoutsQ    = useQuery({ queryKey: ['delivery', scope, 'payouts'], queryFn: scoped('payouts'), enabled: canLoad });

  const data = {
    overview: overviewQ.data ?? null,
    orders: ordersQ.data ?? NONE,
    drivers: driversQ.data ?? NONE,
    businesses: businessesQ.data ?? NONE,
    payouts: payoutsQ.data ?? null,
  };

  // One failing panel must not blank the other four; a banner says which,
  // and the rest still work. The page waits for every panel's first answer,
  // success or failure, as the old allSettled loader did.
  const panels = [[overviewQ, 'the summary'], [ordersQ, 'orders'], [driversQ, 'drivers'], [businessesQ, 'businesses'], [payoutsQ, 'payouts']];
  const loading = panels.some(([query]) => query.isPending && query.fetchStatus !== 'idle');
  const failed = panels.filter(([query]) => query.isError).map(([, name]) => name);
  const problem = failed.length ? `Could not load ${failed.join(', ')}. Everything else below is current.` : '';
  const updatedAt = ordersQ.dataUpdatedAt ? new Date(ordersQ.dataUpdatedAt).toISOString() : null;
  const load = () => qc.invalidateQueries({ queryKey: ['delivery'] });

  const detailQ = useQuery({
    queryKey: ['delivery', scope, 'order', open],
    queryFn: () => api.get(`/delivery/orders/${open}${q}`).then(unwrap),
    enabled: !!open,
    refetchInterval: polling,
  });
  // A failed first open says so; a failed refresh keeps what was on screen.
  const detail = !open ? null
    : detailQ.data ?? (detailQ.isError ? { error: 'That order could not be opened.' } : null);

  const openOrder = useCallback((reference) => setOpen(reference), []);

  // Switching business needs no clearing: every query is keyed by business,
  // so the new one starts empty and loading, and nothing of the previous
  // shop's can appear under the new shop's name.
  const pickBusiness = (id) => {
    setOpen(null);
    setTenantId(id);
  };

  if (loading && !choices.length) {
    return <div style={{ padding: '60px', textAlign: 'center', color: colors.muted }}>Loading deliveries…</div>;
  }

  // Nobody has named a business yet, and this session has no tenant of its
  // own. One tap rather than a dropdown: there are two or three of these, not
  // twenty, and a list you can read is faster than a control you must open.
  if (choices.length > 0 && !tenantId) {
    return (
      <div>
        <div style={{ color: colors.muted, fontSize: '13px', marginBottom: '14px' }}>
          Which delivery business?
        </div>
        {choices.map((t) => (
          <Card key={t.id} onClick={() => pickBusiness(t.id)}>
            <div style={{ color: colors.text, fontWeight: 600, fontSize: '14px' }}>{t.name}</div>
          </Card>
        ))}
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: colors.muted }}>Loading deliveries…</div>;
  }

  if (data.overview && data.overview.enabled === false) {
    return <Empty>This business does not run deliveries.</Empty>;
  }

  const o = data.overview;
  const unclaimedCount = data.orders.filter(isUnclaimed).length;
  const sections = [
    ['orders', `📦 Orders${o?.open ? ` (${o.open})` : ''}`],
    ['drivers', '🛵 Drivers'],
    ['businesses', '🏪 Businesses'],
    ['money', '💰 Money'],
  ];

  return (
    <div>
      {problem && (
        <div style={{
          background: `${colors.amber}14`, border: `1px solid ${colors.amber}40`, color: colors.amber,
          borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
        }}>
          <span>{problem}</span>
          <button
            onClick={load}
            style={{
              background: 'transparent', border: `1px solid ${colors.amber}60`, color: colors.amber,
              borderRadius: '999px', padding: '4px 12px', cursor: 'pointer', fontSize: '12px',
            }}
          >Try again</button>
        </div>
      )}

      {/* The four questions, as four buttons. */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {sections.map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setSection(key); openOrder(null); }}
            style={pill(section === key)}
          >{label}{key === 'orders' && unclaimedCount > 0 ? ' ●' : ''}</button>
        ))}
        <button onClick={load} style={{ ...pill(false), marginLeft: 'auto' }}>↻ Refresh</button>
        {choices.length > 0 && (
          <button onClick={() => { setTenantId(null); setOpen(null); }} style={pill(false)}>
            ⇄ Another business
          </button>
        )}
      </div>

      {section === 'orders' && (
        <Orders orders={data.orders} open={open} onOpen={openOrder} detail={detail} updatedAt={updatedAt} />
      )}
      {section === 'drivers' && <Drivers drivers={data.drivers} q={q} />}
      {section === 'businesses' && <Businesses businesses={data.businesses} q={q} />}
      {section === 'money' && <Money overview={o} payouts={data.payouts} />}
    </div>
  );
}

const FILTERS = [
  ['all',       'All',             () => true],
  ['attention', 'Needs attention', (d) => isUnclaimed(d) || d.status === 'failed'],
  ['moving',    'Moving',          (d) => MOVING.includes(d.status)],
  ['done',      'Delivered',       (d) => d.status === 'delivered'],
];

function Orders({ orders, open, onOpen, detail, updatedAt }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    const c = {};
    FILTERS.forEach(([key,, test]) => { c[key] = orders.filter(test).length; });
    return c;
  }, [orders]);

  const shown = useMemo(() => {
    const test = FILTERS.find(([key]) => key === filter)[2];
    const needle = search.trim().toLowerCase();
    const hit = (d) => !needle || [d.reference, d.customerName, d.customerPhone, d.driverName, d.vendorName]
      .some((v) => v && String(v).toLowerCase().includes(needle));

    // The ones nobody is carrying come first: they are the only ones where
    // somebody looking at this screen can change the outcome.
    return orders
      .filter((d) => test(d) && hit(d))
      .sort((a, b) => (isUnclaimed(a) ? 0 : 1) - (isUnclaimed(b) ? 0 : 1)
        || new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, filter, search]);

  if (!orders.length) {
    // The endpoint returns anything still moving, whatever its age, plus
    // everything from the last 24 hours (deliveryDashboardController's
    // todaysFilter) — so an empty list is not "none ever", and saying "today"
    // or "yet" would both be wrong once there is older history.
    return <Empty>Nothing in the last 24 hours, and nothing still moving. Orders appear here the moment a customer places one, or a shop sends NEW DELIVERY.</Empty>;
  }

  return (
    <div>
      {counts.attention > 0 && filter !== 'attention' && (
        <div
          onClick={() => setFilter('attention')}
          style={{
            background: `${colors.red}14`, border: `1px solid ${colors.red}40`, color: colors.red,
            borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', cursor: 'pointer',
          }}
        >
          {counts.attention} order{counts.attention === 1 ? ' needs' : 's need'} attention. Tap to see {counts.attention === 1 ? 'it' : 'them'}.
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{ ...pill(filter === key, key === 'attention' && counts.attention > 0 ? colors.red : colors.lime), padding: '5px 12px', fontSize: '12px' }}
          >{label} ({counts[key]})</button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Find by reference, customer, driver or shop"
        aria-label="Find an order"
        style={{
          width: '100%', boxSizing: 'border-box', background: colors.card, color: colors.text,
          border: `1px solid ${colors.borderDim}`, borderRadius: '10px',
          padding: '9px 12px', fontSize: '13px', marginBottom: '6px',
        }}
      />
      {updatedAt && (
        <div style={{ color: colors.muted, fontSize: '11px', marginBottom: '12px' }}>
          Updated {ago(updatedAt)} · refreshes every {REFRESH_MS / 1000}s
        </div>
      )}

      {!shown.length && <Empty>No orders match that.</Empty>}

      {shown.map((d) => {
        const s = STATUS_STYLE[d.status] || { label: d.status, tint: colors.muted };
        const isOpen = open === d.reference;
        return (
          <Card key={d.reference} active={isOpen} onClick={() => onOpen(isOpen ? null : d.reference)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
              <div style={{ color: colors.text, fontWeight: 600, fontSize: '14px' }}>
                {d.reference}
                {d.orderSource === 'BUSINESS_WHATSAPP' && (
                  <span style={{ color: colors.muted, fontWeight: 400, fontSize: '12px' }}> · sent by {d.vendorName || 'a shop'}</span>
                )}
              </div>
              <Chip text={s.label} tint={s.tint} />
            </div>

            <div style={{ color: colors.muted, fontSize: '12px', marginTop: '6px' }}>
              {d.customerName || d.customerPhone} · {d.driverName || 'no driver yet'} · {ago(d.createdAt)}
              {d.total != null && ` · ${money(d.total)}`}
            </div>

            {isUnclaimed(d) && (
              <div style={{ color: colors.red, fontSize: '12px', marginTop: '6px' }}>
                Paid, and nobody has taken it.
              </div>
            )}

            {isOpen && (
              <div style={{ marginTop: '12px', borderTop: `1px solid ${colors.borderDim}`, paddingTop: '12px' }}>
                {!detail && <div style={{ color: colors.muted, fontSize: '13px' }}>Opening…</div>}
                {detail?.error && <div style={{ color: colors.red, fontSize: '13px' }}>{detail.error}</div>}
                {detail && !detail.error && (
                  <>
                    <Row left="Customer" right={`${detail.customerName || '—'} · ${detail.customerPhone}`} />
                    <Row left="Where" right={detail.dropoffAddress || 'a shared pin'} />
                    {detail.deliveryInstructions && <Row left="Note" right={detail.deliveryInstructions} />}
                    {detail.parcelDescription && <Row left="Parcel" right={detail.parcelDescription} />}
                    <Row left="Shop" right={detail.vendorName || '—'} />
                    <Row left="Driver" right={detail.driverName || 'nobody has accepted it'} />
                    {detail.quotedKm != null && (
                      <Row
                        left="Distance"
                        right={`${detail.quotedKm} km${detail.distanceSource === 'ESTIMATED' ? ' (estimated)' : ' by road'}`}
                      />
                    )}
                    <Row left="Total" right={money(detail.total)} />
                    {/* Three fees, never one — whose money is whose. */}
                    <Row left="Driver earns" right={money(detail.driverFee)} />
                    <Row left="We keep" right={money(detail.kasiFee)} />
                    {detail.trackingUrl && (
                      <div style={{ marginTop: '10px' }}>
                        <a
                          href={detail.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: colors.lime, fontSize: '13px' }}
                        >
                          Open the customer's tracking page ↗
                        </a>
                      </div>
                    )}
                    {detail.history?.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {detail.history.map((h, i) => (
                          <div key={i} style={{ color: colors.muted, fontSize: '12px', margin: '2px 0' }}>
                            {(STATUS_STYLE[h.status]?.label) || h.status} · {ago(h.at)}
                            {h.note ? ` · ${h.note}` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ── Managing drivers and shops (useDeliveryManage) ───────────
//
// Since 2026-10-07 the owner can do here what ADDDRIVER, REMOVEDRIVER,
// SUSPENDDRIVER, VERIFYDRIVER, ADDSHOP and APPROVESHOP do on WhatsApp. The API
// enforces the same rules and says why when it refuses, and that sentence is
// shown as it is. Anything that messages a driver or a shop says so in its
// confirmation first. Money (payouts, how a shop is paid) is still WhatsApp.

const input = {
  width: '100%', boxSizing: 'border-box', background: colors.card, color: colors.text,
  border: `1px solid ${colors.borderDim}`, borderRadius: '10px', padding: '8px 12px', fontSize: '13px',
};
const act = (tint, disabled) => ({
  background: `${tint}14`, color: tint, border: `1px solid ${tint}44`, borderRadius: '999px',
  padding: '5px 12px', fontSize: '12px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
});

/** Run an action; its outcome is the line under the card. */
function useRun() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const run = async (fn, ok) => {
    setBusy(true);
    try {
      const data = await fn();
      setResult({ tint: colors.emerald, text: typeof ok === 'function' ? ok(data) : ok });
      return data;
    } catch (err) {
      setResult({ tint: colors.red, text: manageErrorMessage(err) });
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { busy, result, run, clear: () => setResult(null) };
}

const Said = ({ result }) => (result ? (
  <div role="status" style={{ color: result.tint, fontSize: '12px', marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{result.text}</div>
) : null);

const Field = ({ label, children }) => (
  <label style={{ display: 'grid', gap: '4px', fontSize: '12px', color: colors.muted }}>{label}{children}</label>
);

const VEHICLES = [['', 'Not given'], ['motorbike', 'Motorbike'], ['motorcycle', 'Motorcycle'], ['car', 'Car']];

function DriverForm({ initial, submitLabel, onSubmit, onCancel, busy }) {
  const [f, setF] = useState({
    name: initial?.name || '', phone: initial?.phone || '', fullName: initial?.fullName || '',
    vehicleType: initial?.vehicleType || '', vehicleRegistration: initial?.vehicleRegistration || '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
      <Field label="Name on the job card"><input aria-label="Driver name" value={f.name} onChange={set('name')} style={input} /></Field>
      <Field label="Cellphone"><input aria-label="Driver phone" value={f.phone} onChange={set('phone')} placeholder="0821234567" style={input} /></Field>
      {initial && <Field label="Name on their licence"><input aria-label="Licence name" value={f.fullName} onChange={set('fullName')} style={input} /></Field>}
      <Field label="Vehicle">
        <select aria-label="Vehicle" value={f.vehicleType} onChange={set('vehicleType')} style={input}>
          {VEHICLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Field>
      <Field label="Registration"><input aria-label="Registration" value={f.vehicleRegistration} onChange={set('vehicleRegistration')} style={input} /></Field>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" disabled={busy} style={act(colors.lime, busy)}>{submitLabel}</button>
        <button type="button" onClick={onCancel} style={act(colors.muted, false)}>Cancel</button>
      </div>
    </form>
  );
}

/** Only the fields that changed, so an edit never re-sends what nobody touched. */
const changed = (before, after, keys) => {
  const out = {};
  for (const k of keys) {
    const a = typeof after[k] === 'string' ? after[k].trim() : after[k];
    const b = before[k] ?? (typeof a === 'boolean' ? false : '');
    if (String(a ?? '') !== String(b ?? '')) out[k] = a === '' ? null : a;
  }
  return out;
};

function AddDriver({ q }) {
  const { addDriver } = useDeliveryManage(q);
  const { busy, result, run, clear } = useRun();
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <div style={{ marginBottom: '12px' }}>
        <button onClick={() => { clear(); setOpen(true); }} style={act(colors.lime, false)}>+ Add driver</button>
        <Said result={result} />
      </div>
    );
  }
  const submit = async (f) => {
    const data = await run(
      () => addDriver({ name: f.name.trim(), phone: f.phone.trim(), vehicleType: f.vehicleType || null, vehicleRegistration: f.vehicleRegistration.trim() || null }),
      (d) => `${d.driver.name} is added. No real job reaches them until they have done one practice run and you have checked their papers.\n\nSend them this link to start: ${d.joinLink}`,
    );
    if (data) setOpen(false);
  };
  return (
    <Card>
      <div style={{ color: colors.text, fontWeight: 600, fontSize: '14px' }}>Add a driver</div>
      <DriverForm submitLabel="Add driver" onSubmit={submit} onCancel={() => setOpen(false)} busy={busy} />
      <Said result={result} />
    </Card>
  );
}

function DriverCard({ d, q }) {
  const m = useDeliveryManage(q);
  const { busy, result, run } = useRun();
  const [editing, setEditing] = useState(false);
  const who = d.name || d.phone;
  const suspended = d.status === 'suspended';
  const papersWaiting = d.kycStatus === 'pending';

  const save = async (f) => {
    const fields = changed(d, f, ['name', 'phone', 'fullName', 'vehicleType', 'vehicleRegistration']);
    if (!Object.keys(fields).length) { setEditing(false); return; }
    if (await run(() => m.updateDriver(d.phone, fields), `${f.name.trim() || who} is updated.`)) setEditing(false);
  };
  const suspend = () => {
    if (!window.confirm(`Suspend ${who}? No new jobs reach them, and their shift ends. They are not messaged.`)) return;
    run(() => m.suspendDriver(d.phone), (r) => `${who} is suspended.${r.carrying ? ` They are still out with ${r.carrying} job${r.carrying > 1 ? 's' : ''}: re-dispatch if they will not finish.` : ''}`);
  };
  const activate = () => {
    if (!window.confirm(`Make ${who} active again?`)) return;
    run(() => m.activateDriver(d.phone), `${who} is active again.`);
  };
  const verify = () => {
    if (!window.confirm(`Accept ${who}'s papers? They get a WhatsApp saying they are approved and can go online.`)) return;
    run(() => m.verifyDriver(d.phone), `${who}'s papers are accepted, and they have been told.`);
  };
  const reject = () => {
    const reason = window.prompt(`Why are ${who}'s papers not accepted? They get this on WhatsApp and are asked to send them again.`);
    if (reason && reason.trim()) run(() => m.rejectDriver(d.phone, reason.trim()), `${who} has been told, and asked to send their papers again.`);
  };
  const remove = () => {
    if (!window.confirm(`Remove ${who} from your drivers? What they are owed stays on the books.`)) return;
    run(() => m.removeDriver(d.phone), `${who} is removed.`);
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
        <div style={{ color: colors.text, fontWeight: 600, fontSize: '14px' }}>{who}</div>
        <Chip text={suspended ? 'suspended' : d.onShift ? 'on shift' : 'off'} tint={suspended ? colors.red : d.onShift ? colors.emerald : colors.muted} />
      </div>
      <div style={{ color: colors.muted, fontSize: '12px', marginTop: '6px' }}>
        {d.phone}{d.vehicleType ? ` · ${d.vehicleType}` : ''}{d.vehicleRegistration ? ` · ${d.vehicleRegistration}` : ''}
      </div>
      <div style={{ marginTop: '8px' }}>
        <Row left="Papers" right={d.kycStatus || 'not asked for'} />
        <Row left="Practice run" right={d.practiceDoneAt ? 'done' : d.practiceRequired ? 'not done — no jobs reach them' : 'not required'} />
        <Row left="Carrying" right={d.carrying || 'nothing'} />
        <Row left="Owed" right={money(d.owed)} />
      </div>
      {editing
        ? <DriverForm initial={d} submitLabel="Save" onSubmit={save} onCancel={() => setEditing(false)} busy={busy} />
        : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
            <button onClick={() => setEditing(true)} disabled={busy} style={act(colors.cyan, busy)}>Edit</button>
            {papersWaiting && <button onClick={verify} disabled={busy} style={act(colors.emerald, busy)}>Accept papers</button>}
            {papersWaiting && <button onClick={reject} disabled={busy} style={act(colors.amber, busy)}>Send papers back</button>}
            {suspended
              ? <button onClick={activate} disabled={busy} style={act(colors.emerald, busy)}>Activate</button>
              : <button onClick={suspend} disabled={busy} style={act(colors.amber, busy)}>Suspend</button>}
            <button onClick={remove} disabled={busy} style={act(colors.red, busy)}>Remove</button>
          </div>
        )}
      <Said result={result} />
    </Card>
  );
}

function Drivers({ drivers, q }) {
  // Who can take a job right now first, then who is owed the most.
  const sorted = [...drivers].sort((a, b) => (b.onShift ? 1 : 0) - (a.onShift ? 1 : 0) || (b.owed || 0) - (a.owed || 0));
  return (
    <div>
      <AddDriver q={q} />
      {!drivers.length && <Empty>No drivers yet, so orders come in and sit waiting. Add one above, or from WhatsApp with ADDDRIVER Name 082…</Empty>}
      {sorted.map((d) => <DriverCard key={d.phone} d={d} q={q} />)}
    </div>
  );
}

function ShopForm({ initial, submitLabel, onSubmit, onCancel, busy, categories }) {
  const [f, setF] = useState({
    name: initial?.name || '', category: initial?.category || '', phone: initial?.phone || '',
    contactName: initial?.contactName || '', address: initial?.address || '',
    commissionPct: initial?.commissionPct ?? 0, prepMinutes: initial?.prepMinutes ?? '',
    deliveryOnly: !!initial?.deliveryOnly,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
      <Field label="Shop name"><input aria-label="Shop name" value={f.name} onChange={set('name')} style={input} /></Field>
      <Field label="Category">
        <select aria-label="Category" value={f.category} onChange={set('category')} style={input}>
          <option value="">Choose…</option>
          {(categories || []).map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
        </select>
      </Field>
      <Field label="Shop's WhatsApp number"><input aria-label="Shop phone" value={f.phone} onChange={set('phone')} placeholder="0821234567" style={input} /></Field>
      <Field label="Contact person"><input aria-label="Contact person" value={f.contactName} onChange={set('contactName')} style={input} /></Field>
      {initial && <Field label="Address"><input aria-label="Address" value={f.address} onChange={set('address')} style={input} /></Field>}
      <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: colors.text }}>
        <input type="checkbox" aria-label="Delivery only" checked={f.deliveryOnly} onChange={(e) => setF({ ...f, deliveryOnly: e.target.checked })} />
        Delivery only (no menu, no commission)
      </label>
      {!f.deliveryOnly && (
        <Field label="Commission %"><input aria-label="Commission" type="number" min="0" max="100" step="0.5" value={f.commissionPct} onChange={set('commissionPct')} style={input} /></Field>
      )}
      {initial && <Field label="Preparation time, minutes"><input aria-label="Preparation minutes" type="number" min="0" max="240" value={f.prepMinutes} onChange={set('prepMinutes')} style={input} /></Field>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" disabled={busy} style={act(colors.lime, busy)}>{submitLabel}</button>
        <button type="button" onClick={onCancel} style={act(colors.muted, false)}>Cancel</button>
      </div>
    </form>
  );
}

function AddShop({ q, categories }) {
  const { addShop } = useDeliveryManage(q);
  const { busy, result, run, clear } = useRun();
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <div style={{ marginBottom: '12px' }}>
        <button onClick={() => { clear(); setOpen(true); }} style={act(colors.lime, false)}>+ Add shop</button>
        <Said result={result} />
      </div>
    );
  }
  const submit = async (f) => {
    const data = await run(
      () => addShop({
        name: f.name.trim(), category: f.category, phone: f.phone.trim(), contactName: f.contactName.trim() || null,
        deliveryOnly: f.deliveryOnly, commissionPct: f.deliveryOnly ? 0 : Number(f.commissionPct || 0),
      }),
      (d) => `${d.shop.name} is added, switched off until you approve it.\n\nSend the shop this link. It takes them through setting up: ${d.joinLink}\nJoin code: ${d.shop.joinCode}`,
    );
    if (data) setOpen(false);
  };
  return (
    <Card>
      <div style={{ color: colors.text, fontWeight: 600, fontSize: '14px' }}>Add a shop</div>
      <ShopForm submitLabel="Add shop" onSubmit={submit} onCancel={() => setOpen(false)} busy={busy} categories={categories} />
      <Said result={result} />
    </Card>
  );
}

function ShopCard({ v, q, categories }) {
  const m = useDeliveryManage(q);
  const { busy, result, run } = useRun();
  const [editing, setEditing] = useState(false);
  const settingUp = !!v.onboardingStep;
  const waiting = v.onboardingStep === 'review';

  const save = async (f) => {
    const fields = changed(v, f, ['name', 'category', 'phone', 'contactName', 'address', 'deliveryOnly']);
    if (!f.deliveryOnly && Number(f.commissionPct || 0) !== Number(v.commissionPct || 0)) fields.commissionPct = Number(f.commissionPct || 0);
    if (String(f.prepMinutes ?? '') !== String(v.prepMinutes ?? '')) fields.prepMinutes = f.prepMinutes === '' ? null : Number(f.prepMinutes);
    if (!Object.keys(fields).length) { setEditing(false); return; }
    if (await run(() => m.updateShop(v.id, fields), `${f.name.trim() || v.name} is updated.`)) setEditing(false);
  };
  const approve = () => {
    if (!window.confirm(`Approve ${v.name}? They get a WhatsApp saying they are live, and customers see them once they send OPEN.`)) return;
    run(() => m.approveShop(v.id), `${v.name} is approved, and has been told.`);
  };
  const off = () => {
    if (!window.confirm(`Switch ${v.name} off? It closes now, gets no orders, and customers stop seeing it. The shop is not messaged.`)) return;
    run(() => m.switchShopOff(v.id), `${v.name} is switched off.`);
  };
  const on = () => {
    if (!window.confirm(`Switch ${v.name} back on? Customers see it again once it sends OPEN.`)) return;
    run(() => m.switchShopOn(v.id), `${v.name} is switched on.`);
  };
  const remove = () => {
    if (!window.confirm(`Delete ${v.name}? Only a shop that has never had an order can be deleted; one with orders has to be switched off instead.`)) return;
    run(() => m.removeShop(v.id), `${v.name} is deleted.`);
  };

  let state = ['closed', colors.muted];
  if (waiting) state = ['waiting for approval', colors.amber];
  else if (settingUp) state = ['setting up', colors.cyan];
  else if (!v.active) state = ['switched off', colors.red];
  else if (v.open) state = ['open', colors.emerald];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
        <div style={{ color: colors.text, fontWeight: 600, fontSize: '14px' }}>{v.name}</div>
        <Chip text={state[0]} tint={state[1]} />
      </div>
      <div style={{ color: colors.muted, fontSize: '12px', marginTop: '6px' }}>{v.phone} · {v.category}{v.contactName ? ` · ${v.contactName}` : ''}</div>
      <div style={{ marginTop: '8px' }}>
        <Row left="Plan" right={v.plan === 'subscriber' ? 'subscriber' : 'pay as you go'} />
        {v.plan === 'subscriber' && <Row left="Wallet" right={money(v.wallet)} />}
        <Row left="Paid by" right={v.paystackSubaccount ? 'split at checkout' : 'by hand'} />
        {!v.deliveryOnly && <Row left="Commission" right={`${v.commissionPct || 0}%`} />}
        {v.address && <Row left="Address" right={v.address} />}
        {v.onboardingStep && <Row left="Setting up" right={v.onboardingStep} />}
        {v.joinCode && <Row left="Join code" right={v.joinCode} />}
      </div>
      {v.joinLink && (
        <div style={{ fontSize: '12px', marginTop: '6px', wordBreak: 'break-all' }}>
          <a href={v.joinLink} target="_blank" rel="noreferrer" style={{ color: colors.lime }}>Their join link ↗</a>
        </div>
      )}
      {editing
        ? <ShopForm initial={v} submitLabel="Save" onSubmit={save} onCancel={() => setEditing(false)} busy={busy} categories={categories} />
        : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
            <button onClick={() => setEditing(true)} disabled={busy} style={act(colors.cyan, busy)}>Edit</button>
            {waiting && <button onClick={approve} disabled={busy} style={act(colors.emerald, busy)}>Approve</button>}
            {!settingUp && v.active && <button onClick={off} disabled={busy} style={act(colors.amber, busy)}>Switch off</button>}
            {!settingUp && !v.active && <button onClick={on} disabled={busy} style={act(colors.emerald, busy)}>Switch on</button>}
            <button onClick={remove} disabled={busy} style={act(colors.red, busy)}>Delete</button>
          </div>
        )}
      <Said result={result} />
    </Card>
  );
}

function Businesses({ businesses, q }) {
  const categories = useShopCategories().data;
  return (
    <div>
      <AddShop q={q} categories={categories} />
      {!businesses.length && <Empty>No shops yet. Add one above, or invite one from WhatsApp with ADDSHOP.</Empty>}
      {businesses.map((v) => <ShopCard key={v.id} v={v} q={q} categories={categories} />)}
    </div>
  );
}

function Money({ overview, payouts }) {
  const m = overview?.money;
  if (!m) return <Empty>Nothing has moved yet. Entries appear the moment an order is paid.</Empty>;
  return (
    <div>
      <Card>
        <div style={{ color: colors.text, fontWeight: 600, fontSize: '14px', marginBottom: '10px' }}>Last 24 hours</div>
        <Row left="We kept" right={money(m.revenue)} />
        <Row left="Paystack took" right={money(m.paystackFees)} />
        {m.refunds > 0 && <Row left="Refunded" right={money(m.refunds)} />}
      </Card>

      {/* Money we are holding, kept visibly apart from money we earned. */}
      <Card>
        <div style={{ color: colors.text, fontWeight: 600, fontSize: '14px', marginBottom: '10px' }}>Owed out right now</div>
        <Row left="🛵 Drivers" right={money(m.driverOwed)} />
        {m.vendorOwed > 0 && <Row left="🏪 Shops" right={money(m.vendorOwed)} />}
        {m.walletHeld > 0 && <Row left="👛 Business wallets" right={money(m.walletHeld)} />}
        <div style={{ color: colors.muted, fontSize: '12px', marginTop: '10px' }}>
          A driver's money is never ours. It is owed the moment a job is delivered, and paid on day 3.
        </div>
      </Card>

      {payouts?.batches?.length > 0 && (
        <Card>
          <div style={{ color: colors.text, fontWeight: 600, fontSize: '14px', marginBottom: '10px' }}>Payouts due</div>
          {payouts.batches.map((b) => (
            <Row key={b.batchId} left={`${b.driverName || b.driverPhone} · ${b.jobs} job${b.jobs === 1 ? '' : 's'}`} right={money(b.amount)} />
          ))}
          <div style={{ color: colors.muted, fontSize: '12px', marginTop: '10px' }}>
            Confirm a payment from WhatsApp with PAYOUTS PAID — it is written down there, so the books and the bank agree.
          </div>
        </Card>
      )}
    </div>
  );
}
