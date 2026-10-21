import { colors } from '../../utils/theme';

/** The invite link for a client's staff, after it is generated. */
export default function InviteLinkModal({ client, inviteUrl, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: colors.surface, borderRadius: '24px', border: `1px solid ${colors.border}`, padding: '32px' }}>
        <h3 style={{ color: colors.lime, marginBottom: '8px' }}>🔗 Invite Link</h3>
        <p style={{ color: colors.muted, fontSize: '14px', marginBottom: '24px' }}>
          Share this link with <strong style={{ color: colors.text }}>{client.businessName}</strong> staff. Anyone who registers via this link will be automatically linked to their agency.
        </p>
        <div style={{ background: '#1C1C19', border: `1px solid ${colors.borderDim}`, borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', wordBreak: 'break-all' }}>
          <p style={{ color: colors.lime, fontSize: '13px', fontFamily: 'monospace' }}>{inviteUrl}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button onClick={() => { navigator.clipboard.writeText(inviteUrl); }} style={{ flex: 1, padding: '12px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
            Copy Link
          </button>
          <button onClick={onClose} style={{ padding: '12px 20px', background: 'transparent', border: `1px solid ${colors.borderDim}`, color: colors.muted, borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}>
            Close
          </button>
        </div>
        <p style={{ color: colors.muted, fontSize: '12px' }}>⚠️ This link expires in 30 days. Generate a new one if needed.</p>
      </div>
    </div>
  );
}
