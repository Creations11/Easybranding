// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import api from '../api';
import SuperAdminPanel from '../components/SuperAdminPanel';
import LeadDetailModal from '../components/LeadDetailModal';

const colors = {
  lime:      '#a3e635',
  emerald:   '#34d399',
  cyan:      '#22d3ee',
  amber:     '#fbbf24',
  red:       '#f87171',
  orange:    '#f97316',
  text:      '#f5f5f0',
  muted:     '#a1a1aa',
  card:      '#121210',
  surface:   '#0A0A08',
  border:    'rgba(163,230,53,0.22)',
  borderDim: 'rgba(255,255,255,0.08)',
};

const PLAN_COLORS   = { starter: colors.muted, growth: colors.lime, enterprise: colors.emerald };
const STATUS_COLORS = { active: colors.lime, trial: colors.amber, suspended: colors.red, cancelled: colors.muted };

// ── Assign Modal ──────────────────────────────────────────────
function AssignModal({ lead, agents, onClose, onAssigned }) {
  const [selectedAgent, setSelectedAgent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleAssign = async () => {
    if (!selectedAgent) { setError('Please select an agent'); return; }
    setSaving(true);
    try {
      const agent = agents.find(a => a._id === selectedAgent);
      await api.post(`/admin-ops/leads/${lead._id}/assign`, { agentId: selectedAgent, agentName: agent?.fullName });
      onAssigned();
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment failed');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ width: '100%', maxWidth: '440px', background: colors.surface, borderRadius: '24px', border: `1px solid ${colors.border}`, padding: '32px' }}>
        <h3 style={{ color: colors.lime, marginBottom: '8px' }}>Assign Lead</h3>
        <p style={{ color: colors.muted, fontSize: '14px', marginBottom: '24px' }}>{lead.name !== 'Unknown' ? lead.name : lead.phone} · {lead.phone}</p>
        {error && <p style={{ color: colors.red, fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
        <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#1C1C19', border: `1px solid ${colors.borderDim}`, color: colors.text, fontSize: '15px', marginBottom: '24px' }}>
          <option value="">Select an agent...</option>
          {agents.map(a => <option key={a._id} value={a._id}>{a.fullName} ({a.role})</option>)}
        </select>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '12px 24px', background: 'transparent', border: `1px solid ${colors.borderDim}`, color: colors.muted, borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleAssign} disabled={saving} style={{ padding: '12px 28px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Approve Modal ─────────────────────────────────────────────
function ApproveModal({ user, tenants, onClose, onApproved }) {
  const [role,     setRole]     = useState('agent');
  const [tenantId, setTenantId] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const handleApprove = async () => {
    setSaving(true);
    try {
      await api.post(`/users/${user._id}/approve`, {
        role,
        tenantId: tenantId || null,
      });
      onApproved();
    } catch (err) {
      setError(err.response?.data?.message || 'Approval failed');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ width: '100%', maxWidth: '460px', background: colors.surface, borderRadius: '24px', border: `1px solid ${colors.border}`, padding: '32px' }}>
        <h3 style={{ color: colors.lime, marginBottom: '8px' }}>Approve User</h3>
        <p style={{ color: colors.muted, fontSize: '14px', marginBottom: '24px' }}>
          {user.fullName} · {user.email}
        </p>
        {error && <p style={{ color: colors.red, fontSize: '14px', marginBottom: '12px' }}>{error}</p>}

        <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>Assign Role</p>
        <select value={role} onChange={e => setRole(e.target.value)}
          style={{ width: '100%', padding: '13px', borderRadius: '12px', background: '#1C1C19', border: `1px solid ${colors.borderDim}`, color: colors.text, fontSize: '14px', marginBottom: '16px' }}>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
          <option value="borrower">Borrower</option>
        </select>

        <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>Assign to Client (optional)</p>
        <select value={tenantId} onChange={e => setTenantId(e.target.value)}
          style={{ width: '100%', padding: '13px', borderRadius: '12px', background: '#1C1C19', border: `1px solid ${colors.borderDim}`, color: colors.text, fontSize: '14px', marginBottom: '24px' }}>
          <option value="">Platform level (no tenant)</option>
          {tenants.map(t => <option key={t._id} value={t._id}>{t.businessName}</option>)}
        </select>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '12px 24px', background: 'transparent', border: `1px solid ${colors.borderDim}`, color: colors.muted, borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleApprove} disabled={saving} style={{ padding: '12px 28px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Approving...' : 'Approve Access'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Client Modal ──────────────────────────────────────────────
function ClientModal({ client, onClose, onSave }) {
  const isEdit = !!client?._id;
  const iStyle = { width: '100%', padding: '13px 16px', borderRadius: '12px', background: '#1C1C19', border: `1px solid ${colors.borderDim}`, color: colors.text, fontSize: '14px', outline: 'none', marginBottom: '14px' };

  const [form, setForm] = useState({
    businessName:    client?.businessName    || '',
    brandName:       client?.brandName       || '',
    contactEmail:    client?.contactEmail    || '',
    contactPhone:    client?.contactPhone    || '',
    industry:        client?.industry        || '',
    whatsappNumber:  client?.whatsappNumber  || '',
    workflowType:    client?.workflowType    || 'full',
    plan:            client?.plan            || 'starter',
    monthlyFee:      client?.monthlyFee      || 950,
    status:          client?.status          || 'trial',
    notes:           client?.notes           || '',
    incomeMultiplier: client?.qualificationRules?.incomeMultiplier ?? 3,
    allowUnemployed:  client?.qualificationRules?.allowUnemployed  ?? false,
    minimumBudget:    client?.qualificationRules?.minimumBudget    ?? 0,
    maximumBudget:    client?.qualificationRules?.maximumBudget    ?? 999999,
    welcomeMsg:      client?.messages?.welcome      || '',
    qualifiedMsg:    client?.messages?.qualified    || '',
    notQualifiedMsg: client?.messages?.notQualified || '',
  });
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [tab,        setTab]        = useState('details');
  const [usage,      setUsage]      = useState(null);
  const [testMsg,    setTestMsg]    = useState('Hi');
  const [testStage,  setTestStage]  = useState('awaiting_menu');
  const [testResult, setTestResult] = useState(null);
  const [testing,    setTesting]    = useState(false);
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  useEffect(() => {
    if (isEdit && tab === 'usage') {
      api.get(`/tenants/${client._id}/usage`)
        .then(res => setUsage(res.data.data))
        .catch(() => {});
    }
  }, [tab, isEdit]);

  const handleTest = async () => {
    if (!isEdit) return;
    setTesting(true); setTestResult(null);
    try {
      const res = await api.post(`/tenants/${client._id}/test`, { message: testMsg, currentStage: testStage });
      setTestResult(res.data.data);
    } catch (err) {
      setTestResult({ error: err.response?.data?.message || 'Test failed' });
    } finally { setTesting(false); }
  };

  const handleSave = async () => {
    if (!form.businessName || !form.contactEmail) { setError('Business name and email required'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        businessName: form.businessName, brandName: form.brandName || form.businessName,
        contactEmail: form.contactEmail, contactPhone: form.contactPhone,
        industry: form.industry, whatsappNumber: form.whatsappNumber || null,
        workflowType: form.workflowType,
        plan: form.plan, monthlyFee: Number(form.monthlyFee), status: form.status, notes: form.notes,
        qualificationRules: { incomeMultiplier: Number(form.incomeMultiplier), allowUnemployed: form.allowUnemployed, minimumBudget: Number(form.minimumBudget), maximumBudget: Number(form.maximumBudget) },
        messages: { welcome: form.welcomeMsg || null, qualified: form.qualifiedMsg || null, notQualified: form.notQualifiedMsg || null },
      };
      const method = isEdit ? 'put' : 'post';
      const path   = isEdit ? `/tenants/${client._id}` : '/tenants';
      const res    = await api[method](path, payload);
      if (!res.data.success) { setError(res.data.message); return; }
      onSave(res.data.data.tenant);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setSaving(false); }
  };

  const modalTabs = [...['details', 'whatsapp', 'workflow', 'billing'], ...(isEdit ? ['usage', 'test'] : [])];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '600px', background: colors.surface, borderRadius: '24px', border: `1px solid ${colors.border}`, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${colors.borderDim}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: colors.lime }}>{isEdit ? `Edit — ${client.businessName}` : 'Add New Client'}</h3>
          <button onClick={onClose} style={{ fontSize: '28px', background: 'none', border: 'none', color: colors.muted, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'flex', borderBottom: `1px solid ${colors.borderDim}`, padding: '0 28px', overflowX: 'auto' }}>
          {modalTabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 14px', background: 'none', border: 'none', borderBottom: tab === t ? `2px solid ${colors.lime}` : '2px solid transparent', color: tab === t ? colors.lime : colors.muted, cursor: 'pointer', fontSize: '13px', fontWeight: tab === t ? '600' : '400', textTransform: 'capitalize', marginBottom: '-1px', whiteSpace: 'nowrap' }}>{t}</button>
          ))}
        </div>
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {error && <p style={{ color: colors.red, marginBottom: '14px', fontSize: '14px' }}>{error}</p>}

          {tab === 'details' && (
            <div>
              <input value={form.businessName}  onChange={e => set('businessName',  e.target.value)} placeholder="Business Name *" style={iStyle} />
              <input value={form.brandName}     onChange={e => set('brandName',     e.target.value)} placeholder="Brand Name (shown in WhatsApp)" style={iStyle} />
              <input value={form.contactEmail}  onChange={e => set('contactEmail',  e.target.value)} placeholder="Contact Email *" type="email" style={iStyle} />
              <input value={form.contactPhone}  onChange={e => set('contactPhone',  e.target.value)} placeholder="Contact Phone" style={iStyle} />
              <input value={form.industry}      onChange={e => set('industry',      e.target.value)} placeholder="Industry" style={iStyle} />
              <textarea value={form.notes}      onChange={e => set('notes',         e.target.value)} placeholder="Internal notes..." rows={3} style={{ ...iStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
          )}

          {tab === 'whatsapp' && (
            <div>
              <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>Workflow Type</p>
              <select value={form.workflowType} onChange={e => set('workflowType', e.target.value)} style={iStyle}>
                <option value="full">Full — 6 questions including income and employment</option>
                <option value="basic">Basic — 4 questions, no income check</option>
              </select>
              <p style={{ color: colors.muted, fontSize: '13px', marginBottom: '12px' }}>WhatsApp Number Format: <span style={{ color: colors.lime }}>whatsapp:+27211234567</span></p>
              <input value={form.whatsappNumber} onChange={e => set('whatsappNumber', e.target.value)} placeholder="whatsapp:+27211234567" style={iStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>Income Multiplier</p>
                  <input value={form.incomeMultiplier} onChange={e => set('incomeMultiplier', e.target.value)} type="number" min="1" max="10" style={{ ...iStyle, marginBottom: 0 }} />
                </div>
                <div>
                  <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>Allow Unemployed</p>
                  <select value={form.allowUnemployed} onChange={e => set('allowUnemployed', e.target.value === 'true')} style={{ ...iStyle, marginBottom: 0 }}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>Min Budget (R)</p>
                  <input value={form.minimumBudget} onChange={e => set('minimumBudget', e.target.value)} type="number" style={{ ...iStyle, marginBottom: 0 }} />
                </div>
                <div>
                  <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>Max Budget (R)</p>
                  <input value={form.maximumBudget} onChange={e => set('maximumBudget', e.target.value)} type="number" style={{ ...iStyle, marginBottom: 0 }} />
                </div>
              </div>
            </div>
          )}

          {tab === 'workflow' && (
            <div>
              <p style={{ color: colors.muted, fontSize: '13px', marginBottom: '16px' }}>Leave blank to use system defaults.</p>
              <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>Welcome Message</p>
              <textarea value={form.welcomeMsg}      onChange={e => set('welcomeMsg',      e.target.value)} placeholder="Welcome to your agency..." rows={4} style={{ ...iStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>Qualified Message</p>
              <textarea value={form.qualifiedMsg}    onChange={e => set('qualifiedMsg',    e.target.value)} placeholder="Great news! You qualify..." rows={4} style={{ ...iStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>Not Qualified Message</p>
              <textarea value={form.notQualifiedMsg} onChange={e => set('notQualifiedMsg', e.target.value)} placeholder="Unfortunately you do not qualify..." rows={4} style={{ ...iStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
          )}

          {tab === 'billing' && (
            <div>
              <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>Plan</p>
              <select value={form.plan} onChange={e => set('plan', e.target.value)} style={iStyle}>
                <option value="starter">Starter - R950/mo</option>
                <option value="growth">Growth - R2,450/mo</option>
                <option value="enterprise">Enterprise - Custom</option>
              </select>
              <input value={form.monthlyFee} onChange={e => set('monthlyFee', e.target.value)} type="number" placeholder="Monthly Fee (R)" style={iStyle} />
              <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>Status</p>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={iStyle}>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {tab === 'usage' && (
            usage ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  {[
                    { l: 'Total Leads',   v: usage.stats?.total || 0,              c: colors.text },
                    { l: 'Qualified',     v: usage.stats?.qualified || 0,          c: colors.lime },
                    { l: 'Not Qualified', v: usage.stats?.notQualified || 0,       c: colors.red },
                    { l: 'Qual. Rate',    v: `${usage.stats?.qualificationRate || 0}%`, c: colors.emerald },
                    { l: 'Active Now',    v: usage.stats?.active || 0,             c: colors.cyan },
                    { l: 'Closed',        v: usage.stats?.closed || 0,             c: colors.muted },
                  ].map(s => (
                    <div key={s.l} style={{ background: '#1C1C19', borderRadius: '10px', padding: '14px' }}>
                      <p style={{ color: colors.muted, fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>{s.l}</p>
                      <p style={{ color: s.c, fontSize: '22px', fontWeight: '700' }}>{s.v}</p>
                    </div>
                  ))}
                </div>
                {usage.recentLeads?.length > 0 && (
                  <div>
                    <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent Leads</p>
                    {usage.recentLeads.map(lead => (
                      <div key={lead._id} style={{ background: '#1C1C19', borderRadius: '10px', padding: '12px 14px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '600' }}>{lead.name || lead.phone}</p>
                          <p style={{ color: colors.muted, fontSize: '12px' }}>{lead.phone}</p>
                        </div>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '999px', background: lead.workflowStatus === 'qualified' ? `${colors.lime}18` : `${colors.muted}18`, color: lead.workflowStatus === 'qualified' ? colors.lime : colors.muted }}>{lead.workflowStatus?.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : <p style={{ color: colors.muted, textAlign: 'center', padding: '40px 0' }}>Loading usage data...</p>
          )}

          {tab === 'test' && isEdit && (
            <div>
              <p style={{ color: colors.muted, fontSize: '13px', marginBottom: '16px' }}>Test your workflow messages. Simulates a renter sending a message.</p>
              <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>Current Stage</p>
              <select value={testStage} onChange={e => setTestStage(e.target.value)} style={{ ...iStyle, marginBottom: '12px' }}>
                {['awaiting_menu','capture_name','capture_property_interest','capture_budget','capture_move_in_date','capture_employment_type','capture_monthly_income'].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <p style={{ color: colors.muted, fontSize: '12px', marginBottom: '6px' }}>Test Message</p>
              <input value={testMsg} onChange={e => setTestMsg(e.target.value)} placeholder="e.g. Hi" style={{ ...iStyle, marginBottom: '12px' }} />
              <button onClick={handleTest} disabled={testing} style={{ width: '100%', padding: '12px', background: testing ? `${colors.lime}44` : colors.lime, color: '#050505', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: testing ? 'not-allowed' : 'pointer', marginBottom: '16px' }}>
                {testing ? 'Testing...' : 'Run Test'}
              </button>
              {testResult && (
                <div style={{ background: '#1C1C19', borderRadius: '12px', padding: '16px' }}>
                  {testResult.error ? (
                    <p style={{ color: colors.red, fontSize: '13px' }}>{testResult.error}</p>
                  ) : (
                    <div>
                      <p style={{ color: colors.muted, fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase' }}>Bot Response</p>
                      <p style={{ color: colors.text, fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.6', marginBottom: '12px' }}>{testResult.reply}</p>
                      <p style={{ color: colors.muted, fontSize: '12px' }}>Next stage: <span style={{ color: colors.lime }}>{testResult.nextStage}</span></p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ padding: '20px 28px', borderTop: `1px solid ${colors.borderDim}`, display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{ padding: '13px 24px', background: 'transparent', border: `1px solid ${colors.borderDim}`, color: colors.muted, borderRadius: '12px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '13px 28px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Client'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────
export default function AdminDashboard() {
  const [overview,            setOverview]            = useState(null);
  const [activeConversations, setActiveConversations] = useState([]);
  const [qualifiedLeads,      setQualifiedLeads]      = useState([]);
  const [rejectedLeads,       setRejectedLeads]       = useState([]);
  const [alerts,              setAlerts]              = useState([]);
  const [agents,              setAgents]              = useState([]);
  const [clients,             setClients]             = useState([]);
  const [clientStats,         setClientStats]         = useState(null);
  const [pendingUsers,        setPendingUsers]        = useState([]);
  const [allUsers,            setAllUsers]            = useState([]);
  const [tenants,             setTenants]             = useState([]);
  const [stages,              setStages]              = useState([]);
  const [recentMessages,      setRecentMessages]      = useState([]);
  const [viewingRequests,     setViewingRequests]     = useState([]);
  const [assignModal,         setAssignModal]         = useState(null);
  const [clientModal,         setClientModal]         = useState(null);
  const [approveModal,        setApproveModal]        = useState(null);
  const [leadDetailId,        setLeadDetailId]        = useState(null);
  const [inviteModal,         setInviteModal]         = useState(null);
  const [inviteUrl,           setInviteUrl]           = useState('');
  const [loading,             setLoading]             = useState(true);
  const [error,               setError]               = useState('');
  const [tab, setTab] = useState('overview');

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('eb_user') || '{}'); }
    catch { return {}; }
  })();
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isAdmin      = currentUser.role === 'admin';
  const userTenantId = currentUser.tenantId || null;

  const [clientSearch,        setClientSearch]        = useState('');
  const [clientFilter,        setClientFilter]        = useState('all');

  const loadData = async () => {
    try {
      const [ovRes, activeRes, qualRes, rejRes, alertRes, agentRes, clientRes, statsRes, pendingRes, usersRes, stagesRes, messagesRes, viewingsRes] = await Promise.all([
        api.get('/admin-ops/overview'),
        api.get('/admin-ops/conversations/active'),
        api.get('/admin-ops/leads/qualified'),
        api.get('/admin-ops/leads/rejected'),
        api.get('/admin-ops/alerts'),
        api.get('/admin-ops/agents'),
        api.get('/tenants'),
        api.get('/tenants/stats'),
        api.get('/users/pending'),
        api.get('/users'),
        api.get('/admin-ops/stages'),
        api.get('/admin-ops/messages/recent'),
        api.get('/admin-ops/viewings'),
      ]);
      setOverview(ovRes.data.data?.overview);
      setActiveConversations(activeRes.data.data?.leads || []);
      setQualifiedLeads(qualRes.data.data?.leads || []);
      setRejectedLeads(rejRes.data.data?.leads || []);
      setAlerts(alertRes.data.data?.alerts || []);
      setAgents(agentRes.data.data?.agents || []);
      setClients(clientRes.data.data?.tenants || []);
      setClientStats(statsRes.data.data?.stats);
      setPendingUsers(pendingRes.data.data?.users || []);
      setAllUsers(usersRes.data.data?.users || []);
      setTenants(clientRes.data.data?.tenants || []);
      setStages(stagesRes.data.data?.stages || []);
      setRecentMessages(messagesRes.data.data?.messages || []);
      setViewingRequests(viewingsRes.data.data?.viewings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleClientSave = (tenant) => {
    setClients(prev => {
      const exists = prev.find(c => c._id === tenant._id);
      return exists ? prev.map(c => c._id === tenant._id ? tenant : c) : [tenant, ...prev];
    });
    setClientModal(null);
  };

  const handleDeleteClient = async (client) => {
    if (!window.confirm(`Delete ${client.businessName}?`)) return;
    await api.delete(`/tenants/${client._id}`);
    setClients(prev => prev.filter(c => c._id !== client._id));
  };

  const handleRejectUser = async (user) => {
    if (!window.confirm(`Reject ${user.fullName}? Their account will be deactivated.`)) return;
    await api.post(`/users/${user._id}/reject`, { reason: 'Application rejected by admin' });
    setPendingUsers(prev => prev.filter(u => u._id !== user._id));
  };

  const filteredClients = clients.filter(c => {
    const ms = !clientSearch || c.businessName?.toLowerCase().includes(clientSearch.toLowerCase()) || c.contactEmail?.toLowerCase().includes(clientSearch.toLowerCase());
    const mf = clientFilter === 'all' || c.status === clientFilter;
    return ms && mf;
  });

  if (loading) return <div style={{ padding: '140px', textAlign: 'center', color: colors.muted }}>Loading Admin Operations Center...</div>;
  if (error)   return <div style={{ padding: '140px', color: colors.red }}>{error}</div>;

  const tabs = [
    'overview', 'active', 'qualified', 'rejected',
    'funnel', 'viewings', 'messages', 'alerts',
    ...(isSuperAdmin ? ['clients', 'users', 'platform'] : []),
    ...(isAdmin ? ['users'] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: colors.text, padding: '100px 40px 80px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '8px' }}>
            {isSuperAdmin ? 'Admin Control Center' : 'Operations Dashboard'}
          </h1>
          <p style={{ color: colors.muted, fontSize: '20px' }}>
            {isSuperAdmin ? 'Real-time Platform Operations & Oversight' : 'Your agency\'s live WhatsApp pipeline'}
          </p>
        </div>

        {/* Stats */}
        {overview && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '32px' }}>
            {[
              { label: 'Total Leads',   value: overview.totalLeads,          color: colors.text,    show: true },
              { label: 'Active',        value: overview.activeConversations, color: colors.cyan,    show: true },
              { label: 'Qualified',     value: overview.qualifiedLeads,      color: colors.lime,    show: true },
              { label: 'Rejected',      value: overview.rejectedLeads,       color: colors.red,     show: true },
              { label: 'Today',         value: overview.todayLeads,          color: colors.amber,   show: true },
              { label: 'Qual. Rate',    value: `${overview.qualificationRate}%`, color: colors.emerald, show: true },
              { label: 'Clients',       value: clients.length,               color: colors.cyan,    show: isSuperAdmin },
              { label: 'Monthly Rev',   value: `R${(clientStats?.mrr || 0).toLocaleString()}`, color: colors.lime, show: isSuperAdmin },
              { label: 'Pending Users', value: pendingUsers.length,          color: pendingUsers.length > 0 ? colors.amber : colors.muted, show: true },
            ].filter(s => s.show).map(s => (
              <div key={s.label} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '16px 18px' }}>
                <p style={{ color: colors.muted, fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
                <p style={{ fontSize: '28px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', marginBottom: '28px', borderBottom: `1px solid ${colors.borderDim}`, overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '12px 16px', background: 'none', border: 'none',
              borderBottom: tab === t ? `2px solid ${colors.lime}` : '2px solid transparent',
              color: tab === t ? colors.lime : colors.muted,
              cursor: 'pointer', fontSize: '13px', fontWeight: tab === t ? '600' : '400',
              textTransform: 'capitalize', marginBottom: '-1px', whiteSpace: 'nowrap',
            }}>
              {t === 'active' ? 'Active' : t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'alerts' && alerts.length > 0 && <span style={{ marginLeft: '5px', background: colors.red, color: '#fff', fontSize: '10px', padding: '1px 5px', borderRadius: '999px' }}>{alerts.length}</span>}
              {t === 'users'  && pendingUsers.length > 0 && <span style={{ marginLeft: '5px', background: colors.amber, color: '#050505', fontSize: '10px', padding: '1px 5px', borderRadius: '999px' }}>{pendingUsers.length}</span>}
            </button>
          ))}
        </div>

        {/* ── Overview ───────────────────────────────────────── */}
        {tab === 'overview' && (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Recent Activity</h2>
            {activeConversations.slice(0, 5).map(lead => (
              <div key={lead._id} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '14px', padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><strong>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong><p style={{ color: colors.muted, fontSize: '13px' }}>{lead.phone}</p></div>
                <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', background: `${colors.cyan}22`, color: colors.cyan }}>{lead.workflowStatus?.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Active ─────────────────────────────────────────── */}
        {tab === 'active' && (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Active Conversations ({activeConversations.length})</h2>
            {activeConversations.length === 0 ? <p style={{ color: colors.muted, textAlign: 'center', padding: '60px 0' }}>No active conversations.</p>
            : activeConversations.map(lead => (
              <div key={lead._id} onClick={() => setLeadDetailId(lead._id)} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '14px', padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div><strong>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong><p style={{ color: colors.muted, fontSize: '13px' }}>{lead.phone}</p><p style={{ color: colors.muted, fontSize: '12px' }}>Stage {lead.stageNumber}/{lead.totalStages} · {lead.minutesSinceLastMessage}m ago</p></div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', background: `${colors.cyan}22`, color: colors.cyan }}>{lead.workflowStatus?.replace(/_/g, ' ')}</span>
                  <button onClick={() => setAssignModal(lead)} style={{ padding: '7px 14px', background: `${colors.amber}22`, color: colors.amber, border: `1px solid ${colors.amber}44`, borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Assign</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Qualified ──────────────────────────────────────── */}
        {tab === 'qualified' && (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Qualified Leads ({qualifiedLeads.length})</h2>
            {qualifiedLeads.length === 0 ? <p style={{ color: colors.muted, textAlign: 'center', padding: '60px 0' }}>No qualified leads yet.</p>
            : qualifiedLeads.map(lead => (
              <div key={lead._id} onClick={() => setLeadDetailId(lead._id)} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '14px', padding: '18px 24px', marginBottom: '10px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '16px' }}>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                    <p style={{ color: colors.muted, fontSize: '13px', marginTop: '2px' }}>{lead.phone}</p>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {lead.propertyInterest && <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: `${colors.cyan}22`, color: colors.cyan }}>{lead.propertyInterest}</span>}
                      {lead.monthlyBudget    && <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: `${colors.lime}22`, color: colors.lime }}>R{lead.monthlyBudget}/mo</span>}
                      {lead.moveInDate       && <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: `${colors.amber}22`, color: colors.amber }}>{lead.moveInDate}</span>}
                      {lead.monthlyIncome    && <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: `${colors.emerald}22`, color: colors.emerald }}>R{lead.monthlyIncome} income</span>}
                    </div>
                    {lead.assignedAgent && <p style={{ color: colors.emerald, fontSize: '12px', marginTop: '6px' }}>✅ Assigned to {lead.assignedAgent}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!lead.assignedAgent && <button onClick={() => setAssignModal(lead)} style={{ padding: '8px 16px', background: `${colors.lime}22`, color: colors.lime, border: `1px solid ${colors.border}`, borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Assign Agent</button>}
                    {lead.viewingRequested ? <span style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '10px', background: `${colors.emerald}22`, color: colors.emerald }}>📅 Viewing Set</span> : <span style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '10px', background: `${colors.amber}22`, color: colors.amber }}>No Viewing</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Rejected ───────────────────────────────────────── */}
        {tab === 'rejected' && (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Rejected Leads ({rejectedLeads.length})</h2>
            {rejectedLeads.length === 0 ? <p style={{ color: colors.muted, textAlign: 'center', padding: '60px 0' }}>No rejected leads.</p>
            : rejectedLeads.map(lead => (
              <div key={lead._id} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '14px', padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><strong>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong><p style={{ color: colors.muted, fontSize: '13px' }}>{lead.phone}</p></div>
                <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', background: `${colors.red}22`, color: colors.red }}>{lead.rejectionReason}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Stage Funnel ───────────────────────────────────── */}
        {tab === 'funnel' && (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Pipeline Funnel</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stages.map((stage, i) => (
                <div key={i} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '12px', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{stage.label}</span>
                    <span style={{ fontSize: '13px', color: colors.muted }}>{stage.count} leads · {stage.percentage}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${stage.percentage}%`, background: stage.stage === 'qualified' ? '#a3e635' : stage.stage === 'not_qualified' ? '#f87171' : '#22d3ee', borderRadius: '999px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Viewings ───────────────────────────────────────── */}
        {tab === 'viewings' && (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Viewing Requests ({viewingRequests.length})</h2>
            {viewingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: colors.muted }}>
                <p style={{ fontSize: '40px', marginBottom: '16px' }}>📅</p>
                <p>No viewing requests yet.</p>
              </div>
            ) : viewingRequests.map(v => (
              <div key={v._id} onClick={() => setLeadDetailId(v._id)} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '14px', padding: '18px 24px', marginBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '15px' }}>{v.name !== 'Unknown' ? v.name : v.phone}</strong>
                  <p style={{ color: colors.muted, fontSize: '13px', marginTop: '2px' }}>{v.phone}</p>
                  {v.propertyAddress && <p style={{ color: colors.muted, fontSize: '12px' }}>📍 {v.propertyAddress}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {v.viewingScheduledAt ? (
                    <>
                      <p style={{ color: '#a3e635', fontWeight: '700' }}>{new Date(v.viewingScheduledAt).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                      <p style={{ color: colors.muted, fontSize: '12px' }}>{new Date(v.viewingScheduledAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</p>
                    </>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#fbbf24' }}>Pending schedule</span>
                  )}
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(52,211,153,0.15)', color: '#34d399', display: 'block', marginTop: '4px' }}>
                    {v.viewingStatus || 'requested'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Recent Messages ────────────────────────────────── */}
        {tab === 'messages' && (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Recent Messages ({recentMessages.length})</h2>
            {recentMessages.length === 0 ? (
              <p style={{ color: colors.muted, textAlign: 'center', padding: '60px 0' }}>No messages yet.</p>
            ) : recentMessages.map((msg, i) => (
              <div key={i} onClick={() => setLeadDetailId(msg.leadId)} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '12px', padding: '14px 18px', marginBottom: '8px', cursor: 'pointer', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: msg.direction === 'inbound' ? 'rgba(34,211,238,0.15)' : 'rgba(163,230,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                  {msg.direction === 'inbound' ? '📱' : '🤖'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '13px' }}>{msg.name !== 'Unknown' ? msg.name : msg.phone}</strong>
                    <span style={{ fontSize: '11px', color: colors.muted }}>{new Date(msg.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p style={{ color: colors.muted, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.body}</p>
                </div>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: msg.direction === 'inbound' ? 'rgba(34,211,238,0.15)' : 'rgba(163,230,53,0.15)', color: msg.direction === 'inbound' ? '#22d3ee' : '#a3e635', flexShrink: 0 }}>
                  {msg.direction}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ─────────────────────────────────────────── */}
        {tab === 'alerts' && (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Alerts ({alerts.length})</h2>
            {alerts.length === 0
              ? <div style={{ textAlign: 'center', padding: '60px 0', color: colors.muted }}><p style={{ fontSize: '40px', marginBottom: '16px' }}>✅</p><p>No alerts.</p></div>
              : alerts.map((alert, i) => (
                <div key={i} style={{ background: colors.card, border: `1px solid ${alert.severity === 'high' ? colors.red : colors.amber}44`, borderRadius: '14px', padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><strong>{alert.lead.name !== 'Unknown' ? alert.lead.name : alert.lead.phone}</strong><p style={{ color: colors.muted, fontSize: '13px', marginTop: '4px' }}>{alert.message}</p></div>
                  <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', background: alert.severity === 'high' ? `${colors.red}22` : `${colors.amber}22`, color: alert.severity === 'high' ? colors.red : colors.amber, fontWeight: '600', textTransform: 'uppercase' }}>{alert.severity}</span>
                </div>
              ))}
          </div>
        )}

        {/* ── Clients ────────────────────────────────────────── */}
        {tab === 'clients' && isSuperAdmin && (
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
                      <div style={{ textAlign: 'center', padding: '6px 14px', background: 'rgba(163,230,53,0.08)', borderRadius: '8px' }}>
                        <p style={{ color: colors.lime, fontWeight: '700', fontSize: '16px' }}>{client.totalLeads || 0}</p>
                        <p style={{ color: colors.muted, fontSize: '10px' }}>Leads</p>
                      </div>
                      <div style={{ textAlign: 'center', padding: '6px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                        <p style={{ color: colors.text, fontWeight: '700', fontSize: '16px' }}>R{client.monthlyFee}</p>
                        <p style={{ color: colors.muted, fontSize: '10px' }}>/mo</p>
                      </div>
                      {/* Quick suspend/activate toggle */}
                      <button onClick={async () => {
                        const newStatus = client.status === 'suspended' ? 'active' : 'suspended';
                        try {
                          await api.put(`/tenants/${client._id}`, { status: newStatus });
                          loadData();
                        } catch (err) { alert('Failed to update status'); }
                      }} style={{ padding: '8px 14px', background: client.status === 'suspended' ? `${colors.lime}22` : `${colors.amber}22`, color: client.status === 'suspended' ? colors.lime : colors.amber, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                        {client.status === 'suspended' ? '▶ Activate' : '⏸ Suspend'}
                      </button>
                      <button onClick={() => setClientModal(client)} style={{ padding: '8px 14px', background: `${colors.lime}22`, color: colors.lime, border: `1px solid ${colors.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                      <button onClick={async () => {
                        try {
                          const res = await api.post(`/invites/${client._id}/generate`);
                          setInviteUrl(res.data.data?.inviteUrl || '');
                          setInviteModal(client);
                          loadData();
                        } catch (err) { alert('Failed to generate invite link'); }
                      }} style={{ padding: '8px 14px', background: `${colors.cyan}22`, color: colors.cyan, border: `1px solid ${colors.cyan}33`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>🔗 Invite</button>
                      <button onClick={() => handleDeleteClient(client)} style={{ padding: '8px 14px', background: `${colors.red}22`, color: colors.red, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ── Users ──────────────────────────────────────────── */}
        {tab === 'users' && (
          <div>
            {/* Pending approvals — filter by tenant for admin */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>
                Pending Approvals
                {pendingUsers.length > 0 && <span style={{ marginLeft: '10px', background: colors.amber, color: '#050505', fontSize: '12px', padding: '3px 10px', borderRadius: '999px', fontWeight: '700' }}>{pendingUsers.length} waiting</span>}
              </h2>
              {pendingUsers.length === 0
                ? <div style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '14px', padding: '40px', textAlign: 'center', color: colors.muted }}><p style={{ fontSize: '32px', marginBottom: '12px' }}>✅</p><p>No pending approvals.</p></div>
                : pendingUsers.map(user => (
                  <div key={user._id} style={{ background: colors.card, border: `1px solid ${colors.amber}44`, borderRadius: '14px', padding: '18px 24px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '16px' }}>{user.fullName}</strong>
                      <p style={{ color: colors.muted, fontSize: '13px', marginTop: '2px' }}>{user.email} · {user.phone}</p>
                      <p style={{ color: colors.muted, fontSize: '12px', marginTop: '2px' }}>Registered {new Date(user.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setApproveModal(user)} style={{ padding: '10px 20px', background: `${colors.lime}22`, color: colors.lime, border: `1px solid ${colors.border}`, borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>✅ Approve</button>
                      <button onClick={() => handleRejectUser(user)} style={{ padding: '10px 16px', background: `${colors.red}22`, color: colors.red, border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>Reject</button>
                    </div>
                  </div>
                ))}
            </div>

            {/* All users — admin sees only their tenant's users */}
            {(() => {
              const visibleUsers = isSuperAdmin
                ? allUsers
                : allUsers.filter(u => u.tenantId === userTenantId);
              return (
                <div>
                  <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>
                    {isSuperAdmin ? `All Users (${allUsers.length})` : `Your Team (${visibleUsers.length})`}
                  </h2>
                  {visibleUsers.map(user => (
                    <div key={user._id} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '14px', padding: '16px 24px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{user.fullName}</strong>
                        <p style={{ color: colors.muted, fontSize: '13px', marginTop: '2px' }}>{user.email}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: user.approved ? `${colors.lime}22` : `${colors.amber}22`, color: user.approved ? colors.lime : colors.amber }}>
                          {user.approved ? '✅ Approved' : '⏳ Pending'}
                        </span>
                        {/* Protect super_admin accounts — show badge, no dropdown */}
                        {user.role === 'super_admin' || user._id === currentUser.id ? (
                          <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: `${colors.cyan}22`, color: colors.cyan, fontWeight: '600' }}>
                            {user.role} {user._id === currentUser.id ? '(you)' : '🔒'}
                          </span>
                        ) : (
                          <select
                            defaultValue={user.role}
                            onChange={async (e) => {
                              try {
                                await api.patch(`/users/${user._id}/role`, { role: e.target.value });
                                loadData();
                              } catch (err) {
                                alert(err.response?.data?.message || 'Failed to update role');
                                e.target.value = user.role;
                              }
                            }}
                            style={{ padding: '4px 10px', background: `${colors.cyan}18`, border: `1px solid ${colors.cyan}33`, color: colors.cyan, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', outline: 'none' }}
                          >
                            <option value="borrower">borrower</option>
                            <option value="agent">agent</option>
                            <option value="admin">admin</option>
                            {isSuperAdmin && <option value="super_admin">super_admin</option>}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                  {visibleUsers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: colors.muted }}>
                      <p style={{ fontSize: '32px', marginBottom: '12px' }}>👥</p>
                      <p>No team members yet.</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Platform — super_admin only ─────────────────────── */}
        {tab === 'platform' && isSuperAdmin && <SuperAdminPanel />}

      </div>

      {assignModal  && <AssignModal  lead={assignModal}   agents={agents}   onClose={() => setAssignModal(null)}  onAssigned={() => { setAssignModal(null);  loadData(); }} />}
      {clientModal  && <ClientModal  client={clientModal._id ? clientModal : null} onClose={() => setClientModal(null)}  onSave={handleClientSave} />}
      {approveModal && <ApproveModal user={approveModal}  tenants={tenants} onClose={() => setApproveModal(null)} onApproved={() => { setApproveModal(null); loadData(); }} />}
      {leadDetailId && <LeadDetailModal leadId={leadDetailId} onClose={() => setLeadDetailId(null)} onUpdate={loadData} />}

      {/* Invite Link Modal */}
      {inviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '520px', background: colors.surface, borderRadius: '24px', border: `1px solid ${colors.border}`, padding: '32px' }}>
            <h3 style={{ color: colors.lime, marginBottom: '8px' }}>🔗 Invite Link</h3>
            <p style={{ color: colors.muted, fontSize: '14px', marginBottom: '24px' }}>
              Share this link with <strong style={{ color: colors.text }}>{inviteModal.businessName}</strong> staff. Anyone who registers via this link will be automatically linked to their agency.
            </p>
            <div style={{ background: '#1C1C19', border: `1px solid ${colors.borderDim}`, borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', wordBreak: 'break-all' }}>
              <p style={{ color: colors.lime, fontSize: '13px', fontFamily: 'monospace' }}>{inviteUrl}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button onClick={() => { navigator.clipboard.writeText(inviteUrl); }} style={{ flex: 1, padding: '12px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>
                Copy Link
              </button>
              <button onClick={() => setInviteModal(null)} style={{ padding: '12px 20px', background: 'transparent', border: `1px solid ${colors.borderDim}`, color: colors.muted, borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}>
                Close
              </button>
            </div>
            <p style={{ color: colors.muted, fontSize: '12px' }}>⚠️ This link expires in 30 days. Generate a new one if needed.</p>
          </div>
        </div>
      )}
    </div>
  );
}