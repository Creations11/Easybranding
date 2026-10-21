import { colors as c } from '../../utils/theme';
import { useRentalListings, rentalsErrorMessage } from '../../hooks/useRentalsModeration';
import { btn, card } from './helpers';
import ListingCard from './ListingCard';

export default function ListingsView({ status }) {
  const { data, isLoading, isError, error, refetch } = useRentalListings(status);
  if (isLoading) return <p style={{ color: c.muted }}>Loading…</p>;
  if (isError) {
    return (
      <div role="alert" style={{ ...card, color: c.red }}>
        Couldn't load listings. {rentalsErrorMessage(error)}{' '}
        <button onClick={() => refetch()} style={btn(c.red, false)}>Try again</button>
      </div>
    );
  }
  if (!data.length) {
    return <p style={{ color: c.muted }}>{status === 'pending_review' ? 'Nothing is waiting for review.' : 'No listings here.'}</p>;
  }
  return data.map((l) => <ListingCard key={l.id} listing={l} />);
}
