export default function ViewingsTab({ viewingRequests, setLeadDetailId }) {
  return (
    <div>
      <h2 className="mb-5 text-xl">Viewing Requests ({viewingRequests.length})</h2>
      {viewingRequests.length === 0 ? (
        <div className="py-[60px] text-center text-muted">
          <p className="mb-4 text-[40px]">📅</p>
          <p>No viewing requests yet.</p>
        </div>
      ) : viewingRequests.map(v => (
        <div key={v._id} onClick={() => setLeadDetailId(v._id)} className="mb-2.5 flex cursor-pointer items-center justify-between gap-3 rounded-[14px] border border-edge bg-card px-6 py-[18px] hover:bg-raise">
          <div>
            <strong className="text-[15px]">{v.name !== 'Unknown' ? v.name : v.phone}</strong>
            <p className="mt-0.5 font-mono text-[13px] text-muted">{v.phone}</p>
            {v.propertyAddress && <p className="text-xs text-muted">📍 {v.propertyAddress}</p>}
          </div>
          <div className="text-right">
            {v.viewingScheduledAt ? (
              <>
                <p className="font-bold text-lime">{new Date(v.viewingScheduledAt).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                <p className="font-mono text-xs text-muted">{new Date(v.viewingScheduledAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</p>
              </>
            ) : (
              <span className="text-xs text-amber">Pending schedule</span>
            )}
            <span className="mt-1 block rounded-full bg-emerald/15 px-2 py-0.5 text-[11px] text-emerald">
              {v.viewingStatus || 'requested'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
