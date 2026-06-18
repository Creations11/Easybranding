// src/components/ProspectingPanel.jsx
import { useState, useEffect } from 'react';
import api from '../api';

const c = {
  card: '#121710', lime: '#B8F040', earth: '#C4873A',
  cyan: '#22d3ee', emerald: '#34d399', amber: '#fbbf24',
  red: '#f87171', orange: '#f97316', text: '#EEF0E8',
  muted: '#8A9080', border: 'rgba(184,240,64,0.12)',
  borderDim: 'rgba(255,255,255,0.06)', surface: '#0D110C',
};

export default function ProspectingPanel({ currentUser }) {
  const [prospects, setProspects] = useState([]);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [varName, setVarName] = useState('');
  const [varAgency, setVarAgency] = useState('');
  const [sendResult, setSendResult] = useState(null);
  const [activeTab, setActiveTab] = useState('contacts');
  const [filterStatus, setFilterStatus] = useState('all');
  const [msg, setMsg] = useState('');
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addAgency, setAddAgency] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const iStyle = { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', marginBottom: '10px' };

  const loadData = async () => {
    setLoading(true);
    try {
      const [pSettled, tSettled] = await Promise.allSettled([
        api.get('/prospecting'),
        api.get('/prospecting/templates'),
      ]);
      const pRes = pSettled.status === 'fulfilled' ? pSettled.value : { data: { data: {} } };
      const tRes = tSettled.status === 'fulfilled' ? tSettled.value : { data: { data: {} } };
      const allProspects = pRes.data.data?.prospects || [];
      const isAgent = currentUser?.role === 'eb_agent';
      const myProspects = isAgent
        ? allProspects.filter(p =>
            p.assignedTo?.toString() === currentUser?.id?.toString() ||
            p.createdBy?.toString() === currentUser?.id?.toString()
          )
        : allProspects;
      setProspects(myProspects);
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
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Failed')); }
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
      setMsg('✅ Added ' + added + ', skipped ' + skipped + ' duplicates');
      setTimeout(() => setMsg(''), 3000);
      loadData();
    } catch (err) { setMsg('❌ Failed to add contacts'); }
    finally { setBulkLoading(false); }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/prospecting/sync');
      setMsg('✅ ' + res.data.message);
      setTimeout(() => setMsg(''), 3000);
      loadData();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Sync failed')); }
    finally { setSyncing(false); }
  };

  const handleSend = async () => {
    if (!selectedIds.length) { setMsg('❌ Select at least one contact'); return; }
    if (!selectedTemplate) { setMsg('❌ Select a template'); return; }
    setSending(true); setSendResult(null); setMsg('');
    try {
      const res = await api.post('/prospecting/send', {
        prospectIds: selectedIds,
        templateKey: selectedTemplate,
        variables: { name: varName || '', agency: varAgency || '' },
      });
      const results = res.data.data?.results || { sent: 0, failed: 0 };
      setSendResult(results);
      setSelectedIds([]);
      setMsg('✅ Sent ' + results.sent + ' messages' + (results.failed > 0 ? ', ' + results.failed + ' failed' : ''));
      setTimeout(() => setMsg(''), 5000);
      loadData();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || err.message || 'Send failed'));
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
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '900', marginBottom: '4px' }}>
            {currentUser?.role === 'eb_agent' ? 'My Prospecting' : 'Prospecting'}
          </h1>
          <p style={{ color: c.muted, fontSize: '15px' }}>Send approved WhatsApp templates to rental agencies</p>
        </div>
        {currentUser?.role !== 'eb_agent' && (
          <button onClick={handleSync} disabled={syncing} style={{ padding: '10px 20px', background: c.cyan + '22', color: c.cyan, border: '1px solid ' + c.cyan + '33', borderRadius: '10px', cursor: syncing ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit', opacity: syncing ? 0.7 : 1 }}>
            {syncing ? '⏳ Syncing...' : '🔄 Sync Google Sheets'}
          </button>
        )}
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '24px' }}>
          {[
            { l: 'Total', v: stats.total, c2: c.text },
            { l: 'Pending', v: stats.pending, c2: c.muted },
            { l: 'Sent', v: stats.sent, c2: c.cyan },
            { l: 'Replied', v: stats.replied, c2: c.lime },
            { l: 'Not Interested', v: stats.notInterested, c2: c.red },
            { l: 'Converted', v: stats.converted, c2: c.emerald },
          ].map(s => (
            <div key={s.l} style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ color: c.muted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{s.l}</p>
              <p style={{ fontSize: '24px', fontWeight: '800', color: s.c2, fontFamily: "'Fraunces', serif" }}>{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {msg && <div style={{ background: msg.startsWith('✅') ? c.lime + '18' : c.red + '18', border: '1px solid ' + (msg.startsWith('✅') ? c.lime : c.red) + '33', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', color: msg.startsWith('✅') ? c.lime : c.red, fontSize: '14px' }}>{msg}</div>}

      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid ' + c.borderDim, marginBottom: '24px' }}>
        {['contacts', 'add', 'send'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === t ? '2px solid ' + c.lime : '2px solid transparent', color: activeTab === t ? c.lime : c.muted, cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === t ? '600' : '400', marginBottom: '-1px', textTransform: 'capitalize', fontFamily: 'inherit' }}>{t === 'add' ? 'Add Contacts' : t === 'send' ? 'Send Messages' : 'Contact List'}</button>
        ))}
      </div>

      {activeTab === 'contacts' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {['all', 'pending', 'sent', 'replied', 'not_interested', 'converted'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: filterStatus === s ? c.lime : 'rgba(255,255,255,0.06)', color: filterStatus === s ? '#050505' : c.muted, fontWeight: filterStatus === s ? '700' : '400', textTransform: 'capitalize', fontSize: '12px', fontFamily: 'inherit' }}>{s.replace(/_/g, ' ')}</button>
            ))}
          </div>
          {filteredProspects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}>
              <p style={{ fontSize: '40px', marginBottom: '16px' }}>📋</p>
              <p>No contacts yet. Add some using the Add Contacts tab.</p>
            </div>
          ) : filteredProspects.map(p => (
            <div key={p._id} style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '12px', padding: '14px 18px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {p.status === 'pending' && (
                  <input type="checkbox" checked={selectedIds.includes(p._id)} onChange={() => setSelectedIds(prev => prev.includes(p._id) ? prev.filter(id => id !== p._id) : [...prev, p._id])} style={{ cursor: 'pointer' }} />
                )}
                <div>
                  <strong style={{ fontSize: '14px' }}>{p.name !== 'Unknown' ? p.name : p.phone}</strong>
                  <p style={{ color: c.muted, fontSize: '12px', marginTop: '2px' }}>{p.phone}{p.agencyName ? ' · ' + p.agencyName : ''}</p>
                  {p.replyText && <p style={{ color: c.text, fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>"{p.replyText}"</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: (STATUS_COLORS[p.status] || c.muted) + '22', color: STATUS_COLORS[p.status] || c.muted, fontWeight: '600' }}>{p.status?.replace(/_/g, ' ')}</span>
                {p.outcome && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: c.earth + '22', color: c.earth }}>{p.outcome?.replace(/_/g, ' ')}</span>}
                {p.sentAt && <span style={{ fontSize: '11px', color: c.muted }}>{new Date(p.sentAt).toLocaleDateString('en-ZA')}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'add' && (
        <div style={{ display: 'grid', gridTemplateColumns: currentUser?.role === 'eb_agent' ? '1fr' : '1fr 1fr', gap: '20px' }}>
          <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: c.lime }}>➕ Single Contact</h3>
            <input value={addPhone} onChange={e => setAddPhone(e.target.value)} placeholder="+27821234567 *" style={iStyle} />
            <input value={addName} onChange={e => setAddName(e.target.value)} placeholder="Contact name" style={iStyle} />
            <input value={addAgency} onChange={e => setAddAgency(e.target.value)} placeholder="Agency name" style={iStyle} />
            <button onClick={handleAddSingle} disabled={addLoading || !addPhone} style={{ width: '100%', padding: '12px', background: addPhone ? c.lime : c.lime + '44', color: '#050505', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: addPhone ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              {addLoading ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
          {currentUser?.role !== 'eb_agent' && (
          <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: c.cyan }}>📋 Paste List</h3>
            <p style={{ color: c.muted, fontSize: '12px', marginBottom: '12px' }}>One per line: +27821234567, Name, Agency</p>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={'+27821234567, John Smith, ABC Rentals\n+27731234567, Sarah Jones, Sunset Properties'} rows={6} style={{ ...iStyle, resize: 'vertical' }} />
            <button onClick={handleBulkAdd} disabled={bulkLoading || !bulkText.trim()} style={{ width: '100%', padding: '12px', background: bulkText.trim() ? c.cyan : c.cyan + '44', color: '#050505', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: bulkText.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              {bulkLoading ? 'Adding...' : 'Add All Contacts'}
            </button>
          </div>
          )}
        </div>
      )}

      {activeTab === 'send' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '14px', padding: '24px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Select Template</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {templates.map(t => (
                  <button key={t.key} onClick={() => setSelectedTemplate(t.key)} style={{ padding: '12px 16px', background: selectedTemplate === t.key ? c.lime + '18' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (selectedTemplate === t.key ? c.lime : c.borderDim), borderRadius: '10px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    <p style={{ color: selectedTemplate === t.key ? c.lime : c.text, fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>{t.name}</p>
                    <p style={{ color: c.muted, fontSize: '12px' }}>Variables: {t.variables.join(', ')}</p>
                  </button>
                ))}
              </div>
              {currentTemplate?.variables.includes('name') && <input value={varName} onChange={e => setVarName(e.target.value)} placeholder="Default name (if not in contact)" style={iStyle} />}
              {currentTemplate?.variables.includes('agency') && <input value={varAgency} onChange={e => setVarAgency(e.target.value)} placeholder="Default agency name" style={iStyle} />}
            </div>
            {currentTemplate && (
              <div style={{ background: c.surface, border: '1px solid ' + c.borderDim, borderRadius: '12px', padding: '16px' }}>
                <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Preview</p>
                <p style={{ color: c.text, fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {typeof currentTemplate.preview === 'function'
                    ? currentTemplate.preview({ name: varName || '[Name]', agency: varAgency || '[Agency]' })
                    : (currentTemplate.preview || '').replace(/\[Name\]/g, varName || '[Name]').replace(/\[Agency\]/g, varAgency || '[Agency]')
                  }
                </p>
              </div>
            )}
          </div>
          <div>
            <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '14px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{selectedIds.length > 0 ? selectedIds.length + ' selected' : 'Select contacts'}</h3>
                <button onClick={handleSelectAll} style={{ padding: '6px 14px', background: c.lime + '22', color: c.lime, border: '1px solid ' + c.border, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                  {selectedIds.length === prospects.filter(p => p.status === 'pending').length && prospects.filter(p => p.status === 'pending').length > 0 ? 'Deselect All' : 'Select All Pending'}
                </button>
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '16px', borderRadius: '10px', border: '1px solid ' + c.borderDim }}>
                {prospects.filter(p => p.status === 'pending').length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: c.muted, fontSize: '13px' }}>No pending contacts. Add contacts first.</div>
                ) : prospects.filter(p => p.status === 'pending').map(p => (
                  <div key={p._id} onClick={() => setSelectedIds(prev => prev.includes(p._id) ? prev.filter(id => id !== p._id) : [...prev, p._id])}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: '1px solid ' + c.borderDim, cursor: 'pointer', background: selectedIds.includes(p._id) ? c.lime + '08' : 'transparent' }}>
                    <input type="checkbox" checked={selectedIds.includes(p._id)} onChange={() => {}} style={{ cursor: 'pointer', accentColor: c.lime }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: c.text }}>{p.name !== 'Unknown' ? p.name : p.phone}</p>
                      <p style={{ fontSize: '11px', color: c.muted }}>{p.phone}{p.agencyName ? ' · ' + p.agencyName : ''}</p>
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
                background: selectedIds.length && selectedTemplate ? c.lime : c.lime + '44',
                color: '#050505', border: 'none', borderRadius: '12px',
                fontWeight: '700', fontSize: '15px',
                cursor: selectedIds.length && selectedTemplate ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', marginBottom: '12px',
              }}>
                {sending ? '⏳ Sending...' : selectedIds.length ? '📤 Send to ' + selectedIds.length + ' contacts' : '📤 Select contacts above'}
              </button>
              {sendResult && (
                <div style={{ background: c.lime + '08', border: '1px solid ' + c.border, borderRadius: '10px', padding: '14px' }}>
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