import { useState } from 'react';
import Button from '../ui/Button';
import { Input } from '../ui/Field';
import { useRentalAccounts, rentalsErrorMessage } from '../../hooks/useRentalsModeration';
import { Sheet } from './ui';
import NewAccount from './NewAccount';
import AccountRow from './AccountRow';

export default function AccountsView() {
  const [typed, setTyped] = useState('');
  const [q, setQ] = useState('');
  const { data, isLoading, isError, error } = useRentalAccounts(q);
  return (
    <div>
      <NewAccount />
      <form onSubmit={(e) => { e.preventDefault(); setQ(typed.trim()); }} className="mb-3.5 flex gap-2">
        <Input mono={false} aria-label="Find an account" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Name, email or number"
          className="max-w-[360px] flex-1 bg-surface" />
        <Button type="submit" variant="primary">Find</Button>
      </form>
      {isLoading && <p className="text-muted">Loading…</p>}
      {isError && <Sheet role="alert" className="text-red">Couldn't load accounts. {rentalsErrorMessage(error)}</Sheet>}
      {data && !data.length && <p className="text-muted">{q ? 'Nobody matches that.' : 'Nobody has signed up yet.'}</p>}
      {data?.map((a) => <AccountRow key={a.id} account={a} />)}
    </div>
  );
}
