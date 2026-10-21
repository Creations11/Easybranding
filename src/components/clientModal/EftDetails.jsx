import { Input } from '../ui/Field';
import { Label } from './ui';

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
              <div className="mb-4 rounded-xl border border-edge p-3.5">
                <label className="mb-0.5 block text-[13px] font-semibold text-ink">
                  Banking details (EFT)
                </label>
                <p className="mb-3 text-xs text-muted">
                  Sent alongside every payment link, so customers who won't tap a link can pay by EFT instead.
                  These are the details customers pay INTO — not the Paystack payout account above.
                </p>

                <label className="mb-3 flex min-h-[44px] cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form.eft?.enabled)}
                    onChange={e => setEft('enabled', e.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-lime"
                  />
                  <span className="text-[13px] text-ink">Offer EFT as a payment option</span>
                </label>

                <Label htmlFor="eft-bank">Bank</Label>
                <Input mono={false} id="eft-bank" value={form.eft?.bankName || ''} onChange={e => setEft('bankName', e.target.value)} placeholder="Nedbank" className="mb-3.5 bg-white/4" />

                <Label htmlFor="eft-name">Account name</Label>
                <Input mono={false} id="eft-name" value={form.eft?.accountName || ''} onChange={e => setEft('accountName', e.target.value)} placeholder="YOUR COMPANY (PTY) LTD" className="mb-3.5 bg-white/4" />

                <Label htmlFor="eft-number">Account number</Label>
                <Input
                  id="eft-number"
                  value={form.eft?.accountNumber || ''}
                  onChange={e => setEft('accountNumber', e.target.value)}
                  placeholder="1234567890"
                  inputMode="numeric"
                  // Mono with tabular figures, spaced, so a repeated or missing
                  // digit is visible; red until it is digits only, 6 or more.
                  className={`mb-1 bg-white/4 tabular-nums tracking-[0.06em] ${
                    form.eft?.accountNumber && !/^d{6,}$/.test(form.eft.accountNumber.replace(/s/g, '')) ? 'border-red' : 'border-white/12'
                  }`}
                />
                {form.eft?.accountNumber && !/^\d{6,}$/.test(form.eft.accountNumber.replace(/\s/g, '')) && (
                  <p className="mb-2.5 text-xs text-red">
                    Digits only, and at least 6 — check this against your bank statement.
                  </p>
                )}

                <div className="flex gap-2.5">
                  <div className="flex-1">
                    <Label htmlFor="eft-branch">Branch code</Label>
                    <Input id="eft-branch" value={form.eft?.branchCode || ''} onChange={e => setEft('branchCode', e.target.value)} placeholder="198765" inputMode="numeric" className="mb-3.5 bg-white/4" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="eft-type">Account type</Label>
                    <Input mono={false} id="eft-type" value={form.eft?.accountType || ''} onChange={e => setEft('accountType', e.target.value)} placeholder="CA / Savings" className="mb-3.5 bg-white/4" />
                  </div>
                </div>

                {/* The read-back. A wrong digit is only catchable if you see it in
                    the shape the customer will. */}
                {form.eft?.enabled && (
                  eftComplete ? (
                    <div className="rounded-[10px] border border-edge bg-white/3 p-3">
                      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.05em] text-muted">
                        What the customer receives
                      </p>
                      <pre className="m-0 whitespace-pre-wrap font-[inherit] text-[12.5px] leading-[1.55] text-ink">
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
                    <p className="m-0 text-xs text-amber">
                      Account name, account number and a bank or branch code are all needed before this can be sent —
                      incomplete details are never shown to a customer.
                    </p>
                  )
                )}
              </div>
    </>
  );
}
