import Button from '../ui/Button';

/** The invite link for a client's staff, after it is generated. */
export default function InviteLinkModal({ client, inviteUrl, onClose }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-5">
      <div className="w-full max-w-[520px] rounded-3xl border border-edge-live bg-surface p-8">
        <h3 className="mb-2 text-lime">🔗 Invite Link</h3>
        <p className="mb-6 text-sm text-muted">
          Share this link with <strong className="text-ink">{client.businessName}</strong> staff. Anyone who registers via this link will be automatically linked to their agency.
        </p>
        <div className="mb-4 break-all rounded-xl border border-edge bg-[#1C1C19] px-4 py-3.5">
          <p className="font-mono text-[13px] text-lime">{inviteUrl}</p>
        </div>
        <div className="mb-4 flex gap-2.5">
          <Button variant="primary" className="flex-1" onClick={() => { navigator.clipboard.writeText(inviteUrl); }}>
            Copy Link
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="text-xs text-muted">⚠️ This link expires in 30 days. Generate a new one if needed.</p>
      </div>
    </div>
  );
}
