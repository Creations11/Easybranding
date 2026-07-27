// src/components/LeadsBoard.jsx
//
// The Kanban board of lead states, extracted from SuperAdminDashboard
// (2026-07-27) as the first step of the Phase 3 split. It was the single
// largest block on that page and has a clean boundary — all it needs is the
// columns, the tenant filter and three action handlers.
//
// The three-state rendering per column (error / loading / empty) and the
// truncation badge are load-bearing, not decoration: before them, a failed
// fetch and an empty column both rendered as "None", and a column showing
// its first 20 of 70 looked complete. That is what put 50 closed leads under
// "Other" as though nobody had closed them.

export default function LeadsBoard({
  columns,
  allLeadsCount,
  tenants,
  tenantNameById,
  tenantFilter,
  onTenantFilterChange,
  onOpenLead,
  onTakeover,
  onResume,
  onReopen,
  colors: c,
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Leads <span style={{ color: c.muted, fontWeight: 400, fontSize: 14 }}>({allLeadsCount} total in system)</span></h2>
        <select
          value={tenantFilter}
          onChange={e => onTenantFilterChange(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 10, background: c.card, border: '1px solid ' + c.borderDim, color: c.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
        >
          <option value="all">All businesses</option>
          {tenants.map(t => (
            <option key={t._id} value={t._id}>{t.businessName}</option>
          ))}
        </select>
      </div>

      <p style={{ color: c.muted, fontSize: 12, marginBottom: 12 }}>
        Scroll sideways (mouse wheel, trackpad, or drag the scrollbar below) to see Qualified, Rejected, Closed{columns.some(c2 => c2.key === 'other') ? ', and Other' : ''} →
      </p>

      {/* onWheel: a horizontal-scroll-only row is easy to miss —
          without this, columns past the first are only reachable
          via a trackpad swipe or shift+scroll, which most mouse
          users won't discover. Converts normal vertical scroll
          into horizontal movement while hovering the board —
          but ONLY when there's no vertical scrolling left to do
          in whatever's under the cursor. Without that check,
          this handler hijacked scrolling through a column's own
          list (each column has its own 620px-tall internal
          scroll), making anything past the visible portion of
          a column unreachable. */}
      <div
        className="leads-board-scroll"
        onWheel={e => {
          if (e.deltaY === 0) return;
          const col = e.target.closest('.lead-column-scroll');
          if (col) {
            const canScrollDown = e.deltaY > 0 && col.scrollTop + col.clientHeight < col.scrollHeight;
            const canScrollUp = e.deltaY < 0 && col.scrollTop > 0;
            if (canScrollDown || canScrollUp) return; // let the column scroll normally
          }
          e.currentTarget.scrollLeft += e.deltaY;
          e.preventDefault();
        }}
        style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}
      >
        {columns.map(col => (
          <div key={col.key} style={{ flex: '0 0 300px', width: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{col.icon} {col.label}</span>
              <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 999, background: c.borderDim, color: c.muted, fontWeight: 700 }}>{col.items.length}</span>
              {/* Say so when the server holds more than arrived. A column
                  that silently showed its first 20 of 70 is what put 50
                  closed leads under "Other" (fixed 2026-07-27). */}
              {col.q?.data?.total > col.items.length && tenantFilter === 'all' && (
                <span title={`Showing ${col.items.length} of ${col.q.data.total}`}
                  style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: c.amber + '22', color: c.amber, fontWeight: 700 }}>
                  of {col.q.data.total}
                </span>
              )}
            </div>
            <div className="lead-column-scroll" style={{ maxHeight: 620, overflowY: 'auto', paddingRight: 4 }}>
              {/* Three distinct states. They all rendered as "None" before,
                  so a failed fetch was indistinguishable from an empty
                  column — the board's most misleading behaviour. */}
              {col.q?.isError ? (
                <div style={{ padding: '18px 0', textAlign: 'center' }}>
                  <p style={{ color: c.red, fontSize: 13, marginBottom: 8 }}>Couldn't load this column</p>
                  <button onClick={() => col.q.refetch?.()} style={{ padding: '5px 12px', background: c.red + '22', color: c.red, border: '1px solid ' + c.red + '44', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Retry</button>
                </div>
              ) : col.q?.isLoading ? (
                <p style={{ color: c.muted, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Loading…</p>
              ) : col.items.length === 0 ? (
                <p style={{ color: c.muted, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>None</p>
              ) : col.items.map(lead => {
                const business = tenantNameById[lead.tenantId];
                return (
                  <div key={lead._id} onClick={() => onOpenLead(lead._id)} className="card-hover" style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                      <strong style={{ fontSize: 13 }}>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                    </div>
                    {business && <p style={{ color: c.cyan, fontSize: 11, marginBottom: 3 }}>{business}</p>}
                    <p style={{ color: c.muted, fontSize: 12, marginBottom: 6 }}>{lead.phone}</p>

                    {col.key === 'active' && (
                      <>
                        {lead.isProspect && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: c.lime + '22', color: c.lime, fontWeight: 700, marginRight: 6 }}>🎯 Prospect</span>}
                        <div style={{ marginTop: 6 }}>
                          {lead.takenOver
                            ? <button onClick={(e) => onResume(e, lead._id)} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: c.cyan + '22', color: c.cyan, border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>🤖 Resume bot</button>
                            : <button onClick={(e) => onTakeover(e, lead._id)} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: c.lime, color: '#06080A', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>✋ Take over</button>}
                        </div>
                      </>
                    )}

                    {col.key === 'qualified' && lead.aiSummary?.score && (
                      <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, fontWeight: 700, background: lead.aiSummary.score >= 8 ? c.lime + '22' : c.amber + '22', color: lead.aiSummary.score >= 8 ? c.lime : c.amber }}>🤖 {lead.aiSummary.score}/10</span>
                    )}

                    {col.key === 'rejected' && (
                      <p style={{ color: c.red, fontSize: 11 }}>{lead.rejectionReason || 'Did not qualify'}</p>
                    )}

                    {col.key === 'closed' && (
                      <>
                        <p style={{ color: c.muted, fontSize: 11, marginBottom: 6 }}>{lead.closeReason || 'Manually closed'}{lead.closedAt ? ' · ' + new Date(lead.closedAt).toLocaleDateString('en-ZA') : ''}</p>
                        <button onClick={(e) => onReopen(e, lead._id)} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, background: c.lime + '22', color: c.lime, border: '1px solid ' + c.border, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>🔓 Reopen</button>
                      </>
                    )}

                    {col.key === 'other' && (
                      <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, background: c.amber + '18', color: c.amber }}>{lead.workflowStatus?.replace(/_/g, ' ') || 'unknown status'}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
