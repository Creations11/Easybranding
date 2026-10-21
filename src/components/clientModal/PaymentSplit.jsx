import { useState } from 'react';
import api from '../../api';
import Button from '../ui/Button';
import { Input, Select } from '../ui/Field';
import { Label } from './ui';

/** Create the tenant's Paystack subaccount from bank details. */
export default function PaymentSplit({ tenant, isNew, businessName, onSubaccount }) {
  // "Set up payment split" — creates the tenant's Paystack subaccount
  // from bank details, via the existing super-admin endpoints
  // (/payments/banks, /payments/verify-account, /payments/subaccount/create).
  const [splitOpen, setSplitOpen] = useState(false);
  const [banks, setBanks] = useState([]);
  const [split, setSplit] = useState({ bankCode: '', accountNumber: '' });
  const [verifiedName, setVerifiedName] = useState('');
  const [splitBusy, setSplitBusy] = useState(false);
  const [splitMsg, setSplitMsg] = useState({ kind: '', text: '' });

  const openSplit = async () => {
    setSplitOpen(true);
    if (banks.length) return;
    try {
      const res = await api.get('/payments/banks');
      setBanks(res.data?.data?.banks || []);
    } catch {
      setSplitMsg({ kind: 'err', text: 'Could not load the bank list — try again.' });
    }
  };

  const verifyAccount = async () => {
    setSplitBusy(true); setSplitMsg({ kind: '', text: '' }); setVerifiedName('');
    try {
      const res = await api.post('/payments/verify-account', { accountNumber: split.accountNumber.trim(), bankCode: split.bankCode });
      const name = res.data?.data?.account_name;
      setVerifiedName(name || '');
      setSplitMsg(name
        ? { kind: 'ok', text: `Account holder: ${name}` }
        : { kind: 'err', text: 'Account found but no name returned — double-check the details.' });
    } catch (e) {
      setSplitMsg({ kind: 'err', text: e.response?.data?.message || 'Could not verify account. Check the details.' });
    } finally {
      setSplitBusy(false);
    }
  };

  const createSplit = async () => {
    setSplitBusy(true); setSplitMsg({ kind: '', text: '' });
    try {
      const res = await api.post('/payments/subaccount/create', {
        tenantId: tenant._id,
        businessName,
        bankCode: split.bankCode,
        accountNumber: split.accountNumber.trim(),
      });
      const code = res.data?.data?.subaccount_code;
      // Backend already wrote the tenant fields (incl. subaccountActive);
      // mirror the code into the form so what's on screen matches.
      if (code) onSubaccount(code);
      setSplitMsg({ kind: 'ok', text: `Split created — ${code}. Payments now settle to this bank automatically.` });
      setVerifiedName('');
    } catch (e) {
      setSplitMsg({ kind: 'err', text: e.response?.data?.message || 'Could not create the split.' });
    } finally {
      setSplitBusy(false);
    }
  };

  return (
    <>
      {!isNew && !splitOpen && (
        <button type="button" onClick={openSplit}
          className="mb-3.5 min-h-[44px] cursor-pointer rounded-[10px] border border-dashed border-edge-live px-3.5 text-left text-[13px] text-lime">
          + Set up new payment split (create subaccount from bank details)
        </button>
      )}
      {isNew && (
        <p className="mb-3.5 text-xs text-muted">Save the client first to set up a new payment split.</p>
      )}
      {splitOpen && (
        <div className="mb-3.5 rounded-xl border border-edge p-3.5">
          <Label htmlFor="split-bank">Bank</Label>
          <Select id="split-bank" value={split.bankCode} onChange={e => { setSplit(s => ({ ...s, bankCode: e.target.value })); setVerifiedName(''); }} className="mb-3.5 cursor-pointer bg-white/4">
            <option value="">Select a bank…</option>
            {banks.map(b => <option key={b.code + b.name} value={b.code}>{b.name}</option>)}
          </Select>
          <Label htmlFor="split-account">Account Number</Label>
          <Input id="split-account" value={split.accountNumber} onChange={e => { setSplit(s => ({ ...s, accountNumber: e.target.value })); setVerifiedName(''); }} placeholder="1234567890" inputMode="numeric" className="mb-3.5 bg-white/4 tabular-nums" />
          {splitMsg.text && (
            <p className={`mb-2.5 text-[13px] ${splitMsg.kind === 'ok' ? 'text-lime' : 'text-red'}`}>{splitMsg.text}</p>
          )}
          <div className="flex gap-2.5">
            <Button variant="secondary" className="flex-1" onClick={verifyAccount} disabled={splitBusy || !split.bankCode || !split.accountNumber.trim()}>
              {splitBusy ? 'Working…' : '1. Verify account'}
            </Button>
            {/* Create only unlocks after a successful verify — the name check is the typo guard before money starts settling to this account. */}
            <Button variant="primary" className="flex-1" onClick={createSplit} disabled={splitBusy || !verifiedName}>
              2. Create split
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
