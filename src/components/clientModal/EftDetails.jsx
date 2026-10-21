import { c, iStyle, labelStyle } from './styles';

export default function EftDetails({ form, setEft, eftComplete }) {
  return (
    <>
              {/* ── Customer-facing EFT details ────────────────────────────
                  NOT the subaccount above. That is where Paystack pays the client
                  OUT; this is where their customers pay IN. Separate on purpose:
                  they are often the same account and are not always, and
                  publishing the wrong one is not noticed until the money is gone.

                  Here rather than in a terminal script because this is a setting an
                  owner should be able to see, check and change — and because the
                  live preview below is the read-back that makes a wrong digit
                  catchable before it reaches a customer. */}
              <div style={{ border: '1px solid ' + c.borderDim, borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                <label style={{ ...labelStyle, marginBottom: '2px', color: c.text, fontSize: '13px', fontWeight: 600 }}>
                  Banking details (EFT)
                </label>
                <p style={{ color: c.muted, fontSize: '12px', marginBottom: '12px' }}>
                  Sent alongside every payment link, so customers who won't tap a link can pay by EFT instead.
                  These are the details customers pay INTO — not the Paystack payout account above.
                </p>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(form.eft?.enabled)}
                    onChange={e => setEft('enabled', e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: c.lime, cursor: 'pointer' }}
                  />
                  <span style={{ color: c.text, fontSize: '13px' }}>Offer EFT as a payment option</span>
                </label>

                <label style={labelStyle}>Bank</label>
                <input value={form.eft?.bankName || ''} onChange={e => setEft('bankName', e.target.value)} placeholder="Nedbank" style={iStyle} />

                <label style={labelStyle}>Account name</label>
                <input value={form.eft?.accountName || ''} onChange={e => setEft('accountName', e.target.value)} placeholder="YOUR COMPANY (PTY) LTD" style={iStyle} />

                <label style={labelStyle}>Account number</label>
                <input
                  value={form.eft?.accountNumber || ''}
                  onChange={e => setEft('accountNumber', e.target.value)}
                  placeholder="1234567890"
                  inputMode="numeric"
                  style={{
                    ...iStyle,
                    marginBottom: '4px',
                    // Tabular figures so a repeated or missing digit is visible.
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '0.06em',
                    borderColor: form.eft?.accountNumber && !/^\d{6,}$/.test(form.eft.accountNumber.replace(/\s/g, ''))
                      ? c.red : c.borderDim,
                  }}
                />
                {form.eft?.accountNumber && !/^\d{6,}$/.test(form.eft.accountNumber.replace(/\s/g, '')) && (
                  <p style={{ color: c.red, fontSize: '12px', marginBottom: '10px' }}>
                    Digits only, and at least 6 — check this against your bank statement.
                  </p>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Branch code</label>
                    <input value={form.eft?.branchCode || ''} onChange={e => setEft('branchCode', e.target.value)} placeholder="198765" inputMode="numeric" style={iStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Account type</label>
                    <input value={form.eft?.accountType || ''} onChange={e => setEft('accountType', e.target.value)} placeholder="CA / Savings" style={iStyle} />
                  </div>
                </div>

                {/* The read-back. A wrong digit is only catchable if you see it in
                    the shape the customer will. */}
                {form.eft?.enabled && (
                  eftComplete ? (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid ' + c.borderDim, borderRadius: '10px', padding: '12px' }}>
                      <p style={{ color: c.muted, fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        What the customer receives
                      </p>
                      <pre style={{ color: c.text, fontSize: '12.5px', lineHeight: 1.55, whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
{`🏦 Prefer an EFT? Pay straight into our account:

Bank: ${form.eft.bankName || '—'}
Account name: ${form.eft.accountName}
Account no: ${form.eft.accountNumber}${form.eft.branchCode ? `
Branch code: ${form.eft.branchCode}` : ''}${form.eft.accountType ? `
Account type: ${form.eft.accountType}` : ''}
Amount: R149
Reference: INV-2026-00028

Send the proof of payment here and we'll get you going. 👍`}
                      </pre>
                    </div>
                  ) : (
                    <p style={{ color: c.amber, fontSize: '12px', margin: 0 }}>
                      Account name, account number and a bank or branch code are all needed before this can be sent —
                      incomplete details are never shown to a customer.
                    </p>
                  )
                )}
              </div>
    </>
  );
}
