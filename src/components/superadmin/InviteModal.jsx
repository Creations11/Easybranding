import { c } from './tokens';

/** The invite link for a client's staff, after it is generated. */
export default function InviteModal({ client, inviteUrl, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 500, background: c.surface, borderRadius: 20, border: '1px solid ' + c.border, padding: 32 }}>
        <h3 style={{ color: c.lime, marginBottom: 8 }}>🔗 Invite Link</h3>
        <p style={{ color: c.muted, fontSize: 14, marginBottom: 20 }}>Share with <strong style={{ color: c.text }}>{client.businessName}</strong> staff.</p>
        <div style={{ background: '#1C1C19', border: '1px solid ' + c.borderDim, borderRadius: 10, padding: 14, marginBottom: 14, wordBreak: 'break-all' }}><p style={{ color: c.lime, fontSize: 13, fontFamily: 'monospace' }}>{inviteUrl}</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigator.clipboard.writeText(inviteUrl)} style={{ flex: 1, padding: 12, background: c.lime, color: '#050505', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Copy Link</button>
          <button onClick={onClose} style={{ padding: '12px 20px', background: 'transparent', border: '1px solid ' + c.borderDim, color: c.muted, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
        </div>
      </div>
    </div>
  );
}
