import StatCard from '../StatCard';
import Pagination from '../Pagination';
import exportCSV from '../../utils/exportCSV';
import { c, STATUS_COLOR, PLAN_COLOR } from './tokens';

export default function ClientsSection({ selectedClientIds, setSelectedClientIds, setBulkModal, clientsFilter, clientsPage, setClientsPage, ITEMS_PER_PAGE, setClientModal, tenantStats, handleActivate, handleSuspend, generateInvite, handleCloseClient, isSuperAdmin, flowTemplates, flowChoice, setFlowChoice, handleAllocateFlow }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div><h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: 4 }}>Clients</h1><p style={{ color: c.muted, fontSize: 15 }}>Manage rental agency accounts</p></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => {
            if (selectedClientIds.length === 0) {
              alert('Select clients first by checking the boxes');
              return;
            }
            setBulkModal(true);
          }} style={{ padding: '12px 18px', background: selectedClientIds.length > 0 ? c.amber + '22' : 'rgba(255,255,255,0.04)', color: selectedClientIds.length > 0 ? c.amber : c.muted, border: '1px solid ' + (selectedClientIds.length > 0 ? c.amber + '33' : c.borderDim), borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>
            📦 Bulk ({selectedClientIds.length})
          </button>
          <button onClick={() => {
            const exportData = clientsFilter.filtered.map(t => ({
              businessName: t.businessName || '',
              status: t.status || '',
              plan: t.plan || '',
              email: t.contactEmail || '',
              whatsapp: t.whatsappNumber || '',
              leads: t.totalLeads || 0,
              monthlyFee: 'R' + (t.monthlyFee || 0),
            }));
            exportCSV(exportData, 'clients-export');
          }} style={{ padding: '12px 18px', background: c.cyan + '22', color: c.cyan, border: '1px solid ' + c.cyan + '33', borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>📥 Export CSV</button>
          <button onClick={() => setClientModal({})} style={{ padding: '12px 24px', background: c.lime, color: '#080A06', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Client</button>
        </div>
      </div>
      {tenantStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 28 }}>
          <StatCard label="Total" value={tenantStats.total || 0} icon="👥" />
          <StatCard label="Active" value={tenantStats.active || 0} color={c.lime} icon="✅" />
          <StatCard label="Trial" value={tenantStats.trial || 0} color={c.amber} icon="🧪" />
          <StatCard label="MRR" value={'R' + ((tenantStats.mrr || 0).toLocaleString())} color={c.lime} icon="💰" sub="monthly recurring" />
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={clientsFilter.searchTerm}
          onChange={e => { clientsFilter.setSearchTerm(e.target.value); setClientsPage(1); }}
          placeholder="Search clients..."
          style={{ padding: '10px 14px', background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', flex: 1, minWidth: '200px' }}
        />
        <select
          value={clientsFilter.filters.status || 'all'}
          onChange={e => { clientsFilter.setFilter('status', e.target.value === 'all' ? null : e.target.value); setClientsPage(1); }}
          style={{ padding: '10px 14px', background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={clientsFilter.filters.plan || 'all'}
          onChange={e => { clientsFilter.setFilter('plan', e.target.value === 'all' ? null : e.target.value); setClientsPage(1); }}
          style={{ padding: '10px 14px', background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
        >
          <option value="all">All Plans</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="enterprise">Enterprise</option>
        </select>
        {(clientsFilter.searchTerm || clientsFilter.filters.status || clientsFilter.filters.plan) && (
          <button onClick={() => { clientsFilter.clearAll(); setClientsPage(1); }} style={{ padding: '10px 14px', background: 'transparent', border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.muted, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
            Clear
          </button>
        )}
      </div>

      {clientsFilter.filteredCount !== clientsFilter.totalCount && (
        <p style={{ color: c.muted, fontSize: 13, marginBottom: 12 }}>
          Showing {clientsFilter.filteredCount} of {clientsFilter.totalCount} clients
        </p>
      )}

      {clientsFilter.filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>{clientsFilter.searchTerm ? '🔍' : '🌿'}</p>
          <p>{clientsFilter.searchTerm ? 'No clients match your search.' : 'No clients yet — add your first one.'}</p>
        </div>
      ) : (
        <>
          {clientsFilter.filtered
            .slice((clientsPage - 1) * ITEMS_PER_PAGE, clientsPage * ITEMS_PER_PAGE)
            .map(tenant => (
            <div key={tenant._id} className="card-hover" style={{ background: c.card, border: '1px solid ' + (!tenant.whatsappNumber ? c.amber + '44' : selectedClientIds.includes(tenant._id) ? c.lime + '66' : c.borderDim), borderRadius: 14, padding: '18px 24px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <input type="checkbox" checked={selectedClientIds.includes(tenant._id)} onChange={() => {
                  setSelectedClientIds(prev => prev.includes(tenant._id) ? prev.filter(id => id !== tenant._id) : [...prev, tenant._id]);
                }} style={{ cursor: 'pointer', accentColor: c.lime, width: 16, height: 16 }} />
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <strong style={{ fontSize: 16 }}>{tenant.businessName}</strong>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: (STATUS_COLOR[tenant.status] || c.muted) + '22', color: STATUS_COLOR[tenant.status] || c.muted, fontWeight: 600 }}>{tenant.status}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: (PLAN_COLOR[tenant.plan] || c.muted) + '22', color: PLAN_COLOR[tenant.plan] || c.muted }}>{tenant.plan}</span>
                      {!tenant.whatsappNumber && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: c.amber + '22', color: c.amber, fontWeight: 600 }}>⚠️ No WhatsApp</span>}
                    </div>
                    <p style={{ color: c.muted, fontSize: 13 }}>{tenant.contactEmail}{tenant.whatsappNumber ? ' · ' + tenant.whatsappNumber : ''}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center', padding: '6px 12px', background: c.lime + '08', borderRadius: 8 }}><p style={{ color: c.lime, fontWeight: 700, fontSize: 16 }}>{tenant.totalLeads || 0}</p><p style={{ color: c.muted, fontSize: 10 }}>Leads</p></div>
                    <div style={{ textAlign: 'center', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}><p style={{ color: c.text, fontWeight: 700, fontSize: 16 }}>R{tenant.monthlyFee}</p><p style={{ color: c.muted, fontSize: 10 }}>/mo</p></div>
                    {['suspended', 'cancelled'].includes(tenant.status)
                      ? <button onClick={() => handleActivate(tenant)} style={{ padding: '7px 14px', background: c.lime + '22', color: c.lime, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>{tenant.status === 'cancelled' ? '▶ Reopen' : '▶ Activate'}</button>
                      : <button onClick={() => handleSuspend(tenant)} style={{ padding: '7px 14px', background: c.amber + '22', color: c.amber, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>⏸ Suspend</button>}
                    <button onClick={() => setClientModal(tenant)} style={{ padding: '7px 14px', background: c.lime + '22', color: c.lime, border: '1px solid ' + c.border, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Edit</button>
                    <button onClick={() => generateInvite(tenant)} style={{ padding: '7px 14px', background: c.cyan + '22', color: c.cyan, border: '1px solid ' + c.cyan + '33', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>🔗 Invite</button>
                    {isSuperAdmin && tenant.status !== 'cancelled' && <button onClick={() => handleCloseClient(tenant)} style={{ padding: '7px 14px', background: c.red + '22', color: c.red, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Close account</button>}
                    {isSuperAdmin && flowTemplates.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <select value={flowChoice[tenant._id] || flowTemplates[0].id} onChange={e => setFlowChoice(prev => ({ ...prev, [tenant._id]: e.target.value }))} title="Industry flow template" style={{ padding: '7px 8px', background: c.moss + '22', color: c.sage, border: '1px solid ' + c.moss + '55', borderRadius: 8, fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                          {flowTemplates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                        <button onClick={() => handleAllocateFlow(tenant)} title="Allocate this flow as the client's live bot" style={{ padding: '7px 12px', background: c.lime + '22', color: c.lime, border: '1px solid ' + c.border, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>⚡ Allocate</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Pagination
            currentPage={clientsPage}
            totalPages={Math.ceil(clientsFilter.filtered.length / ITEMS_PER_PAGE)}
            onPageChange={setClientsPage}
            showInfo
            totalItems={clientsFilter.filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
      )}
    </div>
  );
}
