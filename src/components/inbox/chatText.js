// Words and times for a chat: shared by the WhatsApp API inbox and ChatTab
// (moved from ChatTab.jsx). Plain values only, so the component files keep
// React's fast refresh.

export const initials = (name, phone) => {
  const src = (name && name !== 'Unknown') ? name : (phone || '?');
  return src.replace(/[^A-Za-z0-9 ]/g, '').trim().split(/\s+/).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase() || '#';
};

export const timeOf = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit' });
};

// What a customer actually sends: a photo of the part they need, a voice note
// explaining the job, a proof of payment. Each wants a different control —
// an <img> for a photo, a player for audio, a link for anything else.
export const kindOf = (contentType = '') => {
  const t = String(contentType);
  if (/image/i.test(t)) return { kind: 'image', label: '📷 Photo' };
  if (/audio|voice|ogg|mpeg|mp3|amr|opus/i.test(t)) return { kind: 'audio', label: '🎤 Voice note' };
  if (/pdf/i.test(t)) return { kind: 'file', label: '📄 Document' };
  if (/video/i.test(t)) return { kind: 'video', label: '🎬 Video' };
  return { kind: 'file', label: '📎 Attachment' };
};

export const preview = (m) => {
  if (!m) return 'No messages yet';
  const body = String(m.body || '').replace(/\s+/g, ' ').trim();
  const tick = m.direction === 'outbound' ? '✓ ' : '';
  if (!body && m.mediaContentType) return tick + kindOf(m.mediaContentType).label;
  return tick + (body.slice(0, 42) || '📎 Attachment');
};

// Lead.messages.body is `required` on the API side, so a caption-less photo is
// stored with a stand-in body — "📷 Photo", "🎤 Voice note" — put there purely
// so the write does not fail validation (leadMessageLog.describeMedia).
// Showing that word under the photo it describes is the one thing WhatsApp
// never does, so drop it once the real attachment is on screen.
export const PLACEHOLDER = /^(📷 Photo|🎤 Voice note|🎥 Video|👤 Contact card|📎 (Document|Attachment))( \(\+\d+ more\))?$/;

export const caption = (m) => {
  const body = String(m.body || '').trim();
  if (m.mediaPath && PLACEHOLDER.test(body)) return '';
  // No media to show and no words either — say so rather than render nothing.
  if (!body && !m.mediaPath) return '📎 Attachment';
  return body;
};
