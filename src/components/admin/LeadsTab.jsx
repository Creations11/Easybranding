import { colors } from '../../utils/theme';

export default function LeadsTab({ isMobile, leadColumns, mobileCol, setMobileCol, setLeadDetailId, setAssignModal, handleReopen }) {
  return (
    <div>
      <h2 style={{ marginBottom: isMobile ? '12px' : '20px', fontSize: '20px' }}>Leads</h2>

      {/* On a phone this board is the screen standing between the owner
          and a customer conversation, and it was four 300px columns in a
          horizontal scroller — roughly three screens wide on a 390px
          device. The hint below it said "mouse wheel, trackpad, or drag
          the scrollbar", none of which exist on a phone.

          One column at a time on a phone,
          picked by a chip. */}
      {isMobile ? (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
          {leadColumns.map(col => (
            <button key={col.key} onClick={() => setMobileCol(col.key)}
              style={{
                flexShrink: 0, minHeight: 40, padding: '0 14px', borderRadius: 999,
                border: `1px solid ${mobileCol === col.key ? colors.lime : colors.borderDim}`,
                background: mobileCol === col.key ? `${colors.lime}22` : 'transparent',
                color: mobileCol === col.key ? colors.lime : colors.muted,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}>
              {col.icon} {col.label} ({col.items.length})
            </button>
          ))}
        </div>
      ) : (
        <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '12px' }}>
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
        className="leads-board-scroll"
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
        style={{ display: 'flex', gap: '16px', overflowX: isMobile ? 'visible' : 'auto', paddingBottom: '8px' }}
      >
        {(isMobile ? leadColumns.filter(c => c.key === mobileCol) : leadColumns).map(col => (
          <div key={col.key} style={isMobile ? { flex: 1, minWidth: 0 } : { flex: '0 0 300px', width: '300px' }}>
            <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700' }}>{col.icon} {col.label}</span>
              <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '999px', background: colors.borderDim, color: colors.muted, fontWeight: '700' }}>{col.items.length}</span>
            </div>
            <div className="lead-column-scroll" style={isMobile ? { paddingRight: 4 } : { maxHeight: '620px', overflowY: 'auto', paddingRight: '4px' }}>
              {col.items.length === 0 ? (
                <p style={{ color: colors.muted, fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>None</p>
              ) : col.items.map(lead => (
                <div key={lead._id} onClick={() => setLeadDetailId(lead._id)} style={{ background: colors.card, border: `1px solid ${col.key === 'qualified' && lead.needsManualFollowUp ? colors.amber + '66' : colors.borderDim}`, borderRadius: '12px', padding: '12px 14px', marginBottom: '8px', cursor: 'pointer' }}>
                  <strong style={{ fontSize: '13px' }}>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                  <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>{lead.phone}</p>

                  {col.key === 'active' && (
                    <>
                      <p style={{ color: colors.muted, fontSize: '11px', marginBottom: '6px' }}>Stage {lead.stageNumber}/{lead.totalStages} · {lead.minutesSinceLastMessage}m ago</p>
                      <button onClick={e => { e.stopPropagation(); setAssignModal(lead); }} style={{ padding: '5px 12px', background: `${colors.amber}22`, color: colors.amber, border: `1px solid ${colors.amber}44`, borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Assign</button>
                    </>
                  )}

                  {col.key === 'qualified' && (
                    <>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        {lead.needsManualFollowUp && <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', fontWeight: '700', background: `${colors.amber}22`, color: colors.amber }}>⚠️ No phone</span>}
                        {lead.aiSummary?.score && <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', fontWeight: '700', background: lead.aiSummary.score >= 8 ? `${colors.lime}22` : `${colors.amber}22`, color: lead.aiSummary.score >= 8 ? colors.lime : colors.amber }}>🤖 {lead.aiSummary.score}/10</span>}
                      </div>
                      {lead.assignedAgent
                        ? <p style={{ color: colors.emerald, fontSize: '11px' }}>✅ Assigned to {lead.assignedAgent}</p>
                        : <button onClick={e => { e.stopPropagation(); setAssignModal(lead); }} style={{ padding: '5px 12px', background: `${colors.lime}22`, color: colors.lime, border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Assign Agent</button>}
                    </>
                  )}

                  {col.key === 'rejected' && (
                    <p style={{ color: colors.red, fontSize: '11px' }}>{lead.rejectionReason || 'Did not qualify'}</p>
                  )}

                  {col.key === 'closed' && (
                    <>
                      <p style={{ color: colors.muted, fontSize: '11px', marginBottom: '6px' }}>{lead.closeReason || 'Manually closed'}{lead.closedAt ? ' · ' + new Date(lead.closedAt).toLocaleDateString('en-ZA') : ''}</p>
                      <button onClick={e => handleReopen(e, lead._id)} style={{ padding: '5px 12px', background: `${colors.lime}22`, color: colors.lime, border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>🔓 Reopen</button>
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
