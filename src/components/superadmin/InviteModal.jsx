import Button from '../ui/Button';

/** The invite link for a client's staff, after it is generated. */
export default function InviteModal({ client, inviteUrl, onClose }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-5">
      <div className="w-full max-w-[500px] rounded-[20px] border border-edge-live bg-surface p-8">
        <h3 className="mb-2 text-lime">🔗 Invite Link</h3>
        <p className="mb-5 text-sm text-muted">Share with <strong className="text-ink">{client.businessName}</strong> staff.</p>
        <div className="mb-3.5 break-all rounded-[10px] border border-edge bg-[#1C1C19] p-3.5"><p className="font-mono text-[13px] text-lime">{inviteUrl}</p></div>
        <div className="flex gap-2.5">
          <Button variant="primary" className="flex-1" onClick={() => navigator.clipboard.writeText(inviteUrl)}>Copy Link</Button>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
