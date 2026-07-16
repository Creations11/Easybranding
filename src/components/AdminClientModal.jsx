// src/components/AdminClientModal.jsx
// Extracted from AdminDashboard.jsx. Deliberately NOT named ClientModal.jsx
// (or merged with it) — that file already exists and is a genuinely
// different, simpler component used by SuperAdminDashboard.jsx (a
// single-form tenant editor with a QuestionEditor sub-panel, props
// { tenant, onClose, onSaved }). This one is a richer, tabbed editor
// (details/whatsapp/workflow/billing/agents/usage/test tabs, including
// the AgentManager integration), props { client, onClose, onSave } —
// different prop names, not just different markup. Overwriting the
// shared file would have broken SuperAdminDashboard.jsx.
//
// FIX APPLIED (26 June 2026, carried over from AdminDashboard.jsx):
// AgentManager.jsx existed as a real, working component but was
// never imported or rendered anywhere — same "built but not wired
// in" pattern as several other features this week. Added it as a
// new "Agents" tab, alongside the existing
// details/whatsapp/workflow/billing/usage/test tabs. Only shown in
// edit mode (isEdit), matching how usage/test already work, since
// it needs a real client._id to call the agent-invite endpoints.
import { useState, useEffect } from 'react';
import api from '../api';
import AgentManager from './AgentManager';
import { colors } from '../utils/theme';

export default function AdminClientModal({ client, onClose, onSave }) {
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

  // FIX (26 June 2026): added 'agents' tab, only in edit mode —
  // matches usage/test, which also require a real client._id.
  const modalTabs = [...['details', 'whatsapp', 'workflow', 'billing'], ...(isEdit ? ['agents', 'usage', 'test'] : [])];

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

          {/* FIX (26 June 2026): new Agents tab — renders the
              previously-unconnected AgentManager component, scoped
              to this specific tenant via client._id. */}
          {tab === 'agents' && isEdit && (
            <AgentManager tenantId={client._id} />
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
                      <p style={{ color: colors.text, fontSize: '14px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: '1.6', marginBottom: '12px' }}>{testResult.reply}</p>
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
