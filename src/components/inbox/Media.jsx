import { useState } from 'react';
import api from '../../api';
import { kindOf } from './chatText';

/**
 * Renders one attachment.
 *
 * `src` goes through the API rather than at Twilio directly: inbound media
 * URLs are credential-protected and 401 in a browser, so the bytes are
 * proxied under the session the dashboard already has. api.defaults.baseURL
 * is reused so this follows whatever environment the rest of the app targets.
 */
export default function Media({ msg }) {
  // Optional-chained: api.defaults is always present under axios, but a
  // thrown TypeError here would take the whole thread down over an
  // attachment, which is the wrong trade for a preview.
  const src = `${api.defaults?.baseURL || ''}${msg.mediaPath}`;
  const { kind, label } = kindOf(msg.mediaContentType);
  const [failed, setFailed] = useState(false);

  // A broken image icon inside a chat bubble reads as a bug in the product.
  // A labelled link reads as a file the browser could not preview, which is
  // what actually happened.
  if (failed || kind === 'file') {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer"
        className="inline-flex min-h-10 items-center gap-2 rounded-md bg-white/6 px-2.5 py-2 text-[13.5px] text-ink no-underline">
        {label} <span className="text-xs opacity-60">open</span>
      </a>
    );
  }

  if (kind === 'image') {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" className="block">
        <img src={src} alt={label} onError={() => setFailed(true)} className="block max-h-[260px] max-w-full rounded-md" />
      </a>
    );
  }

  if (kind === 'video') {
    return <video src={src} controls onError={() => setFailed(true)} className="block max-h-[260px] max-w-full rounded-md" />;
  }

  // Voice notes are the case this whole path exists for — a customer's
  // explanation that nobody on the platform could hear.
  return <audio src={src} controls onError={() => setFailed(true)} className="h-[38px] w-full min-w-[210px]" />;
}
