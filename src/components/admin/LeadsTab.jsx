import Button from '../ui/Button';

// A score of 8 or more reads lime; anything lower is worth a second look.
const scoreTone = (score) => (score >= 8 ? 'bg-lime/15 text-lime' : 'bg-amber/15 text-amber');

export default function LeadsTab({ isMobile, leadColumns, mobileCol, setMobileCol, setLeadDetailId, setAssignModal, handleReopen }) {
  return (
    <div>
      <h2 className={`text-xl ${isMobile ? 'mb-3' : 'mb-5'}`}>Leads</h2>

      {/* On a phone this board is the screen standing between the owner
          and a customer conversation, and it was four 300px columns in a
          horizontal scroller — roughly three screens wide on a 390px
          device. The hint below it said "mouse wheel, trackpad, or drag
          the scrollbar", none of which exist on a phone.

          One column at a time on a phone,
          picked by a chip. */}
      {isMobile ? (
        <div className="mb-3.5 flex gap-1.5 overflow-x-auto pb-1">
          {leadColumns.map(col => (
            <button key={col.key} type="button" onClick={() => setMobileCol(col.key)}
              className={`inline-flex min-h-[44px] shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold ${
                mobileCol === col.key ? 'border-lime bg-lime/15 text-lime' : 'border-edge bg-transparent text-muted'
              }`}>
              {col.icon} {col.label} ({col.items.length})
            </button>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-xs text-muted">
          Scroll sideways (mouse wheel, trackpad, or drag the scrollbar below) to see Qualified, Rejected, and Closed →
        </p>
      )}
      {/* onWheel: a horizontal-scroll-only row is easy to miss without
          a trackpad — converts normal vertical scroll into horizontal
          movement while hovering the board, but ONLY when there's no
          vertical scrolling left to do in whatever's under the cursor
          (otherwise this hijacks scrolling through a column's own
          620px-tall internal list, making anything past the visible
          portion unreachable). */}
      <div
        className={`leads-board-scroll flex gap-4 pb-2 ${isMobile ? 'overflow-x-visible' : 'overflow-x-auto'}`}
        onWheel={e => {
          if (e.deltaY === 0) return;
          const col = e.target.closest('.lead-column-scroll');
          if (col) {
            const canScrollDown = e.deltaY > 0 && col.scrollTop + col.clientHeight < col.scrollHeight;
            const canScrollUp = e.deltaY < 0 && col.scrollTop > 0;
            if (canScrollDown || canScrollUp) return;
          }
          e.currentTarget.scrollLeft += e.deltaY;
          e.preventDefault();
        }}
      >
        {(isMobile ? leadColumns.filter(c => c.key === mobileCol) : leadColumns).map(col => (
          <div key={col.key} className={isMobile ? 'min-w-0 flex-1' : 'w-[300px] flex-[0_0_300px]'}>
            <div className={`mb-3 items-center gap-2 ${isMobile ? 'hidden' : 'flex'}`}>
              <span className="text-[15px] font-bold">{col.icon} {col.label}</span>
              <span className="rounded-full bg-edge px-[9px] py-0.5 font-mono text-[11px] font-bold text-muted">{col.items.length}</span>
            </div>
            <div className={`lead-column-scroll pr-1 ${isMobile ? '' : 'max-h-[620px] overflow-y-auto'}`}>
              {col.items.length === 0 ? (
                <p className="py-5 text-center text-[13px] text-muted">None</p>
              ) : col.items.map(lead => (
                <div key={lead._id} onClick={() => setLeadDetailId(lead._id)}
                  className={`mb-2 cursor-pointer rounded-xl border bg-card px-3.5 py-3 hover:bg-raise ${col.key === 'qualified' && lead.needsManualFollowUp ? 'border-amber/40' : 'border-edge'}`}>
                  <strong className="text-[13px]">{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                  <p className="mb-1.5 font-mono text-xs text-muted">{lead.phone}</p>

                  {col.key === 'active' && (
                    <>
                      <p className="mb-1.5 text-[11px] text-muted">Stage {lead.stageNumber}/{lead.totalStages} · {lead.minutesSinceLastMessage}m ago</p>
                      <Button variant="warn" onClick={e => { e.stopPropagation(); setAssignModal(lead); }}>Assign</Button>
                    </>
                  )}

                  {col.key === 'qualified' && (
                    <>
                      <div className="mb-1.5 flex flex-wrap gap-1">
                        {lead.needsManualFollowUp && <span className="rounded-full bg-amber/15 px-[7px] py-0.5 text-[10px] font-bold text-amber">⚠️ No phone</span>}
                        {lead.aiSummary?.score && <span className={`rounded-full px-[7px] py-0.5 text-[10px] font-bold ${scoreTone(lead.aiSummary.score)}`}>🤖 {lead.aiSummary.score}/10</span>}
                      </div>
                      {lead.assignedAgent
                        ? <p className="text-[11px] text-emerald">✅ Assigned to {lead.assignedAgent}</p>
                        : <Button variant="live" onClick={e => { e.stopPropagation(); setAssignModal(lead); }}>Assign Agent</Button>}
                    </>
                  )}

                  {col.key === 'rejected' && (
                    <p className="text-[11px] text-red">{lead.rejectionReason || 'Did not qualify'}</p>
                  )}

                  {col.key === 'closed' && (
                    <>
                      <p className="mb-1.5 text-[11px] text-muted">{lead.closeReason || 'Manually closed'}{lead.closedAt ? ' · ' + new Date(lead.closedAt).toLocaleDateString('en-ZA') : ''}</p>
                      <Button variant="live" onClick={e => handleReopen(e, lead._id)}>🔓 Reopen</Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
