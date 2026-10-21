import { useState } from 'react';
import { colors as c } from '../../utils/theme';
import { useRentalAccounts, rentalsErrorMessage } from '../../hooks/useRentalsModeration';
import { btn, card } from './helpers';
import NewAccount from './NewAccount';
import AccountRow from './AccountRow';

export default function AccountsView() {
  const [typed, setTyped] = useState('');
  const [q, setQ] = useState('');
  const { data, isLoading, isError, error } = useRentalAccounts(q);
  return (
    <div>
      <NewAccount />
      <form onSubmit={(e) => { e.preventDefault(); setQ(typed.trim()); }} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input aria-label="Find an account" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Name, email or number"
          style={{ flex: 1, maxWidth: 360, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', borderRadius: 8, background: c.surface, color: c.text, border: '1px solid ' + c.borderDim }} />
        <button type="submit" style={btn(c.lime, false)}>Find</button>
      </form>
      {isLoading && <p style={{ color: c.muted }}>Loading…</p>}
      {isError && <div role="alert" style={{ ...card, color: c.red }}>Couldn't load accounts. {rentalsErrorMessage(error)}</div>}
      {data && !data.length && <p style={{ color: c.muted }}>{q ? 'Nobody matches that.' : 'Nobody has signed up yet.'}</p>}
      {data?.map((a) => <AccountRow key={a.id} account={a} />)}
    </div>
  );
}
