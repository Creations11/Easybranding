import { useState } from 'react';
import { rentalsErrorMessage } from '../../hooks/useRentalsModeration';

/** Run an action and turn its outcome into the line shown under the card. */
export function useAct() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const act = async (fn, okText) => {
    setBusy(true);
    try {
      await fn();
      setResult({ tone: 'good', text: okText });
    } catch (err) {
      setResult({ tone: 'bad', text: rentalsErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };
  return { busy, result, act };
}
