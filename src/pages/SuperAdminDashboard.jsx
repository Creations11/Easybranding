// src/pages/SuperAdminDashboard.jsx
// ─────────────────────────────────────────────────────────────
// Easy Branding AI — Super Admin & EB Manager Dashboard
// Sidebar navigation — 6 sections
// Roles: super_admin, eb_manager
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import api from '../api';
import LeadDetailModal from '../components/LeadDetailModal';

// ── Design tokens ─────────────────────────────────────────────
const c = {
  bg:        '#06080A',
  sidebar:   '#080B08',
  surface:   '#0D110C',
  card:      '#121710',
  lime:      '#B8F040',
  earth:     '#C4873A',
  moss:      '#4A6741',
  sage:      '#7A9E6E',
  cyan:      '#22d3ee',
  emerald:   '#34d399',
  amber:     '#fbbf24',
  red:       '#f87171',
  orange:    '#f97316',
  text:      '#EEF0E8',
  muted:     '#8A9080',
  border:    'rgba(184,240,64,0.12)',
  borderDim: 'rgba(255,255,255,0.06)',
};

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, color, sub, icon }) {
  return (
    <div style={{ background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '14px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
        {icon && <span style={{ fontSize: '16px', opacity: 0.6 }}>{icon}</span>}
      </div>
      <p style={{ fontSize: '32px', fontWeight: '800', color: color || c.text, lineHeight: 1, marginBottom: sub ? '4px' : 0, fontFamily: "'Fraunces', serif" }}>{value ?? '—'}</p>
      {sub && <p style={{ color: c.muted, fontSize: '12px' }}>{sub}</p>}
    </div>
  );
}

// ── Sidebar nav item ──────────────────────────────────────────
function NavItem({ icon, label, active, badge, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
      padding: '11px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
      background: active ? 'rgba(184,240,64,0.12)' : 'transparent',
      color: active ? c.lime : c.muted,
      fontSize: '14px', fontWeight: active ? '600' : '400',
      fontFamily: "'Outfit', sans-serif",
      transition: 'all 0.15s ease',
      textAlign: 'left',
      marginBottom: '2px',
    }}>
      <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && (
        <span style={{ background: c.amber, color: '#080A06', fontSize: '10px', fontWeight: '800', padding: '2px 7px', borderRadius: '999px', minWidth: '18px', textAlign: 'center' }}>
          {badge}
        </span>
      )}
      {active && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: c.lime, flexShrink: 0 }} />}
    </button>
  );
}

// ── Status colors ─────────────────────────────────────────────
const STATUS_COLOR = {
  active: c.lime, trial: c.amber, suspended: c.red,
  cancelled: c.muted, qualified: c.lime, not_qualified: c.red,
  taken_over: c.orange, closed: c.muted,
};

const PLAN_COLOR = { starter: c.sage, growth: c.lime, enterprise: c.cyan };

