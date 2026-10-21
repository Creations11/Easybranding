import api from '../../api';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import StatTile from '../ui/StatTile';
import { Input } from '../ui/Field';

// Badge tones (ui/Badge.jsx) for a client's plan and status.
const PLAN_TONES   = { starter: 'neutral', growth: 'live', enterprise: 'good' };
const STATUS_TONES = { active: 'live', trial: 'warn', suspended: 'bad', cancelled: 'neutral' };

export default function ClientsTab({ clients, clientStats, filteredClients, clientSearch, setClientSearch, clientFilter, setClientFilter, setClientModal, setInviteUrl, setInviteModal, loadData, handleDeleteClient }) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl">Client Management ({clients.length})</h2>
        <Button variant="primary" onClick={() => setClientModal({})}>+ Add Client</Button>
      </div>
      {clientStats && (
        <div className="mb-5 flex flex-wrap gap-3">
          {[
            { label: 'Total',  value: clientStats.total  || 0 },
            { label: 'Active', value: clientStats.active || 0, tone: 'lime' },
            { label: 'Trial',  value: clientStats.trial  || 0, tone: 'amber' },
            { label: 'MRR',    value: `R${(clientStats.mrr || 0).toLocaleString()}`, tone: 'emerald' },
          ].map(s => (
            <StatTile key={s.label} label={s.label} value={s.value} tone={s.tone || 'ink'} highlight />
          ))}
        </div>
      )}
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <Input mono={false} value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Search clients..." className="w-60 bg-[#1C1C19]" />
        {['all', 'active', 'trial', 'suspended', 'cancelled'].map(s => (
          <button key={s} type="button" onClick={() => setClientFilter(s)}
            className={`min-h-[44px] cursor-pointer rounded-[10px] px-4 text-[13px] capitalize ${clientFilter === s ? 'bg-lime font-bold text-[#050505]' : 'bg-white/6 text-muted hover:bg-raise'}`}>{s}</button>
        ))}
      </div>
      {filteredClients.length === 0
        ? <div className="py-[60px] text-center text-muted"><p className="mb-4 text-[40px]">🌿</p><p>{clientSearch ? 'No clients match your search' : 'No clients yet — add your first one'}</p></div>
        : filteredClients.map(client => (
          <div key={client._id} className={`mb-2.5 rounded-[14px] border bg-card px-6 py-[18px] ${!client.whatsappNumber ? 'border-amber/25' : 'border-edge'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2.5">
                  <strong className="text-base">{client.businessName}</strong>
                  <Badge tone={STATUS_TONES[client.status] || 'neutral'}>{client.status}</Badge>
                  <Badge tone={PLAN_TONES[client.plan] || 'neutral'}>{client.plan}</Badge>
                  {!client.whatsappNumber && (
                    <Badge tone="warn">⚠️ No WhatsApp number</Badge>
                  )}
                  {client.inviteToken && client.inviteExpiresAt && (
                    <Badge tone="system">
                      🔗 Invite expires {new Date(client.inviteExpiresAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                    </Badge>
                  )}
                </div>
                <p className="text-[13px] text-muted">
                  {client.contactEmail}
                  {client.industry ? ` · ${client.industry}` : ''}
                  {client.whatsappNumber ? ` · ${client.whatsappNumber}` : ''}
                  {` · ${client.workflowType || 'full'} workflow`}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="rounded-lg bg-lime/8 px-3.5 py-1.5 text-center">
                  <p className="font-mono text-base font-bold tabular-nums text-lime">{client.totalLeads || 0}</p>
                  <p className="text-[10px] text-muted">Leads</p>
                </div>
                <div className="rounded-lg bg-white/4 px-3.5 py-1.5 text-center">
                  <p className="font-mono text-base font-bold tabular-nums text-ink">R{client.monthlyFee}</p>
                  <p className="text-[10px] text-muted">/mo</p>
                </div>
                {/* No suspend/activate toggle here (security scan, 2026-09-14).
                    This dashboard is a client owner's, and status is billing's
                    to set: a suspended client could activate themselves with
                    it. The API now ignores status from an owner, and platform
                    staff change it from the Super Admin dashboard. */}
                <Button variant="live" onClick={() => setClientModal(client)}>Edit</Button>
                <Button variant="system" onClick={async () => {
                  try {
                    const res = await api.post(`/invites/${client._id}/generate`);
                    setInviteUrl(res.data.data?.inviteUrl || '');
                    setInviteModal(client);
                    loadData();
                  } catch (err) { alert(err.response?.data?.message || 'Failed to generate invite link'); }
                }}>🔗 Invite</Button>
                <Button variant="danger" onClick={() => handleDeleteClient(client)}>Close account</Button>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
