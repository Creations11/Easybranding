import Pagination from '../Pagination';
import exportCSV from '../../utils/exportCSV';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import StatTile from '../ui/StatTile';
import PageHeader from '../ui/PageHeader';
import { Input, Select } from '../ui/Field';

// Badge tones (ui/Badge.jsx) for a client's status and plan.
const STATUS_TONE = { active: 'live', trial: 'warn', suspended: 'bad', cancelled: 'neutral' };
const PLAN_TONE = { starter: 'moving', growth: 'live', enterprise: 'system' };

export default function ClientsSection({ selectedClientIds, setSelectedClientIds, setBulkModal, clientsFilter, clientsPage, setClientsPage, ITEMS_PER_PAGE, setClientModal, tenantStats, handleActivate, handleSuspend, generateInvite, handleCloseClient, isSuperAdmin, flowTemplates, flowChoice, setFlowChoice, handleAllocateFlow }) {
  const filtered = clientsFilter.searchTerm || clientsFilter.filters.status || clientsFilter.filters.plan;
  return (
    <div>
      <PageHeader title="Clients" sub="Manage rental agency accounts">
        <Button
          variant={selectedClientIds.length > 0 ? 'warn' : 'secondary'}
          onClick={() => {
            if (selectedClientIds.length === 0) {
              alert('Select clients first by checking the boxes');
              return;
            }
            setBulkModal(true);
          }}
        >
          📦 Bulk ({selectedClientIds.length})
        </Button>
        <Button variant="system" onClick={() => {
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
        }}>📥 Export CSV</Button>
        <Button variant="primary" onClick={() => setClientModal({})}>+ Add Client</Button>
      </PageHeader>

      {tenantStats && (
        <div className="mb-7 flex flex-wrap gap-3">
          <StatTile label="Total" value={tenantStats.total || 0} highlight tone="ink" />
          <StatTile label="Active" value={tenantStats.active || 0} highlight tone="lime" />
          <StatTile label="Trial" value={tenantStats.trial || 0} highlight tone="amber" />
          <StatTile label="MRR" value={'R' + ((tenantStats.mrr || 0).toLocaleString())} highlight tone="lime" note="monthly recurring" />
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <Input
          mono={false}
          value={clientsFilter.searchTerm}
          onChange={e => { clientsFilter.setSearchTerm(e.target.value); setClientsPage(1); }}
          placeholder="Search clients..."
          aria-label="Search clients"
          className="min-w-[200px] flex-1 bg-card"
        />
        <Select
          value={clientsFilter.filters.status || 'all'}
          onChange={e => { clientsFilter.setFilter('status', e.target.value === 'all' ? null : e.target.value); setClientsPage(1); }}
          aria-label="Status"
          className="w-auto cursor-pointer bg-card"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Select
          value={clientsFilter.filters.plan || 'all'}
          onChange={e => { clientsFilter.setFilter('plan', e.target.value === 'all' ? null : e.target.value); setClientsPage(1); }}
          aria-label="Plan"
          className="w-auto cursor-pointer bg-card"
        >
          <option value="all">All Plans</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="enterprise">Enterprise</option>
        </Select>
        {filtered && (
          <Button variant="ghost" onClick={() => { clientsFilter.clearAll(); setClientsPage(1); }}>
            Clear
          </Button>
        )}
      </div>

      {clientsFilter.filteredCount !== clientsFilter.totalCount && (
        <p className="mb-3 text-[13px] text-muted">
          Showing {clientsFilter.filteredCount} of {clientsFilter.totalCount} clients
        </p>
      )}

      {clientsFilter.filtered.length === 0 ? (
        <div className="py-[60px] text-center text-muted">
          <p className="mb-4 text-[40px]">{clientsFilter.searchTerm ? '🔍' : '🌿'}</p>
          <p>{clientsFilter.searchTerm ? 'No clients match your search.' : 'No clients yet — add your first one.'}</p>
        </div>
      ) : (
        <>
          {clientsFilter.filtered
            .slice((clientsPage - 1) * ITEMS_PER_PAGE, clientsPage * ITEMS_PER_PAGE)
            .map(tenant => {
              const selected = selectedClientIds.includes(tenant._id);
              return (
                <div key={tenant._id}
                  className={`card-hover mb-2.5 rounded-[14px] border bg-card px-6 py-[18px] ${!tenant.whatsappNumber ? 'border-amber/25' : selected ? 'border-lime/40' : 'border-edge'}`}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <input type="checkbox" checked={selected} aria-label={`Select ${tenant.businessName}`} onChange={() => {
                      setSelectedClientIds(prev => prev.includes(tenant._id) ? prev.filter(id => id !== tenant._id) : [...prev, tenant._id]);
                    }} className="h-4 w-4 cursor-pointer accent-lime" />
                    <div className="flex flex-1 flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <strong className="text-base">{tenant.businessName}</strong>
                          <Badge tone={STATUS_TONE[tenant.status] || 'neutral'}>{tenant.status}</Badge>
                          <Badge tone={PLAN_TONE[tenant.plan] || 'neutral'}>{tenant.plan}</Badge>
                          {!tenant.whatsappNumber && <Badge tone="warn">⚠️ No WhatsApp</Badge>}
                        </div>
                        <p className="text-[13px] text-muted">{tenant.contactEmail}{tenant.whatsappNumber ? <> · <span className="font-mono">{tenant.whatsappNumber}</span></> : ''}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="rounded-lg bg-lime/5 px-3 py-1.5 text-center"><p className="font-mono text-base font-bold tabular-nums text-lime">{tenant.totalLeads || 0}</p><p className="text-[10px] text-muted">Leads</p></div>
                        <div className="rounded-lg bg-white/3 px-3 py-1.5 text-center"><p className="font-mono text-base font-bold tabular-nums text-ink">R{tenant.monthlyFee}</p><p className="text-[10px] text-muted">/mo</p></div>
                        {['suspended', 'cancelled'].includes(tenant.status)
                          ? <Button variant="live" onClick={() => handleActivate(tenant)}>{tenant.status === 'cancelled' ? '▶ Reopen' : '▶ Activate'}</Button>
                          : <Button variant="warn" onClick={() => handleSuspend(tenant)}>⏸ Suspend</Button>}
                        <Button variant="live" onClick={() => setClientModal(tenant)}>Edit</Button>
                        <Button variant="system" onClick={() => generateInvite(tenant)}>🔗 Invite</Button>
                        {isSuperAdmin && tenant.status !== 'cancelled' && <Button variant="danger" onClick={() => handleCloseClient(tenant)}>Close account</Button>}
                        {isSuperAdmin && flowTemplates.length > 0 && (
                          <div className="flex items-center gap-1">
                            <select value={flowChoice[tenant._id] || flowTemplates[0].id} onChange={e => setFlowChoice(prev => ({ ...prev, [tenant._id]: e.target.value }))}
                              title="Industry flow template" aria-label={`Flow template for ${tenant.businessName}`}
                              className="min-h-[44px] max-w-[180px] cursor-pointer rounded-lg border border-moss/35 bg-moss/15 px-2 text-xs text-sage focus:outline-none">
                              {flowTemplates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                            <Button variant="live" onClick={() => handleAllocateFlow(tenant)} title="Allocate this flow as the client's live bot">⚡ Allocate</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
