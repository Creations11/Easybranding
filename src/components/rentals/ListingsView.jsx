import Button from '../ui/Button';
import { useRentalListings, rentalsErrorMessage } from '../../hooks/useRentalsModeration';
import { Sheet } from './ui';
import ListingCard from './ListingCard';

export default function ListingsView({ status }) {
  const { data, isLoading, isError, error, refetch } = useRentalListings(status);
  if (isLoading) return <p className="text-muted">Loading…</p>;
  if (isError) {
    return (
      <Sheet role="alert" className="flex flex-wrap items-center gap-2 text-red">
        Couldn't load listings. {rentalsErrorMessage(error)}{' '}
        <Button variant="danger" onClick={() => refetch()}>Try again</Button>
      </Sheet>
    );
  }
  if (!data.length) {
    return <p className="text-muted">{status === 'pending_review' ? 'Nothing is waiting for review.' : 'No listings here.'}</p>;
  }
  return data.map((l) => <ListingCard key={l.id} listing={l} />);
}
