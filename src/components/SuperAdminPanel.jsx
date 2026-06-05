// src/components/SuperAdminPanel.jsx
// Platform-wide control plane — visible to super_admin only
import { useState, useEffect } from 'react';
import api from '../api';

const t = {
  lime:    '#B8F040',
  emerald: '#34d399',
  amber:   '#fbbf24',
  red:     '#f87171',
  cyan:    '#22d3ee',
  text:    '#EEF0E8',
  muted:   '#8A9080',
  card:    '#121210',
  surface: '#0A0A08',
  border:  'rgba(184,240,64,0.15)',
  borderDim: 'rgba(255,255,255,0.06)',
};

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '20px 24px' }}>
      <p style={{ color: t.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontSize: '36px', fontWeight: '800', color: color || t.text, lineHeight: 1, marginBottom: sub ? '4px' : 0 }}>{value}</p>
      {sub && <p style={{ color: t.muted, fontSize: '12px' }}>{sub}</p>}
    </div>
  );
}

export default function SuperAdminPanel() {
  const [tenantStats,  setTenantStats]  = useState(null);
  const [tenants,      setTenants]      = useState([]);
  const [allUsers,     setAllUsers]     = useState([]);
  const [health,       setHealth]       = useState(null);
  const [leadOverview, setLeadOverview] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [subTab,       setSubTab]       = useState('overview');

  useEffect(() => {
    const load = async () => {
      try {
        const [tsRes, tRes, uRes, hRes, loRes] = await Promise.all([
          api.get('/tenants/stats'),
          api.get('/tenants'),
          api.get('/users'),
          fetch(`${import.meta.env.VITE_API_URL}/health`).then(r => r.json()),
          api.get('/admin-ops/overview'),
        ]);
        setTenantStats(tsRes.data.data?.stats);
        setTenants(tRes.data.data?.tenants || []);
        setAllUsers(uRes.data.data?.users || []);
        setHealth(hRes);
        setLeadOverview(loRes.data.data?.overview);
      } catch (err) {
        console.error('Super admin load error', err);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: t.muted }}>Loading platform data...</div>;

  const activeClients    = tenants.filter(t => t.status === 'active').length;
  const trialClients     = tenants.filter(t => t.status === 'trial').length;
  const approvedUsers    = allUsers.filter(u => u.approved).length;
  const pendingUsers     = allUsers.filter(u => !u.approved).length;

  const subTabs = ['overview', 'tenants', 'users', 'health'];

  return (
    <div>
      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', borderBottom: `1px solid ${t.borderDim}` }}>
        {subTabs.map(st => (
          <button key={st} onClick={() => setSubTab(st)} style={{
            padding: '10px 18px', background: 'none', border: 'none',
            borderBottom: subTab === st ? `2px solid ${t.lime}` : '2px solid transparent',
            color: subTab === st ? t.lime : t.muted,
            cursor: 'pointer', fontSize: '13px', fontWeight: subTab === st ? '600' : '400',
            textTransform: 'capitalize', marginBottom: '-1px',
          }}>{st}</button>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────────── */}
      {subTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '32px' }}>
            <StatCard label="Total Clients"   value={tenants.length}                color={t.text} />
            <StatCard label="Active Clients"  value={activeClients}                 color={t.lime} />
            <StatCard label="Trial Clients"   value={trialClients}                  color={t.amber} />
            <StatCard label="Monthly Revenue" value={`R${(tenantStats?.mrr || 0).toLocaleString()}`} color={t.lime} sub="recurring" />
            <StatCard label="Total Leads"     value={leadOverview?.totalLeads || 0} color={t.cyan} />
            <StatCard label="Qual. Rate"      value={`${leadOverview?.qualificationRate || 0}%`} color={t.emerald} />
            <StatCard label="Platform Users"  value={approvedUsers}                 color={t.text} />
            <StatCard label="Pending Approval" value={pendingUsers}                 color={pendingUsers > 0 ? t.amber : t.muted} />
          </div>

          {/* Revenue breakdown by plan */}
          {tenantStats?.byPlan && (
            <div style={{ background: t.card, border: `1px solid ${t.borderDim}`, borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Revenue by Plan</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {Object.entries(tenantStats.byPlan).map(([plan, count]) => (
                  <div key={plan} style={{ flex: 1, minWidth: '120px', background: t.surface, borderRadius: '10px', padding: '14px 16px' }}>
                    <p style={{ color: t.muted, fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>{plan}</p>
                    <p style={{ color: t.lime, fontSize: '20px', fontWeight: '700' }}>{count} <span style={{ color: t.muted, fontSize: '13px' }}>clients</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tenants ──────────────────────────────────────────── */}
      {subTab === 'tenants' && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>All Clients ({tenants.length})</h3>
          {tenants.map(tenant => (
            <div key={tenant._id} style={{ background: t.card, border: `1px solid ${t.borderDim}`, borderRadius: '14px', padding: '16px 20px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '15px' }}>{tenant.businessName}</strong>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: tenant.status === 'active' ? `${t.lime}18` : `${t.amber}18`, color: tenant.status === 'active' ? t.lime : t.amber }}>{tenant.status}</span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${t.muted}18`, color: t.muted }}>{tenant.plan}</span>
                </div>
                <p style={{ color: t.muted, fontSize: '13px' }}>
                  {tenant.contactEmail}
                  {tenant.whatsappNumber ? ` · ${tenant.whatsappNumber}` : ' · No WhatsApp'}
                  {` · ${tenant.workflowType || 'full'} workflow`}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: t.lime, fontWeight: '700', fontSize: '16px' }}>R{tenant.monthlyFee}</p>
                <p style={{ color: t.muted, fontSize: '11px' }}>/month</p>
                <p style={{ color: t.muted, fontSize: '11px', marginTop: '2px' }}>{tenant.totalLeads || 0} leads</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Users ────────────────────────────────────────────── */}
      {subTab === 'users' && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>All Platform Users ({allUsers.length})</h3>
          {allUsers.map(user => (
            <div key={user._id} style={{ background: t.card, border: `1px solid ${t.borderDim}`, borderRadius: '12px', padding: '14px 18px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '14px' }}>{user.fullName}</strong>
                <p style={{ color: t.muted, fontSize: '12px', marginTop: '2px' }}>{user.email}</p>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: user.approved ? `${t.lime}18` : `${t.amber}18`, color: user.approved ? t.lime : t.amber }}>
                  {user.approved ? 'Approved' : 'Pending'}
                </span>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${t.cyan}18`, color: t.cyan }}>{user.role}</span>
                {user.tenantId && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${t.emerald}18`, color: t.emerald }}>Tenant</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Health ───────────────────────────────────────────── */}
      {subTab === 'health' && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>System Health</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {[
              { label: 'API Status',      value: health?.status === 'ok' ? '✅ Online' : '❌ Issue',     color: t.lime },
              { label: 'Database',        value: health?.database === 'connected' ? '✅ Connected' : '❌ Down', color: t.lime },
              { label: 'Environment',     value: health?.environment || 'production',                    color: t.cyan },
              { label: 'API Version',     value: health?.version || '1.2.0',                             color: t.muted },
            ].map((item, i) => (
              <div key={i} style={{ background: t.card, border: `1px solid ${t.borderDim}`, borderRadius: '14px', padding: '20px' }}>
                <p style={{ color: t.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{item.label}</p>
                <p style={{ color: item.color, fontSize: '16px', fontWeight: '700' }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div style={{ background: t.card, border: `1px solid ${t.borderDim}`, borderRadius: '14px', padding: '20px', marginTop: '16px' }}>
            <p style={{ color: t.muted, fontSize: '12px', marginBottom: '8px' }}>Backend URL</p>
            <p style={{ color: t.text, fontSize: '13px', fontFamily: 'monospace' }}>{import.meta.env.VITE_API_URL}</p>
          </div>
        </div>
      )}
    </div>
  );
}