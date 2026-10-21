import { colors } from '../../utils/theme';
import { STATUS_STYLE, ago, money, isUnclaimed } from './helpers';
import { Card, Chip, Row } from './ui';

/** One order in the list; opened, it shows the delivery and its history. */
export default function OrderCard({ d, isOpen, onOpen, detail }) {
  const s = STATUS_STYLE[d.status] || { label: d.status, tint: colors.muted };
  return (
    <Card active={isOpen} onClick={() => onOpen(isOpen ? null : d.reference)}>
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
}
