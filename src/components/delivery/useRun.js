import { useState } from 'react';
import { manageErrorMessage } from '../../hooks/useDeliveryManage';

/** Run an action; its outcome is the line under the card. */
export function useRun() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const run = async (fn, ok) => {
    setBusy(true);
    try {
      const data = await fn();
      setResult({ tone: 'good', text: typeof ok === 'function' ? ok(data) : ok });
      return data;
    } catch (err) {
      setResult({ tone: 'bad', text: manageErrorMessage(err) });
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { busy, result, run, clear: () => setResult(null) };
}
