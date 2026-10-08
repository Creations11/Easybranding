// src/components/prospecting/MessagePreview.jsx
// The template as the contact will see it on their phone: a WhatsApp bubble
// with the header, body, footer and buttons, every blank already filled.
import { c, fill } from './helpers';

// Filled in for the preview until a real contact is chosen.
const EXAMPLE = { name: 'Thabo', agencyName: "Thabo's Cuts", phone: '+27…' };

export default function MessagePreview({ template, mapping, contact, senderName }) {
  if (!template) return null;
  const who = contact || EXAMPLE;
  const header = template.header ? fill(template.header, mapping?.header, who) : null;
  const body = fill(template.body, mapping?.body, who);
  return (
    <div style={{ background: '#0B141A', borderRadius: 14, padding: 14, border: '1px solid ' + c.borderDim }}>
      <div style={{ color: c.muted, fontSize: 11, marginBottom: 8 }}>
        {senderName ? `From ${senderName}` : 'Preview'}{contact ? ` · to ${contact.name && contact.name !== 'Unknown' ? contact.name : contact.phone}` : ' · example, until you choose contacts'}
      </div>
      <div data-testid="message-preview" style={{ background: '#1F2C34', borderRadius: '4px 12px 12px 12px', padding: '10px 12px', maxWidth: 360, color: '#E9EDEF' }}>
        {header && <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{header}</div>}
        <div style={{ fontSize: 14, lineHeight: 1.45, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{body}</div>
        {template.footer && <div style={{ fontSize: 12, color: '#8696A0', marginTop: 6 }}>{template.footer}</div>}
      </div>
      {template.buttons?.length > 0 && (
        <div style={{ maxWidth: 360, marginTop: 4, display: 'grid', gap: 4 }}>
          {template.buttons.map((b) => (
            <div key={b.index} style={{ background: '#1F2C34', borderRadius: 10, padding: '8px 10px', textAlign: 'center', color: '#53BDEB', fontSize: 14 }}>
              {b.type === 'URL' ? '↗ ' : b.type === 'PHONE_NUMBER' ? '📞 ' : ''}{b.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
