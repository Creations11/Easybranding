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
// noise and, on a phone on data, somebody's airtime.
import { useState, useEffect, useCallback } from 'react';
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

const money = (n) => (n == null ? '—' : `R${Number(n).toFixed(2).replace(/\.00$/, '')}`);

const ago = (iso) => {
  if (!iso) return '';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.round(hrs / 24)}d ago`;
};

const Chip = ({ text, tint }) => (
  <span style={{
    background: `${tint}1A`, color: tint, border: `1px solid ${tint}40`,
    borderRadius: '999px', padding: '2px 10px', fontSize: '11px', fontWeight: 600,
    whiteSpace: 'nowrap',
  }}>{text}</span>
);

const Card = ({ children, onClick, active }) => (
  <div
    onClick={onClick}
    style={{
      background: colors.card,
      border: `1px solid ${active ? colors.lime : colors.borderDim}`,
      borderRadius: '12px', padding: '14px', marginBottom: '10px',
      cursor: onClick ? 'pointer' : 'default',
    }}
  >{children}</div>
);

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

export default function DeliveryTab() {
  const [section, setSection] = useState('orders');
  const [data, setData] = useState({ overview: null, orders: [], drivers: [], businesses: [], payouts: null });
  const [open, setOpen] = useState(null);          // the reference being looked at
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState('');

  // allSettled, like AdminDashboard's own loader: one failing panel must not
  // blank the other three. A banner says which, and the rest still work.
  const load = useCallback(async () => {
    const [overview, orders, drivers, businesses, payouts] = await Promise.allSettled([
      api.get('/delivery/overview'),
      api.get('/delivery/orders'),
      api.get('/delivery/drivers'),
      api.get('/delivery/businesses'),
      api.get('/delivery/payouts'),
    ]);
    const val = (r, fallback) => (r.status === 'fulfilled' ? (r.value.data?.data ?? r.value.data) : fallback);
    setData({
      overview: val(overview, null),
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
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Only the moving part polls.
  useEffect(() => {
    if (section !== 'orders') return undefined;
    const t = setInterval(async () => {
      try {
        const r = await api.get('/delivery/orders');
        setData((d) => ({ ...d, orders: r.data?.data ?? r.data ?? [] }));
      } catch { /* a dropped poll is not worth a banner; the next one will do */ }
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [section]);

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
    api.get(`/delivery/orders/${open}`)
      .then((r) => { if (live) setDetail(r.data?.data ?? r.data); })
      .catch(() => { if (live) setDetail({ error: 'That order could not be opened.' }); });
    return () => { live = false; };
  }, [open]);

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: colors.muted }}>Loading deliveries…</div>;
  }

  const o = data.overview;
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
        }}>{problem}</div>
      )}

      {/* The four questions, as four buttons. */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {sections.map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setSection(key); openOrder(null); }}
            style={{
              background: section === key ? `${colors.lime}1A` : 'transparent',
              border: `1px solid ${section === key ? colors.lime : colors.borderDim}`,
              color: section === key ? colors.lime : colors.muted,
              borderRadius: '999px', padding: '7px 14px', cursor: 'pointer',
              fontSize: '13px', fontWeight: section === key ? 600 : 400,
            }}
          >{label}</button>
        ))}
        <button
          onClick={load}
          style={{
            marginLeft: 'auto', background: 'transparent', border: `1px solid ${colors.borderDim}`,
            color: colors.muted, borderRadius: '999px', padding: '7px 14px', cursor: 'pointer', fontSize: '13px',
          }}
        >↻ Refresh</button>
      </div>

      {section === 'orders' && (
        <Orders orders={data.orders} open={open} onOpen={openOrder} detail={detail} />
      )}
      {section === 'drivers' && <Drivers drivers={data.drivers} />}
      {section === 'businesses' && <Businesses businesses={data.businesses} />}
      {section === 'money' && <Money overview={o} payouts={data.payouts} />}
    </div>
  );
}

function Orders({ orders, open, onOpen, detail }) {
  if (!orders.length) {
    return <Empty>Nothing today yet. Orders appear here the moment a customer places one, or a shop sends NEW DELIVERY.</Empty>;
  }

  // The ones nobody is carrying come first: they are the only ones where
  // somebody looking at this screen can change the outcome.
  const sorted = [...orders].sort((a, b) => {
    const stuck = (d) => (d.status === 'pending' && d.paymentStatus === 'paid' ? 0 : 1);
    return stuck(a) - stuck(b) || new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div>
      {sorted.map((d) => {
        const s = STATUS_STYLE[d.status] || { label: d.status, tint: colors.muted };
        const isOpen = open === d.reference;
        const unclaimed = d.status === 'pending' && d.paymentStatus === 'paid' && !d.driverName;
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

            {unclaimed && (
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
                        <a href={detail.trackingUrl} target="_blank" rel="noreferrer" style={{ color: colors.lime, fontSize: '13px' }}>
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
  return drivers.map((d) => (
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
