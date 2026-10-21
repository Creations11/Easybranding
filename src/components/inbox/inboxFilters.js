// What the inbox can show, and the test for each. Its own file so the
// component files keep React's fast refresh.
import { followUpDue, isOpen } from '../crm/crmHelpers';

export const INBOX_FILTERS = [
  ['waiting', 'Waiting on us', (l) => !!l.waitingSince],
  ['open',    'All open',      (l) => isOpen(l)],
  ['taken',   'Taken over',    (l) => l.takenOver && isOpen(l)],
  ['due',     'Follow-ups due', (l, now) => followUpDue(l, now)],
  ['closed',  'Closed',        (l) => !isOpen(l)],
];
