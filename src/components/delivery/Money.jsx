import { colors } from '../../utils/theme';
import { money } from './helpers';
import { Card, Empty, Row } from './ui';

export default function Money({ overview, payouts }) {
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
