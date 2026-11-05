import { useEffect, useRef, useState } from 'react';
import api from '../../api';
import Button from '../ui/Button';
import { Row } from './ui';

// A driver's licence, face, ID number and bank letter. The API sends these to the
// super admin and nobody else, so for every other role there is nothing to draw.
//
// The files come through the API as blobs and never as Drive links: a Drive link
// only opens for an account with access to that folder, and the API is what logs
// who looked. Nothing downloads until somebody taps Open.

function Paper({ doc, phone, q }) {
  const [view, setView] = useState(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const made = useRef(null);

  useEffect(() => () => { if (made.current) URL.revokeObjectURL(made.current); }, []);

  const open = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const res = await api.get(`/delivery/drivers/${encodeURIComponent(phone)}/documents/${doc.kind}${q}`, { responseType: 'blob' });
      made.current = URL.createObjectURL(res.data);
      setView({ url: made.current, isImage: String(res.data?.type || doc.contentType || '').startsWith('image/') });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-edge py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-[13px]">
          <div className="text-ink">{doc.label}</div>
          {!doc.sent && <div className="text-xs text-muted">not sent yet</div>}
          {doc.sent && !doc.storedOnDrive && (
            <div className="text-xs text-amber">Only on WhatsApp, which keeps it for 7 days. Not on Google Drive yet.</div>
          )}
        </div>
        {doc.sent && !view && <Button variant="secondary" onClick={open} disabled={busy}>{busy ? 'Opening…' : 'Open'}</Button>}
      </div>
      {failed && (
        <div role="status" className="mt-1 text-xs text-red">
          This file could not be opened. WhatsApp only keeps it for 7 days, so the driver may need to send it again.
        </div>
      )}
      {view && (
        <a href={view.url} target="_blank" rel="noreferrer" className="mt-2 block text-[13px] text-lime">
          {view.isImage
            ? <img src={view.url} alt={doc.label} className="max-h-80 max-w-full rounded-lg border border-edge" />
            : 'Open the file'}
        </a>
      )}
    </div>
  );
}

export default function DriverPapers({ d, q }) {
  const [open, setOpen] = useState(false);
  if (!d.documents) return null;
  const sent = d.documents.filter((x) => x.sent).length;

  if (!open) {
    return (
      <div className="mt-2.5">
        <Button variant="secondary" onClick={() => setOpen(true)}>See documents ({sent} of {d.documents.length} sent)</Button>
      </div>
    );
  }
  return (
    <div className="mt-2.5">
      <Row left="Name on their licence" right={d.fullName || 'not given yet'} />
      {/* Not asked for since 2026-11-04: it is on the licence photo. */}
      {d.idNumber && <Row left="ID number" right={d.idNumber} mono />}
      <div className="mt-2">
        {d.documents.map((doc) => <Paper key={doc.kind} doc={doc} phone={d.phone} q={q} />)}
      </div>
      <Button variant="secondary" onClick={() => setOpen(false)}>Hide documents</Button>
    </div>
  );
}