// ── Prospecting Panel Component ───────────────────────────────
function ProspectingPanel({ currentUser }) {
  const [prospects,      setProspects]      = useState([]);
  const [stats,          setStats]          = useState(null);
  const [templates,      setTemplates]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [sending,        setSending]        = useState(false);
  const [syncing,        setSyncing]        = useState(false);
  const [selectedIds,    setSelectedIds]    = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [varName,        setVarName]        = useState('');
  const [varAgency,      setVarAgency]      = useState('');
  const [sendResult,     setSendResult]     = useState(null);
  const [activeTab,      setActiveTab]      = useState('contacts');
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [msg,            setMsg]            = useState('');

  // Add single contact
  const [addName,    setAddName]    = useState('');
  const [addPhone,   setAddPhone]   = useState('');
  const [addAgency,  setAddAgency]  = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Bulk paste
  const [bulkText,    setBulkText]    = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const iStyle = { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${c.borderDim}`, borderRadius: '10px', color: c.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', marginBottom: '10px' };

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        api.get('/prospecting'),
        api.get('/prospecting/templates'),
      ]);
      setProspects(pRes.data.data?.prospects || []);
      setStats(pRes.data.data?.stats);
      setTemplates(tRes.data.data?.templates || []);
      if (!selectedTemplate && tRes.data.data?.templates?.length) {
        setSelectedTemplate(tRes.data.data.templates[0].key);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddSingle = async () => {
    if (!addPhone) return;
    setAddLoading(true);
    try {
      await api.post('/prospecting', { phone: addPhone, name: addName, agencyName: addAgency });
      setAddPhone(''); setAddName(''); setAddAgency('');
      setMsg('✅ Contact added'); setTimeout(() => setMsg(''), 2000);
      loadData();
    } catch (err) { setMsg(`❌ ${err.response?.data?.message || 'Failed'}`); }
    finally { setAddLoading(false); }
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) return;
    setBulkLoading(true);
    try {
      const contacts = bulkText.trim().split('\n').map(line => {
        const parts = line.split(',').map(p => p.trim());
        return { phone: parts[0], name: parts[1] || 'Unknown', agencyName: parts[2] || null };
      }).filter(contact => contact.phone);
      const res = await api.post('/prospecting/bulk', { contacts });
      const { added, skipped } = res.data.data?.results || {};
      setBulkText('');
      setMsg(`✅ Added ${added}, skipped ${skipped} duplicates`);
      setTimeout(() => setMsg(''), 3000);
      loadData();
    } catch (err) { setMsg(`❌ Failed to add contacts`); }
    finally { setBulkLoading(false); }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/prospecting/sync');
      setMsg(`✅ ${res.data.message}`);
      setTimeout(() => setMsg(''), 3000);
      loadData();
    } catch (err) { setMsg(`❌ ${err.response?.data?.message || 'Sync failed'}`); }
    finally { setSyncing(false); }
  };

  const handleSend = async () => {
    if (!selectedIds.length) { setMsg('❌ Select at least one contact'); return; }
    if (!selectedTemplate)   { setMsg('❌ Select a template'); return; }
    setSending(true); setSendResult(null); setMsg('');
    try {
      const res = await api.post('/prospecting/send', {
        prospectIds: selectedIds,
        templateKey: selectedTemplate,
        variables:   { name: varName || '', agency: varAgency || '' },
      });
      const results = res.data.data?.results || { sent: 0, failed: 0 };
      setSendResult(results);
      setSelectedIds([]);
      setMsg(`✅ Sent ${results.sent} messages${results.failed > 0 ? `, ${results.failed} failed` : ''}`);
      setTimeout(() => setMsg(''), 5000);
      loadData();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Send failed';
      setMsg(`❌ ${errMsg}`);
      setSendResult(null);
    } finally { setSending(false); }
  };

  const handleSelectAll = () => {
    const filtered = filteredProspects.filter(p => p.status === 'pending');
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(p => p._id));
  };

  const filteredProspects = filterStatus === 'all' ? prospects : prospects.filter(p => p.status === filterStatus);

  const currentTemplate = templates.find(t => t.key === selectedTemplate);

  const STATUS_COLORS = {
    pending: c.muted, sent: c.cyan, delivered: c.emerald,
    replied: c.lime, not_interested: c.red, no_reply: c.muted,
    converted: c.lime, demo_booked: c.earth,
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: c.muted }}>Loading prospecting data...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '900', marginBottom: '4px' }}>Prospecting</h1>
          <p style={{ color: c.muted, fontSize: '15px' }}>Send approved WhatsApp templates to rental agencies</p>
        </div>
        <button onClick={handleSync} disabled={syncing} style={{ padding: '10px 20px', background: `${c.cyan}22`, color: c.cyan, border: `1px solid ${c.cyan}33`, borderRadius: '10px', cursor: syncing ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit', opacity: syncing ? 0.7 : 1 }}>
          {syncing ? '⏳ Syncing...' : '🔄 Sync Google Sheets'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '24px' }}>
          {[
            { l: 'Total',          v: stats.total,          c2: c.text },
            { l: 'Pending',        v: stats.pending,        c2: c.muted },
            { l: 'Sent',           v: stats.sent,           c2: c.cyan },
            { l: 'Replied',        v: stats.replied,        c2: c.lime },
            { l: 'Not Interested', v: stats.notInterested,  c2: c.red },
            { l: 'Converted',      v: stats.converted,      c2: c.emerald },
          ].map(s => (
            <div key={s.l} style={{ background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ color: c.muted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{s.l}</p>
              <p style={{ fontSize: '24px', fontWeight: '800', color: s.c2, fontFamily: "'Fraunces', serif" }}>{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {msg && <div style={{ background: msg.startsWith('✅') ? `${c.lime}18` : `${c.red}18`, border: `1px solid ${msg.startsWith('✅') ? c.lime : c.red}33`, borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', color: msg.startsWith('✅') ? c.lime : c.red, fontSize: '14px' }}>{msg}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: `1px solid ${c.borderDim}`, marginBottom: '24px' }}>
        {['contacts', 'add', 'send'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === t ? `2px solid ${c.lime}` : '2px solid transparent', color: activeTab === t ? c.lime : c.muted, cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === t ? '600' : '400', marginBottom: '-1px', textTransform: 'capitalize', fontFamily: 'inherit' }}>{t === 'add' ? 'Add Contacts' : t === 'send' ? 'Send Messages' : 'Contact List'}</button>
        ))}
      </div>

      {/* ── Contact List ───────────────────────── */}
      {activeTab === 'contacts' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {['all', 'pending', 'sent', 'replied', 'not_interested', 'converted'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: filterStatus === s ? c.lime : 'rgba(255,255,255,0.06)', color: filterStatus === s ? '#050505' : c.muted, fontWeight: filterStatus === s ? '700' : '400', textTransform: 'capitalize', fontSize: '12px', fontFamily: 'inherit' }}>{s.replace(/_/g, ' ')}</button>
            ))}
          </div>
          {loading ? <p style={{ color: c.muted, textAlign: 'center', padding: '40px 0' }}>Loading...</p>
            : filteredProspects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}>
                <p style={{ fontSize: '40px', marginBottom: '16px' }}>📋</p>
                <p>No contacts yet. Add some using the Add Contacts tab.</p>
              </div>
            ) : filteredProspects.map(p => (
              <div key={p._id} style={{ background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '12px', padding: '14px 18px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {p.status === 'pending' && (
                    <input type="checkbox" checked={selectedIds.includes(p._id)} onChange={() => setSelectedIds(prev => prev.includes(p._id) ? prev.filter(id => id !== p._id) : [...prev, p._id])} style={{ cursor: 'pointer' }} />
                  )}
                  <div>
                    <strong style={{ fontSize: '14px' }}>{p.name !== 'Unknown' ? p.name : p.phone}</strong>
                    <p style={{ color: c.muted, fontSize: '12px', marginTop: '2px' }}>{p.phone}{p.agencyName ? ` · ${p.agencyName}` : ''}</p>
                    {p.replyText && <p style={{ color: c.text, fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>"{p.replyText}"</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${STATUS_COLORS[p.status] || c.muted}22`, color: STATUS_COLORS[p.status] || c.muted, fontWeight: '600' }}>{p.status?.replace(/_/g, ' ')}</span>
                  {p.outcome && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${c.earth}22`, color: c.earth }}>{p.outcome?.replace(/_/g, ' ')}</span>}
                  {p.sentAt && <span style={{ fontSize: '11px', color: c.muted }}>{new Date(p.sentAt).toLocaleDateString('en-ZA')}</span>}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── Add Contacts ───────────────────────── */}
      {activeTab === 'add' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Single contact */}
          <div style={{ background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: c.lime }}>➕ Single Contact</h3>
            <input value={addPhone}  onChange={e => setAddPhone(e.target.value)}  placeholder="+27821234567 *" style={iStyle} />
            <input value={addName}   onChange={e => setAddName(e.target.value)}   placeholder="Contact name" style={iStyle} />
            <input value={addAgency} onChange={e => setAddAgency(e.target.value)} placeholder="Agency name" style={iStyle} />
            <button onClick={handleAddSingle} disabled={addLoading || !addPhone} style={{ width: '100%', padding: '12px', background: addPhone ? c.lime : `${c.lime}44`, color: '#050505', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: addPhone ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              {addLoading ? 'Adding...' : 'Add Contact'}
            </button>
          </div>

          {/* Bulk paste */}
          <div style={{ background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: c.cyan }}>📋 Paste List</h3>
            <p style={{ color: c.muted, fontSize: '12px', marginBottom: '12px' }}>One per line: +27821234567, Name, Agency</p>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={`+27821234567, John Smith, ABC Rentals\n+27731234567, Sarah Jones, Sunset Properties`} rows={6} style={{ ...iStyle, resize: 'vertical' }} />
            <button onClick={handleBulkAdd} disabled={bulkLoading || !bulkText.trim()} style={{ width: '100%', padding: '12px', background: bulkText.trim() ? c.cyan : `${c.cyan}44`, color: '#050505', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: bulkText.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              {bulkLoading ? 'Adding...' : 'Add All Contacts'}
            </button>
          </div>
        </div>
      )}

      {/* ── Send Messages ─────────────────────── */}
      {activeTab === 'send' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left — template + variables */}
          <div>
            <div style={{ background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '14px', padding: '24px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Select Template</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {templates.map(t => (
                  <button key={t.key} onClick={() => setSelectedTemplate(t.key)} style={{ padding: '12px 16px', background: selectedTemplate === t.key ? `${c.lime}18` : 'rgba(255,255,255,0.04)', border: `1px solid ${selectedTemplate === t.key ? c.lime : c.borderDim}`, borderRadius: '10px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    <p style={{ color: selectedTemplate === t.key ? c.lime : c.text, fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>{t.name}</p>
                    <p style={{ color: c.muted, fontSize: '12px' }}>Variables: {t.variables.join(', ')}</p>
                  </button>
                ))}
              </div>
              {currentTemplate?.variables.includes('name') && <input value={varName} onChange={e => setVarName(e.target.value)} placeholder="Default name (if not in contact)" style={iStyle} />}
              {currentTemplate?.variables.includes('agency') && <input value={varAgency} onChange={e => setVarAgency(e.target.value)} placeholder="Default agency name" style={iStyle} />}
            </div>

            {/* Message preview */}
            {currentTemplate && (
              <div style={{ background: c.surface, border: `1px solid ${c.borderDim}`, borderRadius: '12px', padding: '16px' }}>
                <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Preview</p>
                <p style={{ color: c.text, fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {typeof currentTemplate.preview === 'function'
                    ? currentTemplate.preview({ name: varName || '[Name]', agency: varAgency || '[Agency]' })
                    : (currentTemplate.preview || '')
                        .replace(/\[Name\]/g, varName || '[Name]')
                        .replace(/\[Agency\]/g, varAgency || '[Agency]')
                  }
                </p>
              </div>
            )}
          </div>

          {/* Right — selected contacts + send */}
          <div>
            <div style={{ background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '14px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
                  {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Select contacts'}
                </h3>
                <button onClick={handleSelectAll} style={{ padding: '6px 14px', background: `${c.lime}22`, color: c.lime, border: `1px solid ${c.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                  {selectedIds.length === prospects.filter(p => p.status === 'pending').length && prospects.filter(p => p.status === 'pending').length > 0 ? 'Deselect All' : 'Select All Pending'}
                </button>
              </div>

              {/* Inline contact list with checkboxes */}
              <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '16px', borderRadius: '10px', border: `1px solid ${c.borderDim}` }}>
                {prospects.filter(p => p.status === 'pending').length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: c.muted, fontSize: '13px' }}>
                    No pending contacts. Add contacts first.
                  </div>
                ) : prospects.filter(p => p.status === 'pending').map(p => (
                  <div key={p._id} onClick={() => setSelectedIds(prev => prev.includes(p._id) ? prev.filter(id => id !== p._id) : [...prev, p._id])}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: `1px solid ${c.borderDim}`, cursor: 'pointer', background: selectedIds.includes(p._id) ? `${c.lime}08` : 'transparent' }}>
                    <input type="checkbox" checked={selectedIds.includes(p._id)} onChange={() => {}} style={{ cursor: 'pointer', accentColor: c.lime }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: c.text }}>{p.name !== 'Unknown' ? p.name : p.phone}</p>
                      <p style={{ fontSize: '11px', color: c.muted }}>{p.phone}{p.agencyName ? ` · ${p.agencyName}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ color: c.muted, fontSize: '12px', marginBottom: '16px' }}>
                Pending: <span style={{ color: c.lime, fontWeight: '700' }}>{prospects.filter(p => p.status === 'pending').length}</span>
                {selectedIds.length > 0 && <span style={{ color: c.lime, marginLeft: '8px' }}>· {selectedIds.length} selected</span>}
              </p>

              <button onClick={handleSend} disabled={sending || !selectedIds.length || !selectedTemplate} style={{
                width: '100%', padding: '15px',
                background: selectedIds.length && selectedTemplate ? c.lime : `${c.lime}44`,
                color: '#050505', border: 'none', borderRadius: '12px',
                fontWeight: '700', fontSize: '15px',
                cursor: selectedIds.length && selectedTemplate ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', marginBottom: '12px',
              }}>
                {sending ? '⏳ Sending...' : selectedIds.length ? `📤 Send to ${selectedIds.length} contacts` : '📤 Select contacts above'}
              </button>

              {sendResult && (
                <div style={{ background: `${c.lime}08`, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '14px' }}>
                  <p style={{ color: c.lime, fontWeight: '700', marginBottom: '6px' }}>✅ Sent {sendResult.sent} messages</p>
                  {sendResult.failed > 0 && <p style={{ color: c.red, fontSize: '13px' }}>❌ {sendResult.failed} failed</p>}
                  {sendResult.errors?.length > 0 && sendResult.errors.map((e, i) => (
                    <p key={i} style={{ color: c.red, fontSize: '11px', marginTop: '4px' }}>• {e.error}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [section,     setSection]     = useState('operations');
  const [opsTab,      setOpsTab]      = useState('overview');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data
  const [overview,          setOverview]          = useState(null);
  const [activeLeads,       setActiveLeads]        = useState([]);
  const [qualifiedLeads,    setQualifiedLeads]     = useState([]);
  const [rejectedLeads,     setRejectedLeads]      = useState([]);
  const [stages,            setStages]             = useState([]);
  const [viewings,          setViewings]           = useState([]);
  const [messages,          setMessages]           = useState([]);
  const [alerts,            setAlerts]             = useState([]);
  const [tenants,           setTenants]            = useState([]);
  const [tenantStats,       setTenantStats]        = useState(null);
  const [allUsers,          setAllUsers]           = useState([]);
  const [pendingUsers,      setPendingUsers]       = useState([]);
  const [agents,            setAgents]             = useState([]);
  const [health,            setHealth]             = useState(null);
  const [leadDetailId,      setLeadDetailId]       = useState(null);
  const [clientModal,       setClientModal]        = useState(null);
  const [approveModal,      setApproveModal]       = useState(null);
  const [inviteModal,       setInviteModal]        = useState(null);
  const [inviteUrl,         setInviteUrl]          = useState('');

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('eb_user') || '{}'); }
    catch { return {}; }
  })();
  const isSuperAdmin = user.role === 'super_admin';

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovRes, activeRes, qualRes, rejRes, stagesRes, viewRes, msgRes, alertRes, tenantRes, statsRes, usersRes, pendingRes, agentRes] = await Promise.all([
        api.get('/admin-ops/overview'),
        api.get('/admin-ops/conversations/active'),
        api.get('/admin-ops/leads/qualified'),
        api.get('/admin-ops/leads/rejected'),
        api.get('/admin-ops/stages'),
        api.get('/admin-ops/viewings'),
        api.get('/admin-ops/messages/recent'),
        api.get('/admin-ops/alerts'),
        api.get('/tenants'),
        api.get('/tenants/stats'),
        api.get('/users'),
        api.get('/users/pending'),
        api.get('/admin-ops/agents'),
      ]);
      setOverview(ovRes.data.data?.overview);
      setActiveLeads(activeRes.data.data?.leads || []);
      setQualifiedLeads(qualRes.data.data?.leads || []);
      setRejectedLeads(rejRes.data.data?.leads || []);
      setStages(stagesRes.data.data?.stages || []);
      setViewings(viewRes.data.data?.viewings || []);
      setMessages(msgRes.data.data?.messages || []);
      setAlerts(alertRes.data.data?.alerts || []);
      setTenants(tenantRes.data.data?.tenants || []);
      setTenantStats(statsRes.data.data?.stats);
      setAllUsers(usersRes.data.data?.users || []);
      setPendingUsers(pendingRes.data.data?.users || []);
      setAgents(agentRes.data.data?.agents || []);

      // Health check
      const hRes = await fetch(`${import.meta.env.VITE_API_URL}/health`);
      setHealth(await hRes.json());
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSignOut = () => {
    localStorage.removeItem('eb_token');
    localStorage.removeItem('eb_user');
    window.location.href = '/';
  };

  const handleSuspendToggle = async (tenant) => {
    const newStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
    try {
      await api.put(`/tenants/${tenant._id}`, { status: newStatus });
      loadData();
    } catch { alert('Failed to update status'); }
  };

  const handleDeleteClient = async (tenant) => {
    if (!window.confirm(`Delete ${tenant.businessName}? This cannot be undone.`)) return;
    try {
      await api.delete(`/tenants/${tenant._id}`);
      loadData();
    } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const handleRejectUser = async (u) => {
    if (!window.confirm(`Reject ${u.fullName}?`)) return;
    try {
      await api.post(`/users/${u._id}/reject`, { reason: 'Application rejected' });
      loadData();
    } catch { alert('Failed to reject user'); }
  };

  const generateInvite = async (tenant) => {
    try {
      const res = await api.post(`/invites/${tenant._id}/generate`);
      setInviteUrl(res.data.data?.inviteUrl || '');
      setInviteModal(tenant);
      loadData();
    } catch { alert('Failed to generate invite'); }
  };

  // ── Sidebar sections ──────────────────────────────────────
  const navSections = [
    { id: 'operations',  icon: '🏠', label: 'Operations',   badge: alerts.length },
    { id: 'clients',     icon: '👥', label: 'Clients',      badge: 0 },
    { id: 'prospecting', icon: '📤', label: 'Prospecting',  badge: 0 },
    { id: 'ebteam',      icon: '👔', label: 'EB Team',      badge: 0 },
    { id: 'users',       icon: '👤', label: 'Users',        badge: pendingUsers.length },
    ...(isSuperAdmin ? [{ id: 'platform', icon: '⚙️', label: 'Platform', badge: 0 }] : []),
  ];

  const opsTabs = ['overview', 'active', 'qualified', 'rejected', 'funnel', 'viewings', 'messages', 'alerts'];

  const sStyle = { fontFamily: "'Outfit', sans-serif", minHeight: '100vh', background: c.bg, color: c.text, display: 'flex' };
  const iStyle = { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${c.borderDim}`, borderRadius: '10px', color: c.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', marginBottom: '12px' };

  return (
    <div style={sStyle}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${c.bg}; }
        ::-webkit-scrollbar-thumb { background: ${c.moss}; border-radius: 2px; }
        .nav-item-hover:hover { background: rgba(184,240,64,0.06) !important; color: ${c.text} !important; }
        .card-hover:hover { border-color: rgba(184,240,64,0.2) !important; transform: translateY(-2px); }
        .card-hover { transition: all 0.2s ease; }
        @media (max-width: 768px) {
          .sidebar { width: 60px !important; }
          .sidebar .nav-label { display: none; }
          .sidebar .user-info { display: none; }
          .main-content { margin-left: 60px !important; }
        }
      `}</style>

      {/* ── SIDEBAR ───────────────────────────────────────── */}
      <div className="sidebar" style={{
        width: sidebarOpen ? '220px' : '64px',
        minHeight: '100vh', background: c.sidebar,
        borderRight: `1px solid ${c.borderDim}`,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: '64px', left: 0, bottom: 0,
        zIndex: 50, transition: 'width 0.2s ease',
        overflowY: 'auto', overflowX: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid ${c.borderDim}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: `linear-gradient(135deg, ${c.lime}, ${c.moss})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🌿</div>
          {sidebarOpen && (
            <div>
              <p style={{ fontSize: '13px', fontWeight: '700', color: c.text, lineHeight: 1 }}>Easy Branding</p>
              <p style={{ fontSize: '11px', color: c.lime, fontWeight: '600' }}>AI</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontSize: '16px', padding: '4px', flexShrink: 0 }}>
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        {/* Nav items */}
        <div style={{ padding: '12px 8px', flex: 1 }}>
          {navSections.map(nav => (
            <button key={nav.id} onClick={() => setSection(nav.id)} className="nav-item-hover" style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: section === nav.id ? 'rgba(184,240,64,0.12)' : 'transparent',
              color: section === nav.id ? c.lime : c.muted,
              fontSize: '14px', fontWeight: section === nav.id ? '600' : '400',
              fontFamily: "'Outfit', sans-serif", marginBottom: '2px', textAlign: 'left',
            }}>
              <span style={{ fontSize: '18px', width: '24px', textAlign: 'center', flexShrink: 0 }}>{nav.icon}</span>
              {sidebarOpen && (
                <>
                  <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{nav.label}</span>
                  {nav.badge > 0 && <span style={{ background: c.amber, color: '#080A06', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '999px' }}>{nav.badge}</span>}
                </>
              )}
            </button>
          ))}
        </div>

        {/* User info */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${c.borderDim}` }}>
          {sidebarOpen ? (
            <>
              <p style={{ fontSize: '13px', fontWeight: '600', color: c.text, marginBottom: '2px' }}>{user.fullName || 'Ayanda'}</p>
              <p style={{ fontSize: '11px', color: c.lime, marginBottom: '10px' }}>{user.role}</p>
              <button onClick={handleSignOut} style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${c.borderDim}`, color: c.muted, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                Sign Out
              </button>
            </>
          ) : (
            <button onClick={handleSignOut} style={{ width: '100%', padding: '8px', background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontSize: '18px' }}>↩</button>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <div className="main-content" style={{ marginLeft: sidebarOpen ? '220px' : '64px', flex: 1, padding: '32px', paddingTop: '96px', transition: 'margin-left 0.2s ease', minHeight: '100vh' }}>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🌿</div>
              <p style={{ color: c.muted }}>Loading platform data...</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div style={{ background: `${c.red}18`, border: `1px solid ${c.red}33`, borderRadius: '12px', padding: '16px', color: c.red, marginBottom: '24px' }}>
            {error} — <button onClick={loadData} style={{ background: 'none', border: 'none', color: c.lime, cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button>
          </div>
        )}

        {!loading && (
          <>
            {/* ══════════════════════════════════════════════ */}
            {/* OPERATIONS SECTION */}
            {/* ══════════════════════════════════════════════ */}
            {section === 'operations' && (
              <div>
                <div style={{ marginBottom: '28px' }}>
                  <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '900', marginBottom: '4px' }}>Operations</h1>
                  <p style={{ color: c.muted, fontSize: '15px' }}>Real-time WhatsApp pipeline across all agencies</p>
                </div>

                {/* Operations sub-tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', borderBottom: `1px solid ${c.borderDim}`, overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {opsTabs.map(t => (
                    <button key={t} onClick={() => setOpsTab(t)} style={{
                      padding: '10px 16px', background: 'none', border: 'none',
                      borderBottom: opsTab === t ? `2px solid ${c.lime}` : '2px solid transparent',
                      color: opsTab === t ? c.lime : c.muted,
                      cursor: 'pointer', fontSize: '13px', fontWeight: opsTab === t ? '600' : '400',
                      textTransform: 'capitalize', marginBottom: '-1px', whiteSpace: 'nowrap',
                      fontFamily: 'inherit',
                    }}>
                      {t}
                      {t === 'alerts' && alerts.length > 0 && <span style={{ marginLeft: '6px', background: c.red, color: '#fff', fontSize: '10px', padding: '1px 5px', borderRadius: '999px' }}>{alerts.length}</span>}
                    </button>
                  ))}
                </div>

                {/* Overview */}
                {opsTab === 'overview' && overview && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '32px' }}>
                      <StatCard label="Total Leads"   value={overview.totalLeads}          color={c.text}    icon="📊" />
                      <StatCard label="Active"        value={overview.activeConversations}  color={c.cyan}    icon="💬" />
                      <StatCard label="Qualified"     value={overview.qualifiedLeads}       color={c.lime}    icon="✅" />
                      <StatCard label="Rejected"      value={overview.rejectedLeads}        color={c.red}     icon="❌" />
                      <StatCard label="Today"         value={overview.todayLeads}           color={c.amber}   icon="📅" />
                      <StatCard label="Qual. Rate"    value={`${overview.qualificationRate}%`} color={c.emerald} icon="📈" />
                      {isSuperAdmin && <StatCard label="Clients"    value={tenants.length}           color={c.cyan}    icon="👥" />}
                      {isSuperAdmin && <StatCard label="MRR"        value={`R${(tenantStats?.mrr || 0).toLocaleString()}`} color={c.lime} icon="💰" sub="monthly recurring" />}
                    </div>

                    {/* Recent activity */}
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: c.muted }}>Recent Activity</h3>
                    {activeLeads.slice(0, 5).map(lead => (
                      <div key={lead._id} onClick={() => setLeadDetailId(lead._id)} className="card-hover" style={{ background: c.card, border: `1px solid ${lead.isProspect ? c.lime + '33' : c.borderDim}`, borderRadius: '12px', padding: '14px 18px', marginBottom: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                            {lead.isProspect && <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: `${c.lime}22`, color: c.lime, fontWeight: '700' }}>🎯 Prospect</span>}
                          </div>
                          <p style={{ color: c.muted, fontSize: '12px', marginTop: '2px' }}>{lead.phone}</p>
                        </div>
                        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${STATUS_COLOR[lead.workflowStatus] || c.muted}18`, color: STATUS_COLOR[lead.workflowStatus] || c.muted }}>{lead.workflowStatus?.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Active */}
                {opsTab === 'active' && (
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Active Conversations ({activeLeads.length})</h2>
                    {activeLeads.length === 0
                      ? <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}><p style={{ fontSize: '40px', marginBottom: '16px' }}>💬</p><p>No active conversations.</p></div>
                      : activeLeads.map(lead => (
                        <div key={lead._id} onClick={() => setLeadDetailId(lead._id)} className="card-hover" style={{ background: c.card, border: `1px solid ${lead.isProspect ? c.lime + '44' : c.borderDim}`, borderRadius: '14px', padding: '16px 20px', marginBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                              <strong>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                              {lead.isProspect && (
                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${c.lime}22`, color: c.lime, fontWeight: '700' }}>
                                  🎯 {lead.prospectOutcome?.replace(/_/g, ' ') || 'Prospect'}
                                </span>
                              )}
                            </div>
                            <p style={{ color: c.muted, fontSize: '13px', marginTop: '2px' }}>{lead.phone}</p>
                            <p style={{ color: c.muted, fontSize: '12px', marginTop: '2px' }}>Stage: <span style={{ color: lead.isProspect ? c.lime : c.cyan }}>{lead.isProspect ? '👤 Agent takeover' : lead.workflowStatus?.replace(/_/g, ' ')}</span></p>
                          </div>
                          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: lead.isProspect ? `${c.lime}18` : `${c.cyan}18`, color: lead.isProspect ? c.lime : c.cyan }}>{lead.isProspect ? 'Prospect' : 'Active'}</span>
                        </div>
                      ))
                    }
                  </div>
                )}

                {/* Qualified */}
                {opsTab === 'qualified' && (
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Qualified Leads ({qualifiedLeads.length})</h2>
                    {qualifiedLeads.length === 0
                      ? <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}><p style={{ fontSize: '40px', marginBottom: '16px' }}>✅</p><p>No qualified leads yet.</p></div>
                      : qualifiedLeads.map(lead => (
                        <div key={lead._id} onClick={() => setLeadDetailId(lead._id)} className="card-hover" style={{ background: c.card, border: `1px solid ${lead.aiSummary?.urgency === 'high' ? c.lime + '44' : c.borderDim}`, borderRadius: '14px', padding: '18px 24px', marginBottom: '10px', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '16px' }}>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                                {lead.aiSummary?.score && (
                                  <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', fontWeight: '700', background: lead.aiSummary.score >= 8 ? `${c.lime}22` : `${c.amber}22`, color: lead.aiSummary.score >= 8 ? c.lime : c.amber }}>
                                    🤖 {lead.aiSummary.score}/10 · {lead.aiSummary.scoreLabel}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                {lead.propertyInterest && <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: `${c.cyan}22`, color: c.cyan }}>{lead.propertyInterest}</span>}
                                {lead.monthlyBudget && <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: `${c.lime}22`, color: c.lime }}>R{lead.monthlyBudget}/mo</span>}
                                {lead.moveInDate && <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: `${c.amber}22`, color: c.amber }}>{lead.moveInDate}</span>}
                              </div>
                              {lead.aiSummary?.summary && (
                                <div style={{ marginTop: '10px', background: 'rgba(184,240,64,0.04)', border: `1px solid ${c.border}`, borderRadius: '10px', padding: '10px 12px' }}>
                                  <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>🤖 AI Analysis</p>
                                  <p style={{ color: c.text, fontSize: '13px', lineHeight: '1.5', marginBottom: '4px' }}>{lead.aiSummary.summary}</p>
                                  {lead.aiSummary.recommendedAction && <p style={{ color: c.lime, fontSize: '12px', fontWeight: '600' }}>→ {lead.aiSummary.recommendedAction}</p>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}

                {/* Rejected */}
                {opsTab === 'rejected' && (
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Rejected Leads ({rejectedLeads.length})</h2>
                    {rejectedLeads.length === 0
                      ? <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}><p style={{ fontSize: '40px', marginBottom: '16px' }}>❌</p><p>No rejected leads.</p></div>
                      : rejectedLeads.map(lead => (
                        <div key={lead._id} onClick={() => setLeadDetailId(lead._id)} className="card-hover" style={{ background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '12px', padding: '14px 18px', marginBottom: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>{lead.name !== 'Unknown' ? lead.name : lead.phone}</strong>
                            <p style={{ color: c.muted, fontSize: '12px', marginTop: '2px' }}>{lead.rejectionReason || 'Did not qualify'}</p>
                          </div>
                          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${c.red}18`, color: c.red }}>Rejected</span>
                        </div>
                      ))
                    }
                  </div>
                )}

                {/* Funnel */}
                {opsTab === 'funnel' && (
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Pipeline Funnel</h2>
                    {stages.map((stage, i) => (
                      <div key={i} style={{ background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '12px', padding: '16px 18px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>{stage.label}</span>
                          <span style={{ color: c.muted, fontSize: '13px' }}>{stage.count} leads · {stage.percentage}%</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${stage.percentage}%`, background: stage.stage === 'qualified' ? c.lime : stage.stage === 'not_qualified' ? c.red : c.cyan, borderRadius: '999px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Viewings */}
                {opsTab === 'viewings' && (
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Viewing Requests ({viewings.length})</h2>
                    {viewings.length === 0
                      ? <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}><p style={{ fontSize: '40px', marginBottom: '16px' }}>📅</p><p>No viewing requests.</p></div>
                      : viewings.map(v => (
                        <div key={v._id} onClick={() => setLeadDetailId(v._id)} className="card-hover" style={{ background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '12px', padding: '14px 18px', marginBottom: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>{v.name !== 'Unknown' ? v.name : v.phone}</strong>
                            <p style={{ color: c.muted, fontSize: '12px', marginTop: '2px' }}>{v.phone}</p>
                          </div>
                          {v.viewingScheduledAt && <p style={{ color: c.emerald, fontSize: '13px', fontWeight: '600' }}>{new Date(v.viewingScheduledAt).toLocaleDateString('en-ZA')}</p>}
                        </div>
                      ))
                    }
                  </div>
                )}

                {/* Messages */}
                {opsTab === 'messages' && (
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Recent Messages</h2>
                    {messages.map((msg, i) => (
                      <div key={i} onClick={() => setLeadDetailId(msg.leadId)} className="card-hover" style={{ background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '8px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.direction === 'inbound' ? `${c.cyan}22` : `${c.lime}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                          {msg.direction === 'inbound' ? '📱' : '🤖'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <strong style={{ fontSize: '13px' }}>{msg.name !== 'Unknown' ? msg.name : msg.phone}</strong>
                            <span style={{ fontSize: '11px', color: c.muted }}>{new Date(msg.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p style={{ color: c.muted, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Alerts */}
                {opsTab === 'alerts' && (
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>
                      Alerts
                      {alerts.length > 0 && <span style={{ marginLeft: '10px', background: c.red, color: '#fff', fontSize: '12px', padding: '3px 10px', borderRadius: '999px' }}>{alerts.length}</span>}
                    </h2>
                    {alerts.length === 0
                      ? <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}><p style={{ fontSize: '40px', marginBottom: '16px' }}>✅</p><p>No alerts.</p></div>
                      : alerts.map((alert, i) => (
                        <div key={i} className="card-hover" style={{ background: c.card, border: `1px solid ${alert.severity === 'high' ? c.red + '44' : c.amber + '44'}`, borderRadius: '14px', padding: '16px 20px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>{alert.lead?.name !== 'Unknown' ? alert.lead?.name : alert.lead?.phone}</strong>
                              <p style={{ color: c.muted, fontSize: '13px', marginTop: '4px' }}>{alert.message}</p>
                            </div>
                            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: alert.severity === 'high' ? `${c.red}22` : `${c.amber}22`, color: alert.severity === 'high' ? c.red : c.amber, fontWeight: '700', textTransform: 'uppercase' }}>{alert.severity}</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* CLIENTS SECTION */}
            {/* ══════════════════════════════════════════════ */}
            {section === 'clients' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                  <div>
                    <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '900', marginBottom: '4px' }}>Clients</h1>
                    <p style={{ color: c.muted, fontSize: '15px' }}>Manage rental agency accounts</p>
                  </div>
                  <button onClick={() => setClientModal({})} style={{ padding: '12px 24px', background: c.lime, color: '#080A06', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Client</button>
                </div>

                {/* Stats */}
                {tenantStats && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                    <StatCard label="Total"   value={tenantStats.total  || 0} icon="👥" />
                    <StatCard label="Active"  value={tenantStats.active || 0} color={c.lime}    icon="✅" />
                    <StatCard label="Trial"   value={tenantStats.trial  || 0} color={c.amber}   icon="🧪" />
                    <StatCard label="MRR"     value={`R${(tenantStats.mrr || 0).toLocaleString()}`} color={c.lime} icon="💰" sub="monthly recurring" />
                  </div>
                )}

                {/* Client list */}
                {tenants.length === 0
                  ? <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}><p style={{ fontSize: '40px', marginBottom: '16px' }}>🌿</p><p>No clients yet — add your first one.</p></div>
                  : tenants.map(tenant => (
                    <div key={tenant._id} className="card-hover" style={{ background: c.card, border: `1px solid ${!tenant.whatsappNumber ? c.amber + '44' : c.borderDim}`, borderRadius: '14px', padding: '18px 24px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '16px' }}>{tenant.businessName}</strong>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${STATUS_COLOR[tenant.status] || c.muted}22`, color: STATUS_COLOR[tenant.status] || c.muted, fontWeight: '600' }}>{tenant.status}</span>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${PLAN_COLOR[tenant.plan] || c.muted}22`, color: PLAN_COLOR[tenant.plan] || c.muted }}>{tenant.plan}</span>
                            {!tenant.whatsappNumber && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${c.amber}22`, color: c.amber, fontWeight: '600' }}>⚠️ No WhatsApp</span>}
                            {tenant.inviteToken && tenant.inviteExpiresAt && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${c.cyan}18`, color: c.cyan }}>🔗 Invite expires {new Date(tenant.inviteExpiresAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</span>}
                          </div>
                          <p style={{ color: c.muted, fontSize: '13px' }}>{tenant.contactEmail}{tenant.whatsappNumber ? ` · ${tenant.whatsappNumber}` : ''}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ textAlign: 'center', padding: '6px 12px', background: `${c.lime}08`, borderRadius: '8px' }}>
                            <p style={{ color: c.lime, fontWeight: '700', fontSize: '16px' }}>{tenant.totalLeads || 0}</p>
                            <p style={{ color: c.muted, fontSize: '10px' }}>Leads</p>
                          </div>
                          <div style={{ textAlign: 'center', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <p style={{ color: c.text, fontWeight: '700', fontSize: '16px' }}>R{tenant.monthlyFee}</p>
                            <p style={{ color: c.muted, fontSize: '10px' }}>/mo</p>
                          </div>
                          <button onClick={() => handleSuspendToggle(tenant)} style={{ padding: '7px 14px', background: tenant.status === 'suspended' ? `${c.lime}22` : `${c.amber}22`, color: tenant.status === 'suspended' ? c.lime : c.amber, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit' }}>
                            {tenant.status === 'suspended' ? '▶ Activate' : '⏸ Suspend'}
                          </button>
                          <button onClick={() => setClientModal(tenant)} style={{ padding: '7px 14px', background: `${c.lime}22`, color: c.lime, border: `1px solid ${c.border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>Edit</button>
                          <button onClick={() => generateInvite(tenant)} style={{ padding: '7px 14px', background: `${c.cyan}22`, color: c.cyan, border: `1px solid ${c.cyan}33`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>🔗 Invite</button>
                          {isSuperAdmin && <button onClick={() => handleDeleteClient(tenant)} style={{ padding: '7px 14px', background: `${c.red}22`, color: c.red, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>Delete</button>}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* PROSPECTING SECTION */}
            {/* ══════════════════════════════════════════════ */}
            {section === 'prospecting' && (
              <ProspectingPanel currentUser={user} />
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* EB TEAM SECTION */}
            {/* ══════════════════════════════════════════════ */}
            {section === 'ebteam' && (
              <div>
                <div style={{ marginBottom: '28px' }}>
                  <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '900', marginBottom: '4px' }}>EB Team</h1>
                  <p style={{ color: c.muted, fontSize: '15px' }}>Easy Branding AI internal staff</p>
                </div>
                <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
                  <p style={{ fontSize: '48px', marginBottom: '16px' }}>👔</p>
                  <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: '900', marginBottom: '8px' }}>Coming soon</h3>
                  <p style={{ color: c.muted, fontSize: '15px' }}>Manage your sales agents and their prospecting activity.</p>
                  <p style={{ color: c.muted, fontSize: '14px', marginTop: '8px' }}>eb_manager · eb_agent roles · Activity tracking · Leaderboard</p>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* USERS SECTION */}
            {/* ══════════════════════════════════════════════ */}
            {section === 'users' && (
              <div>
                <div style={{ marginBottom: '28px' }}>
                  <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '900', marginBottom: '4px' }}>Users</h1>
                  <p style={{ color: c.muted, fontSize: '15px' }}>Platform user management</p>
                </div>

                {/* Pending approvals */}
                {pendingUsers.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: c.amber }}>
                      ⏳ Pending Approvals ({pendingUsers.length})
                    </h3>
                    {pendingUsers.map(u => (
                      <div key={u._id} style={{ background: c.card, border: `1px solid ${c.amber}44`, borderRadius: '14px', padding: '16px 20px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <strong>{u.fullName}</strong>
                          <p style={{ color: c.muted, fontSize: '13px', marginTop: '2px' }}>{u.email} · {u.phone}</p>
                          {u.requestedPlan && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${c.lime}18`, color: c.lime, fontWeight: '600', marginTop: '4px', display: 'inline-block' }}>{u.requestedPlan} plan</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setApproveModal(u)} style={{ padding: '8px 18px', background: `${c.lime}22`, color: c.lime, border: `1px solid ${c.border}`, borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', fontFamily: 'inherit' }}>✅ Approve</button>
                          <button onClick={() => handleRejectUser(u)} style={{ padding: '8px 14px', background: `${c.red}22`, color: c.red, border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* All users */}
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>All Users ({allUsers.length})</h3>
                {allUsers.map(u => (
                  <div key={u._id} style={{ background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '12px', padding: '14px 18px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <strong>{u.fullName}</strong>
                      <p style={{ color: c.muted, fontSize: '13px', marginTop: '2px' }}>{u.email}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: u.approved ? `${c.lime}22` : `${c.amber}22`, color: u.approved ? c.lime : c.amber }}>{u.approved ? '✅' : '⏳'} {u.approved ? 'Approved' : 'Pending'}</span>
                      {u.role === 'super_admin' || u._id === user.id ? (
                        <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: `${c.cyan}22`, color: c.cyan, fontWeight: '600' }}>{u.role} {u._id === user.id ? '(you)' : '🔒'}</span>
                      ) : (
                        <select defaultValue={u.role} onChange={async (e) => {
                          try { await api.patch(`/users/${u._id}/role`, { role: e.target.value }); loadData(); }
                          catch (err) { alert(err.response?.data?.message || 'Failed'); e.target.value = u.role; }
                        }} style={{ padding: '4px 8px', background: `${c.cyan}18`, border: `1px solid ${c.cyan}33`, color: c.cyan, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                          <option value="borrower">borrower</option>
                          <option value="agent">agent</option>
                          <option value="admin">admin</option>
                          <option value="eb_agent">eb_agent</option>
                          <option value="eb_manager">eb_manager</option>
                          {isSuperAdmin && <option value="super_admin">super_admin</option>}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* PLATFORM SECTION (super_admin only) */}
            {/* ══════════════════════════════════════════════ */}
            {section === 'platform' && isSuperAdmin && (
              <div>
                <div style={{ marginBottom: '28px' }}>
                  <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '900', marginBottom: '4px' }}>Platform</h1>
                  <p style={{ color: c.muted, fontSize: '15px' }}>System health and revenue overview</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                  <StatCard label="API Status"   value={health?.status === 'ok' ? '✅ Online' : '❌ Issue'} color={c.lime} icon="🟢" />
                  <StatCard label="Database"     value={health?.services?.database?.status === 'connected' ? '✅ Connected' : '❌ Down'} color={c.lime} icon="🗄️" />
                  <StatCard label="Environment"  value={health?.environment || 'production'} color={c.cyan} icon="⚙️" />
                  <StatCard label="Uptime"       value={health?.uptime ? `${Math.floor(health.uptime / 3600)}h` : '—'} color={c.emerald} icon="⏱️" />
                  <StatCard label="Version"      value={health?.version || '1.2.0'} color={c.muted} icon="📦" />
                  <StatCard label="Total MRR"    value={`R${(tenantStats?.mrr || 0).toLocaleString()}`} color={c.lime} icon="💰" sub="active clients only" />
                </div>

                <div style={{ background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
                  <p style={{ color: c.muted, fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Backend URL</p>
                  <p style={{ color: c.lime, fontSize: '14px', fontFamily: 'monospace' }}>{import.meta.env.VITE_API_URL}</p>
                </div>

                <div style={{ background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '14px', padding: '20px' }}>
                  <p style={{ color: c.muted, fontSize: '12px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Revenue by Plan</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                    {tenantStats?.byPlan && Object.entries(tenantStats.byPlan).map(([plan, count]) => (
                      <div key={plan} style={{ background: c.surface, borderRadius: '10px', padding: '14px' }}>
                        <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>{plan}</p>
                        <p style={{ color: PLAN_COLOR[plan] || c.lime, fontSize: '20px', fontWeight: '700' }}>{count} <span style={{ color: c.muted, fontSize: '12px' }}>clients</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      {leadDetailId && <LeadDetailModal leadId={leadDetailId} onClose={() => setLeadDetailId(null)} onUpdate={loadData} />}

      {/* Client modal */}
      {clientModal !== null && (
        <ClientModal
          tenant={clientModal}
          onClose={() => setClientModal(null)}
          onSaved={() => { setClientModal(null); loadData(); }}
        />
      )}

      {/* Invite modal */}
      {inviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '500px', background: c.surface, borderRadius: '20px', border: `1px solid ${c.border}`, padding: '32px' }}>
            <h3 style={{ color: c.lime, marginBottom: '8px' }}>🔗 Invite Link</h3>
            <p style={{ color: c.muted, fontSize: '14px', marginBottom: '20px' }}>Share with <strong style={{ color: c.text }}>{inviteModal.businessName}</strong> staff.</p>
            <div style={{ background: '#1C1C19', border: `1px solid ${c.borderDim}`, borderRadius: '10px', padding: '14px', marginBottom: '14px', wordBreak: 'break-all' }}>
              <p style={{ color: c.lime, fontSize: '13px', fontFamily: 'monospace' }}>{inviteUrl}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => navigator.clipboard.writeText(inviteUrl)} style={{ flex: 1, padding: '12px', background: c.lime, color: '#050505', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Copy Link</button>
              <button onClick={() => setInviteModal(null)} style={{ padding: '12px 20px', background: 'transparent', border: `1px solid ${c.borderDim}`, color: c.muted, borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Approve modal */}
      {approveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <ApproveModal user={approveModal} tenants={tenants} onClose={() => setApproveModal(null)} onApproved={() => { setApproveModal(null); loadData(); }} />
        </div>
      )}
    </div>
  );
}

// ── Client Modal component ────────────────────────────────────
function ClientModal({ tenant, onClose, onSaved }) {
  const isNew = !tenant?._id;
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [form,   setForm]   = useState({
    businessName:   tenant?.businessName   || '',
    brandName:      tenant?.brandName      || '',
    contactEmail:   tenant?.contactEmail   || '',
    whatsappNumber: tenant?.whatsappNumber || '',
    plan:           tenant?.plan           || 'starter',
    status:         tenant?.status         || 'trial',
    workflowType:   tenant?.workflowType   || 'basic',
    monthlyFee:     tenant?.monthlyFee     || 950,
    qualificationRules: {
      minimumBudget:   tenant?.qualificationRules?.minimumBudget   || 500,
      maximumBudget:   tenant?.qualificationRules?.maximumBudget   || 50000,
      allowUnemployed: tenant?.qualificationRules?.allowUnemployed ?? true,
      incomeMultiplier: tenant?.qualificationRules?.incomeMultiplier || 3,
    },
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const setRule = (field, value) => setForm(prev => ({
    ...prev,
    qualificationRules: { ...prev.qualificationRules, [field]: value },
  }));

  const iStyle = { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${c.borderDim}`, borderRadius: '10px', color: c.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', marginBottom: '14px' };
  const labelStyle = { color: c.muted, fontSize: '12px', marginBottom: '6px', display: 'block' };

  const handleSave = async () => {
    if (!form.businessName) { setError('Business name is required'); return; }
    if (!form.contactEmail)  { setError('Contact email is required'); return; }
    setSaving(true); setError('');
    try {
      if (isNew) {
        await api.post('/tenants', form);
      } else {
        await api.put(`/tenants/${tenant._id}`, form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save client');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: '560px', background: c.surface, borderRadius: '24px', border: `1px solid ${c.border}`, padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: '900', color: c.lime }}>
            {isNew ? '+ Add Client' : `Edit — ${tenant.businessName}`}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontSize: '20px' }}>×</button>
        </div>

        {error && <div style={{ background: `${c.red}18`, border: `1px solid ${c.red}33`, borderRadius: '10px', padding: '12px 16px', color: c.red, fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

        {/* Business details */}
        <p style={{ ...labelStyle, color: c.lime, fontWeight: '600', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em', marginBottom: '12px' }}>Business Details</p>
        <label style={labelStyle}>Business Name *</label>
        <input value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="ABC Rentals" style={iStyle} />
        <label style={labelStyle}>Brand Name</label>
        <input value={form.brandName} onChange={e => set('brandName', e.target.value)} placeholder="ABC Rentals (displayed to renters)" style={iStyle} />
        <label style={labelStyle}>Contact Email *</label>
        <input value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="admin@abcrentals.co.za" style={iStyle} />
        <label style={labelStyle}>WhatsApp Number</label>
        <input value={form.whatsappNumber} onChange={e => set('whatsappNumber', e.target.value)} placeholder="whatsapp:+27821234567" style={iStyle} />

        {/* Plan & Status */}
        <p style={{ ...labelStyle, color: c.lime, fontWeight: '600', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em', marginBottom: '12px', marginTop: '8px' }}>Plan & Status</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Plan</label>
            <select value={form.plan} onChange={e => {
              set('plan', e.target.value);
              set('monthlyFee', e.target.value === 'starter' ? 950 : e.target.value === 'growth' ? 2450 : 0);
            }} style={{ ...iStyle, marginBottom: 0 }}>
              <option value="starter">Starter — R950/mo</option>
              <option value="growth">Growth — R2,450/mo</option>
              <option value="enterprise">Enterprise — Custom</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...iStyle, marginBottom: 0 }}>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Workflow */}
        <p style={{ ...labelStyle, color: c.lime, fontWeight: '600', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em', marginTop: '16px', marginBottom: '12px' }}>Workflow</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Workflow Type</label>
            <select value={form.workflowType} onChange={e => set('workflowType', e.target.value)} style={{ ...iStyle, marginBottom: 0 }}>
              <option value="basic">Basic (4 questions — no income check)</option>
              <option value="full">Full (6 questions — income check)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Monthly Fee (R)</label>
            <input type="number" value={form.monthlyFee} onChange={e => set('monthlyFee', Number(e.target.value))} style={{ ...iStyle, marginBottom: 0 }} />
          </div>
        </div>

        {/* Qualification rules */}
        <p style={{ ...labelStyle, color: c.lime, fontWeight: '600', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em', marginTop: '16px', marginBottom: '12px' }}>Qualification Rules</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Min Budget (R)</label>
            <input type="number" value={form.qualificationRules.minimumBudget} onChange={e => setRule('minimumBudget', Number(e.target.value))} style={{ ...iStyle, marginBottom: 0 }} />
          </div>
          <div>
            <label style={labelStyle}>Max Budget (R)</label>
            <input type="number" value={form.qualificationRules.maximumBudget} onChange={e => setRule('maximumBudget', Number(e.target.value))} style={{ ...iStyle, marginBottom: 0 }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', marginBottom: '8px' }}>
          <input type="checkbox" id="allowUnemployed" checked={form.qualificationRules.allowUnemployed} onChange={e => setRule('allowUnemployed', e.target.checked)} style={{ cursor: 'pointer', accentColor: c.lime, width: '16px', height: '16px' }} />
          <label htmlFor="allowUnemployed" style={{ color: c.text, fontSize: '14px', cursor: 'pointer' }}>Allow unemployed applicants</label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button onClick={onClose} style={{ padding: '12px 24px', background: 'transparent', border: `1px solid ${c.borderDim}`, color: c.muted, borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 28px', background: c.lime, color: '#050505', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
            {saving ? 'Saving...' : isNew ? 'Add Client' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Approve modal component ───────────────────────────────────
function ApproveModal({ user, tenants, onClose, onApproved }) {
  const [role,     setRole]     = useState('agent');
  const [tenantId, setTenantId] = useState(user.tenantId || '');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const PLAN_COLORS = { starter: '#7A9E6E', growth: '#B8F040', enterprise: '#C4873A' };

  const handleApprove = async () => {
    setSaving(true);
    try {
      await api.post(`/users/${user._id}/approve`, { role, tenantId: tenantId || null });
      onApproved();
    } catch (err) {
      setError(err.response?.data?.message || 'Approval failed');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ width: '100%', maxWidth: '460px', background: c.surface, borderRadius: '24px', border: `1px solid ${c.border}`, padding: '32px' }}>
      <h3 style={{ color: c.lime, marginBottom: '8px' }}>Approve User</h3>
      <p style={{ color: c.muted, fontSize: '14px', marginBottom: '4px' }}>{user.fullName} · {user.email}</p>
      {user.requestedPlan && (
        <div style={{ background: `${PLAN_COLORS[user.requestedPlan] || c.lime}12`, border: `1px solid ${PLAN_COLORS[user.requestedPlan] || c.lime}33`, borderRadius: '10px', padding: '10px 14px', margin: '12px 0', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Requested plan</p>
            <p style={{ color: PLAN_COLORS[user.requestedPlan] || c.lime, fontWeight: '700', textTransform: 'capitalize' }}>{user.requestedPlan}</p>
          </div>
          <p style={{ color: PLAN_COLORS[user.requestedPlan] || c.lime, fontWeight: '700' }}>
            {user.requestedPlan === 'starter' ? 'R950/mo' : user.requestedPlan === 'growth' ? 'R2,450/mo' : 'Custom'}
          </p>
        </div>
      )}
      {error && <p style={{ color: c.red, fontSize: '14px', marginBottom: '12px' }}>{error}</p>}
      <p style={{ color: c.muted, fontSize: '12px', marginBottom: '6px' }}>Role</p>
      <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#1C1C19', border: `1px solid ${c.borderDim}`, color: c.text, fontSize: '14px', marginBottom: '14px', outline: 'none', fontFamily: 'inherit' }}>
        <option value="agent">agent — Rental agent (tenant)</option>
        <option value="admin">admin — Agency manager (tenant)</option>
        <option value="eb_agent">eb_agent — EB Sales agent</option>
        <option value="eb_manager">eb_manager — EB Manager</option>
        <option value="borrower">borrower — Pending</option>
      </select>
      <p style={{ color: c.muted, fontSize: '12px', marginBottom: '6px' }}>
        Assign to Client
        {user.tenantId && <span style={{ color: c.lime, marginLeft: '8px' }}>· Pre-filled from invite</span>}
      </p>
      <select value={tenantId} onChange={e => setTenantId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#1C1C19', border: `1px solid ${c.borderDim}`, color: c.text, fontSize: '14px', marginBottom: '20px', outline: 'none', fontFamily: 'inherit' }}>
        <option value="">Platform level (EB staff — no tenant)</option>
        {tenants.map(t => <option key={t._id} value={t._id}>{t.businessName} ({t.plan} · {t.status})</option>)}
      </select>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '11px 22px', background: 'transparent', border: `1px solid ${c.borderDim}`, color: c.muted, borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        <button onClick={handleApprove} disabled={saving} style={{ padding: '11px 24px', background: c.lime, color: '#050505', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
          {saving ? 'Approving...' : 'Approve Access'}
        </button>
      </div>
    </div>
  );
}