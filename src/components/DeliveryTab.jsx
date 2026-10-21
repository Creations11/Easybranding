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
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { colors } from '../utils/theme';
import { REFRESH_MS, NONE, unwrap, pill, isUnclaimed } from './delivery/helpers';
import { Card, Empty } from './delivery/ui';
import Orders from './delivery/Orders';
import Drivers from './delivery/Drivers';
import Businesses from './delivery/Businesses';
import Money from './delivery/Money';

// The sections live in ./delivery/: Orders (with OrderCard), Drivers
// (DriverCard, DriverForm), Businesses (ShopCard, ShopForm) and Money.

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
