import api from '../../api';
import { colors } from '../../utils/theme';

const PLAN_COLORS   = { starter: colors.muted, growth: colors.lime, enterprise: colors.emerald };
const STATUS_COLORS = { active: colors.lime, trial: colors.amber, suspended: colors.red, cancelled: colors.muted };

export default function ClientsTab({ clients, clientStats, filteredClients, clientSearch, setClientSearch, clientFilter, setClientFilter, setClientModal, setInviteUrl, setInviteModal, loadData, handleDeleteClient }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px' }}>Client Management ({clients.length})</h2>
        <button onClick={() => setClientModal({})} style={{ padding: '12px 24px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>+ Add Client</button>
      </div>
      {clientStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total',  value: clientStats.total  || 0 },
            { label: 'Active', value: clientStats.active || 0, color: colors.lime },
            { label: 'Trial',  value: clientStats.trial  || 0, color: colors.amber },
            { label: 'MRR',    value: `R${(clientStats.mrr || 0).toLocaleString()}`, color: colors.emerald },
          ].map(s => (
            <div key={s.label} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '16px 20px' }}>
              <p style={{ color: colors.muted, fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase' }}>{s.label}</p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: s.color || colors.text }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Search clients..." style={{ padding: '11px 16px', borderRadius: '10px', background: '#1C1C19', border: `1px solid ${colors.borderDim}`, color: colors.text, fontSize: '14px', width: '240px', outline: 'none' }} />
        {['all', 'active', 'trial', 'suspended', 'cancelled'].map(s => (
          <button key={s} onClick={() => setClientFilter(s)} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: clientFilter === s ? colors.lime : 'rgba(255,255,255,0.06)', color: clientFilter === s ? '#050505' : colors.muted, fontWeight: clientFilter === s ? '700' : '400', textTransform: 'capitalize', fontSize: '13px' }}>{s}</button>
        ))}
      </div>
      {filteredClients.length === 0
        ? <div style={{ textAlign: 'center', padding: '60px 0', color: colors.muted }}><p style={{ fontSize: '40px', marginBottom: '16px' }}>🌿</p><p>{clientSearch ? 'No clients match your search' : 'No clients yet — add your first one'}</p></div>
        : filteredClients.map(client => (
          <div key={client._id} style={{ background: colors.card, border: `1px solid ${!client.whatsappNumber ? colors.amber + '44' : colors.borderDim}`, borderRadius: '14px', padding: '18px 24px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '16px' }}>{client.businessName}</strong>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${STATUS_COLORS[client.status]}22`, color: STATUS_COLORS[client.status], fontWeight: '600' }}>{client.status}</span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${PLAN_COLORS[client.plan]}22`, color: PLAN_COLORS[client.plan] }}>{client.plan}</span>
                  {!client.whatsappNumber && (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${colors.amber}22`, color: colors.amber, fontWeight: '600' }}>⚠️ No WhatsApp number</span>
                  )}
                  {client.inviteToken && client.inviteExpiresAt && (
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${colors.cyan}18`, color: colors.cyan }}>
                      🔗 Invite expires {new Date(client.inviteExpiresAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
                <p style={{ color: colors.muted, fontSize: '13px' }}>
                  {client.contactEmail}
                  {client.industry ? ` · ${client.industry}` : ''}
                  {client.whatsappNumber ? ` · ${client.whatsappNumber}` : ''}
                  {` · ${client.workflowType || 'full'} workflow`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'center', padding: '6px 14px', background: colors.lime + '14', borderRadius: '8px' }}>
                  <p style={{ color: colors.lime, fontWeight: '700', fontSize: '16px' }}>{client.totalLeads || 0}</p>
                  <p style={{ color: colors.muted, fontSize: '10px' }}>Leads</p>
                </div>
                <div style={{ textAlign: 'center', padding: '6px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                  <p style={{ color: colors.text, fontWeight: '700', fontSize: '16px' }}>R{client.monthlyFee}</p>
                  <p style={{ color: colors.muted, fontSize: '10px' }}>/mo</p>
                </div>
                {/* No suspend/activate toggle here (security scan, 2026-09-14).
                    This dashboard is a client owner's, and status is billing's
                    to set: a suspended client could activate themselves with
                    it. The API now ignores status from an owner, and platform
                    staff change it from the Super Admin dashboard. */}
                <button onClick={() => setClientModal(client)} style={{ padding: '8px 14px', background: `${colors.lime}22`, color: colors.lime, border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                <button onClick={async () => {
                  try {
                    const res = await api.post(`/invites/${client._id}/generate`);
                    setInviteUrl(res.data.data?.inviteUrl || '');
                    setInviteModal(client);
                    loadData();
                  } catch (err) { alert(err.response?.data?.message || 'Failed to generate invite link'); }
                }} style={{ padding: '8px 14px', background: `${colors.cyan}22`, color: colors.cyan, border: `1px solid ${colors.cyan}33`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>🔗 Invite</button>
                <button onClick={() => handleDeleteClient(client)} style={{ padding: '8px 14px', background: `${colors.red}22`, color: colors.red, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Close account</button>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
