import { useState } from 'react';
import { colors } from '../../utils/theme';
import { manageErrorMessage } from '../../hooks/useDeliveryManage';

/** Run an action; its outcome is the line under the card. */
export function useRun() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const run = async (fn, ok) => {
    setBusy(true);
    try {
      const data = await fn();
      setResult({ tint: colors.emerald, text: typeof ok === 'function' ? ok(data) : ok });
      return data;
    } catch (err) {
      setResult({ tint: colors.red, text: manageErrorMessage(err) });
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { busy, result, run, clear: () => setResult(null) };
}
