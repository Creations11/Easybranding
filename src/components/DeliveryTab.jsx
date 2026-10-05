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
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../api';
import { colors } from '../utils/theme';

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

export default function DeliveryTab() {
  // Which business is being looked at. A tenant's own admin never sets this —
  // their session already names one. A PLATFORM role (super_admin,
  // eb_manager, eb_agent) carries no tenant at all, so it picks one, and
  // every call below carries the choice. Getting this wrong hid the tab from
  // the only person who runs deliveries (2026-10-01).
  const [tenantId, setTenantId] = useState(null);
  // The list of businesses to pick from. Only ever REPLACED by a newer list,
  // never blanked: once a business is chosen the overview stops asking, and
  // clearing this then is what removed "Another business" from the screen.
  const [choices, setChoices] = useState([]);
  const [section, setSection] = useState('orders');
  const [data, setData] = useState({ overview: null, orders: [], drivers: [], businesses: [], payouts: null });
  const [open, setOpen] = useState(null);          // the reference being looked at
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  // allSettled, like AdminDashboard's own loader: one failing panel must not
  // blank the other three. A banner says which, and the rest still work.
  const q = tenantId ? `?tenantId=${tenantId}` : '';

  // Each load takes a ticket. If a newer load has started by the time this
  // one answers (a quick change of business, a double tap on refresh), this
  // one's answer is for the wrong screen and is dropped.
  const ticket = useRef(0);

  const load = useCallback(async () => {
    const mine = ++ticket.current;
    const [overview, orders, drivers, businesses, payouts] = await Promise.allSettled([
      api.get(`/delivery/overview${q}`),
      api.get(`/delivery/orders${q}`),
      api.get(`/delivery/drivers${q}`),
      api.get(`/delivery/businesses${q}`),
      api.get(`/delivery/payouts${q}`),
    ]);
    if (mine !== ticket.current) return;

    const val = (r, fallback) => (r.status === 'fulfilled' ? (r.value.data?.data ?? r.value.data) : fallback);

    // A platform session is asked which business rather than shown all of
    // them: the other four calls only mean anything once one is named.
    const head = val(overview, null);
    if (head?.needsTenant) setChoices(head.tenants || []);

    setData({
      overview: head,
      orders: val(orders, []),
      drivers: val(drivers, []),
      businesses: val(businesses, []),
      payouts: val(payouts, null),
    });
    const failed = [
      overview.status === 'rejected' && 'the summary',
      orders.status === 'rejected' && 'orders',
      drivers.status === 'rejected' && 'drivers',
      businesses.status === 'rejected' && 'businesses',
      payouts.status === 'rejected' && 'payouts',
    ].filter(Boolean);
    setProblem(failed.length ? `Could not load ${failed.join(', ')}. Everything else below is current.` : '');
    setUpdatedAt(new Date().toISOString());
    setLoading(false);
  }, [q]);

  useEffect(() => { load(); }, [load]);

  // Only the moving part polls: the order list, and the one order that is
  // open, so its history keeps up with the list above it.
  useEffect(() => {
    if (section !== 'orders') return undefined;
    let live = true;
    const t = setInterval(async () => {
      try {
        const r = await api.get(`/delivery/orders${q}`);
        if (!live) return;
        setData((d) => ({ ...d, orders: r.data?.data ?? r.data ?? [] }));
        setUpdatedAt(new Date().toISOString());
      } catch { /* a dropped poll is not worth a banner; the next one will do */ }

      if (!open) return;
      try {
        const r = await api.get(`/delivery/orders/${open}${q}`);
        if (live) setDetail(r.data?.data ?? r.data);
      } catch { /* keep showing what we had rather than replacing it with an error */ }
    }, REFRESH_MS);
    return () => { live = false; clearInterval(t); };
  }, [section, q, open]);

  // Opening and closing clears the old detail HERE rather than in an effect:
  // an effect that resets state synchronously just to react to its own
  // dependency is a cascading render, and the event already knows.
  const openOrder = useCallback((reference) => {
    setOpen(reference);
    setDetail(null);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    let live = true;
    api.get(`/delivery/orders/${open}${q}`)
      .then((r) => { if (live) setDetail(r.data?.data ?? r.data); })
      .catch(() => { if (live) setDetail({ error: 'That order could not be opened.' }); });
    return () => { live = false; };
  }, [open, q]);

  // Switching business starts from a clean screen, so one shop's orders are
  // never visible under another shop's name while the new ones load.
  const pickBusiness = (id) => {
    setData({ overview: null, orders: [], drivers: [], businesses: [], payouts: null });
    setProblem('');
    setOpen(null);
    setDetail(null);
    setLoading(true);
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
          <button onClick={() => { setTenantId(null); setOpen(null); setDetail(null); }} style={pill(false)}>
            ⇄ Another business
          </button>
        )}
      </div>

      {section === 'orders' && (
        <Orders orders={data.orders} open={open} onOpen={openOrder} detail={detail} updatedAt={updatedAt} />
      )}
      {section === 'drivers' && <Drivers drivers={data.drivers} />}
      {section === 'businesses' && <Businesses businesses={data.businesses} />}
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

function Drivers({ drivers }) {
  if (!drivers.length) {
    return <Empty>No drivers yet, so orders come in and sit waiting. Add one from WhatsApp with ADDDRIVER Name 082…</Empty>;
  }
  // Who can take a job right now first, then who is owed the most.
  const sorted = [...drivers].sort((a, b) => (b.onShift ? 1 : 0) - (a.onShift ? 1 : 0) || (b.owed || 0) - (a.owed || 0));
  return sorted.map((d) => (
    <Card key={d.phone}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
        <div style={{ color: colors.text, fontWeight: 600, fontSize: '14px' }}>{d.name || d.phone}</div>
        <Chip text={d.onShift ? 'on shift' : 'off'} tint={d.onShift ? colors.emerald : colors.muted} />
      </div>
      <div style={{ color: colors.muted, fontSize: '12px', marginTop: '6px' }}>{d.phone}</div>
      <div style={{ marginTop: '8px' }}>
        <Row left="Papers" right={d.kycStatus || 'not asked for'} />
        <Row left="Practice run" right={d.practiceDoneAt ? 'done' : d.practiceRequired ? 'not done — no jobs reach them' : 'not required'} />
        <Row left="Carrying" right={d.carrying || 'nothing'} />
        <Row left="Owed" right={money(d.owed)} />
      </div>
    </Card>
  ));
}

function Businesses({ businesses }) {
  if (!businesses.length) return <Empty>No shops yet. Invite one from WhatsApp with ADDSHOP.</Empty>;
  return businesses.map((v) => (
    <Card key={v.id}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
        <div style={{ color: colors.text, fontWeight: 600, fontSize: '14px' }}>{v.name}</div>
        <Chip
          text={v.open ? 'open' : 'closed'}
          tint={v.open ? colors.emerald : colors.muted}
        />
      </div>
      <div style={{ color: colors.muted, fontSize: '12px', marginTop: '6px' }}>{v.phone} · {v.category}</div>
      <div style={{ marginTop: '8px' }}>
        <Row left="Plan" right={v.plan === 'subscriber' ? 'subscriber' : 'pay as you go'} />
        {v.plan === 'subscriber' && <Row left="Wallet" right={money(v.wallet)} />}
        <Row left="Paid by" right={v.paystackSubaccount ? 'split at checkout' : 'by hand'} />
        {v.onboardingStep && <Row left="Setting up" right={v.onboardingStep} />}
      </div>
    </Card>
  ));
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
