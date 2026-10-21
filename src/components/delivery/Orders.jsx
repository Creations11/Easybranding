import { useState, useMemo } from 'react';
import { colors } from '../../utils/theme';
import { REFRESH_MS, MOVING, ago, isUnclaimed, pill } from './helpers';
import { Empty } from './ui';
import OrderCard from './OrderCard';

const FILTERS = [
  ['all',       'All',             () => true],
  ['attention', 'Needs attention', (d) => isUnclaimed(d) || d.status === 'failed'],
  ['moving',    'Moving',          (d) => MOVING.includes(d.status)],
  ['done',      'Delivered',       (d) => d.status === 'delivered'],
];

export default function Orders({ orders, open, onOpen, detail, updatedAt }) {
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

      {shown.map((d) => (
        <OrderCard key={d.reference} d={d} isOpen={open === d.reference} onOpen={onOpen} detail={detail} />
      ))}
    </div>
  );
}
