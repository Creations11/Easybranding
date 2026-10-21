import api from '../../api';
import Button from '../ui/Button';

/**
 * Message everyone.
 *
 * Two steps on purpose. WhatsApp discards a freeform message to anyone who
 * has not written in the last 24 hours — and reports it as sent — so a
 * one-click broadcast tells an owner it reached everybody when it may have
 * reached nobody. When this was built every one of SendUs's six customers
 * was out of window.
 *
 * So the first click asks the server who this actually reaches, and shows
 * the answer before there is anything to confirm. The send button does not
 * exist until that number does.
 *
 * `scope` names the client for a platform login, which has no business of
 * its own: the API refuses a broadcast without one ("There is no all-tenant
 * broadcast"), and `business` is said in the heading so nobody wonders whose
 * customers this reaches. A client's own login passes neither.
 */
export default function BroadcastPanel({ state, setState, onSent, scope = '', business = '' }) {
  const { text, preview, result, busy } = state;
  const url = scope ? `/admin-ops/broadcast?tenantId=${encodeURIComponent(scope)}` : '/admin-ops/broadcast';

  const check = async () => {
    if (!text.trim()) return;
    setState(s => ({ ...s, busy: true, result: null }));
    try {
      const r = await api.post(url, { message: text.trim(), dryRun: true });
      setState(s => ({ ...s, preview: r.data, busy: false }));
    } catch (e) {
      setState(s => ({ ...s, busy: false, result: { error: e.response?.data?.message || 'Could not check the audience.' } }));
    }
  };

  const send = async () => {
    setState(s => ({ ...s, busy: true }));
    try {
      const r = await api.post(url, { message: text.trim() });
      setState(s => ({ ...s, busy: false, result: r.data }));
      onSent?.();
    } catch (e) {
      setState(s => ({ ...s, busy: false, result: { error: e.response?.data?.message || 'Send failed.' } }));
    }
  };

  const close = () => setState({ open: false, text: '', preview: null, result: null, busy: false });

  return (
    <div
      role="dialog" aria-label="Message everyone"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4"
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="max-h-[90vh] w-full max-w-[460px] overflow-y-auto rounded-xl border border-edge bg-surface p-5">
        <h3 className="mb-1 text-[17px] font-bold text-ink">Message everyone{business ? ` at ${business}` : ''}</h3>
        <p className="mb-3.5 text-[13px] text-muted">
          One message to your customers. You'll see who it reaches before it sends.
        </p>

        <textarea
          value={text}
          onChange={e => setState(s => ({ ...s, text: e.target.value, preview: null }))}
          placeholder="What do you want to tell them?"
          rows={4}
          className="w-full resize-y rounded-lg border border-white/12 bg-ground px-[13px] py-[11px] text-base text-ink focus:border-lime focus:outline-none"
        />

        {preview && (
          <div className="mt-3.5 rounded-lg bg-white/4 p-[13px]">
            <p className="font-mono text-[15px] font-bold tabular-nums text-ink">
              Reaches {preview.willReach} of {preview.audience.total}
            </p>
            <p className="mt-1 text-[12.5px] text-muted">
              {preview.audience.inWindow} messaged you recently · {preview.audience.outOfWindow} did not
            </p>
            {preview.warning && (
              <p className="mt-2 text-[12.5px] leading-normal text-amber">
                {preview.warning}
              </p>
            )}
          </div>
        )}

        {result && (
          <p className={`mt-3 text-[13.5px] ${result.error ? 'text-red' : 'text-lime'}`}>
            {result.error || result.message}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={close}>
            {result && !result.error ? 'Done' : 'Cancel'}
          </Button>

          {/* The send button only appears once the reach is known and is not
              zero — there is nothing to confirm before that. */}
          {!preview ? (
            <Button variant="primary" className="flex-1" onClick={check} disabled={!text.trim() || busy}>
              {busy ? 'Checking…' : 'Who gets this?'}
            </Button>
          ) : preview.willReach > 0 && !result ? (
            <Button variant="primary" className="flex-1" onClick={send} disabled={busy}>
              {busy ? 'Sending…' : `Send to ${preview.willReach}`}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
