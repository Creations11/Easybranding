import Badge from '../ui/Badge';
import { STATUS_STYLE, ago, money, isUnclaimed } from './helpers';
import { Card, CardHead, Row } from './ui';

/** One order in the list; opened, it shows the delivery and its history. */
export default function OrderCard({ d, isOpen, onOpen, detail }) {
  const s = STATUS_STYLE[d.status] || { label: d.status, tone: 'neutral' };
  return (
    <Card active={isOpen} onClick={() => onOpen(isOpen ? null : d.reference)}>
      <CardHead
        title={
          <>
            <span className="font-mono">{d.reference}</span>
            {d.orderSource === 'BUSINESS_WHATSAPP' && (
              <span className="text-xs font-normal text-muted"> · sent by {d.vendorName || 'a shop'}</span>
            )}
          </>
        }
      >
        <Badge tone={s.tone}>{s.label}</Badge>
      </CardHead>

      <div className="mt-1.5 text-xs text-muted">
        {d.customerName || d.customerPhone} · {d.driverName || 'no driver yet'} · {ago(d.createdAt)}
        {d.total != null && <span className="font-mono tabular-nums">{` · ${money(d.total)}`}</span>}
      </div>

      {isUnclaimed(d) && (
        <div className="mt-1.5 text-xs text-red">
          Paid, and nobody has taken it.
        </div>
      )}

      {isOpen && (
        <div className="mt-3 border-t border-edge pt-3">
          {!detail && <div className="text-[13px] text-muted">Opening…</div>}
          {detail?.error && <div className="text-[13px] text-red">{detail.error}</div>}
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
              <Row left="Total" right={money(detail.total)} mono />
              {/* Three fees, never one — whose money is whose. */}
              <Row left="Driver earns" right={money(detail.driverFee)} mono />
              <Row left="We keep" right={money(detail.kasiFee)} mono />
              {detail.trackingUrl && (
                <div className="mt-2.5">
                  <a
                    href={detail.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[13px] text-lime"
                  >
                    Open the customer's tracking page ↗
                  </a>
                </div>
              )}
              {detail.history?.length > 0 && (
                <div className="mt-3">
                  {detail.history.map((h, i) => (
                    <div key={i} className="my-0.5 text-xs text-muted">
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
