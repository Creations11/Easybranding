import { money } from './helpers';
import { Card, Empty, Row } from './ui';

export default function Money({ overview, payouts }) {
  const m = overview?.money;
  if (!m) return <Empty>Nothing has moved yet. Entries appear the moment an order is paid.</Empty>;
  return (
    <div>
      <Card>
        <div className="mb-2.5 text-sm font-semibold text-ink">Last 24 hours</div>
        <Row left="We kept" right={money(m.revenue)} mono />
        <Row left="Paystack took" right={money(m.paystackFees)} mono />
        {m.refunds > 0 && <Row left="Refunded" right={money(m.refunds)} mono />}
      </Card>

      {/* Money we are holding, kept visibly apart from money we earned. */}
      <Card>
        <div className="mb-2.5 text-sm font-semibold text-ink">Owed out right now</div>
        <Row left="🛵 Drivers" right={money(m.driverOwed)} mono />
        {m.vendorOwed > 0 && <Row left="🏪 Shops" right={money(m.vendorOwed)} mono />}
        {m.walletHeld > 0 && <Row left="👛 Business wallets" right={money(m.walletHeld)} mono />}
        <div className="mt-2.5 text-xs text-muted">
          A driver's money is never ours. It is owed the moment a job is delivered, and paid on day 3.
        </div>
      </Card>

      {payouts?.batches?.length > 0 && (
        <Card>
          <div className="mb-2.5 text-sm font-semibold text-ink">Payouts due</div>
          {payouts.batches.map((b) => (
            <Row key={b.batchId} left={`${b.driverName || b.driverPhone} · ${b.jobs} job${b.jobs === 1 ? '' : 's'}`} right={money(b.amount)} mono />
          ))}
          <div className="mt-2.5 text-xs text-muted">
            Confirm a payment from WhatsApp with PAYOUTS PAID — it is written down there, so the books and the bank agree.
          </div>
        </Card>
      )}
    </div>
  );
}
