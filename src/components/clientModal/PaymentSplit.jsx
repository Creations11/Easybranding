import { useState } from 'react';
import api from '../../api';
import { c, iStyle, labelStyle } from './styles';

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
        <button type="button" onClick={openSplit} style={{ background: 'none', border: '1px dashed ' + c.border, borderRadius: '10px', color: c.lime, fontSize: '13px', padding: '9px 14px', cursor: 'pointer', marginBottom: '14px', fontFamily: 'inherit' }}>
          + Set up new payment split (create subaccount from bank details)
        </button>
      )}
      {isNew && (
        <p style={{ color: c.muted, fontSize: '12px', marginBottom: '14px' }}>Save the client first to set up a new payment split.</p>
      )}
      {splitOpen && (
        <div style={{ border: '1px solid ' + c.borderDim, borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
          <label style={labelStyle}>Bank</label>
          <select value={split.bankCode} onChange={e => { setSplit(s => ({ ...s, bankCode: e.target.value })); setVerifiedName(''); }} style={{ ...iStyle, cursor: 'pointer' }}>
            <option value="">Select a bank…</option>
            {banks.map(b => <option key={b.code + b.name} value={b.code}>{b.name}</option>)}
          </select>
          <label style={labelStyle}>Account Number</label>
          <input value={split.accountNumber} onChange={e => { setSplit(s => ({ ...s, accountNumber: e.target.value })); setVerifiedName(''); }} placeholder="1234567890" style={iStyle} />
          {splitMsg.text && (
            <p style={{ color: splitMsg.kind === 'ok' ? c.lime : c.red, fontSize: '13px', marginBottom: '10px' }}>{splitMsg.text}</p>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={verifyAccount} disabled={splitBusy || !split.bankCode || !split.accountNumber.trim()}
              style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.text, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', opacity: splitBusy || !split.bankCode || !split.accountNumber.trim() ? 0.5 : 1 }}>
              {splitBusy ? 'Working…' : '1. Verify account'}
            </button>
            {/* Create only unlocks after a successful verify — the name check is the typo guard before money starts settling to this account. */}
            <button type="button" onClick={createSplit} disabled={splitBusy || !verifiedName}
              style={{ flex: 1, padding: '10px', background: verifiedName ? c.lime : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '10px', color: verifiedName ? '#0D110C' : c.muted, fontSize: '13px', fontWeight: 600, cursor: verifiedName ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              2. Create split
            </button>
          </div>
        </div>
      )}
    </>
  );
}
