// src/components/AutomationPanel.jsx
// ─────────────────────────────────────────────────────────────
// Super-admin view over the Phase 4/5 automation: AI sales agents
// (mode, pipeline, shadow drafts, config completeness) and the
// workflow engine (flows, runs, daily metrics). Reads the two
// endpoints added 2026-07-18:
//   GET /admin-ops/automation/agents
//   GET /admin-ops/automation/flows
// Styling follows WhatsAppStatus.jsx's local palette convention.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import api from '../api';

const c = {
  card: '#121710', surface: '#0D110C', lime: '#B8F040',
  cyan: '#22d3ee', emerald: '#34d399', amber: '#fbbf24',
  red: '#f87171', text: '#EEF0E8', muted: '#8A9080',
  borderDim: 'rgba(255,255,255,0.06)',
};

const pill = (bg, color) => ({
  display: 'inline-block', padding: '2px 10px', borderRadius: '99px',
  fontSize: '11px', fontWeight: 700, background: bg, color, letterSpacing: '0.04em',
});

const card = {
  background: c.card, border: '1px solid ' + c.borderDim,
  borderRadius: '14px', padding: '16px', marginBottom: '16px',
};

function ModePill({ mode, pausedUntil }) {
  const paused = pausedUntil && new Date(pausedUntil) > new Date();
  if (paused) return <span style={pill('rgba(248,113,113,0.15)', c.red)}>PAUSED</span>;
  if (mode === 'live') return <span style={pill('rgba(52,211,153,0.15)', c.emerald)}>LIVE</span>;
  return <span style={pill('rgba(251,191,36,0.15)', c.amber)}>SHADOW</span>;
}

function ConfigFlag({ ok, label }) {
  return (
    <span style={{ fontSize: '12px', color: ok ? c.emerald : c.amber }}>
      {ok ? '✓' : '⚠'} {label}
    </span>
  );
}

const input = {
  width: '100%', background: c.surface, border: '1px solid ' + c.borderDim,
  borderRadius: '8px', padding: '8px 10px', color: c.text, fontSize: '13px',
  fontFamily: 'inherit', marginBottom: '8px', boxSizing: 'border-box',
};
const btn = (bg, color) => ({
  padding: '7px 14px', background: bg, color, border: 'none', borderRadius: '8px',
  fontWeight: 700, fontSize: '12px', cursor: 'pointer', marginRight: '8px',
});

// ── Agent config editor (PUT /admin-ops/automation/agents/:tenantId) ──
function AgentConfigEditor({ agent, onSaved }) {
  const [form, setForm] = useState({
    mode: agent.mode, bookingUrl: agent.bookingUrl || '',
    description: '', policies: '', catalogJson: '', faqJson: '',
  });
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setMsg('');
    const body = { mode: form.mode, bookingUrl: form.bookingUrl || undefined };
    if (form.description) body.description = form.description;
    if (form.policies) body.policies = form.policies;
    try {
      if (form.catalogJson) body.catalog = JSON.parse(form.catalogJson);
      if (form.faqJson) body.faq = JSON.parse(form.faqJson);
    } catch { setMsg('❌ Catalog/FAQ must be valid JSON'); return; }
    try {
      await api.put(`/admin-ops/automation/agents/${agent.tenantId}`, body);
      setMsg('✅ Saved'); onSaved();
    } catch (e) { setMsg('❌ ' + (e.response?.data?.message || 'Save failed')); }
  };

  return (
    <div style={{ background: c.surface, borderRadius: '10px', padding: '12px', marginTop: '10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
        <select value={form.mode} onChange={set('mode')} style={input}>
          <option value="shadow">shadow (drafts only)</option>
          <option value="live">live (answers customers)</option>
        </select>
        <input placeholder="Booking link (Calendly etc.)" value={form.bookingUrl} onChange={set('bookingUrl')} style={input} />
      </div>
      <textarea placeholder="Business description (blank = keep current)" value={form.description} onChange={set('description')} rows={2} style={input} />
      <textarea placeholder="Policies — delivery, payment, hours (blank = keep current)" value={form.policies} onChange={set('policies')} rows={2} style={input} />
      <textarea placeholder='Catalog JSON, e.g. [{"name":"Plan A","category":"sub","price":99,"description":"..."}] (blank = keep current)' value={form.catalogJson} onChange={set('catalogJson')} rows={3} style={{ ...input, fontFamily: 'monospace' }} />
      <textarea placeholder='FAQ JSON, e.g. [{"q":"Delivery?","a":"5 days"}] (blank = keep current)' value={form.faqJson} onChange={set('faqJson')} rows={2} style={{ ...input, fontFamily: 'monospace' }} />
      <button onClick={save} style={btn(c.lime, '#080A06')}>Save config</button>
      {msg && <span style={{ fontSize: '12px', color: msg.startsWith('✅') ? c.emerald : c.red }}>{msg}</span>}
    </div>
  );
}

// ── Flow builder (POST/PUT /admin-ops/automation/flows) ──────
const FLOW_TEMPLATE = JSON.stringify({
  n1: { type: 'send_message', config: { body: 'Hi {{name}}! Want to hear more? Reply YES or NO.' }, next: 'n2' },
  n2: { type: 'wait_for_reply', config: { timeoutHours: 24, onTimeout: 'n_end' }, next: 'n3' },
  n3: { type: 'decision', config: { branches: [{ when: { var: 'reply', matches: '^yes' }, next: 'n_yes' }], default: 'n_end' } },
  n_yes: { type: 'send_message', config: { body: 'Great — tell me what you need!' }, next: 'n_end' },
  n_end: { type: 'end', config: { outcome: 'done' } },
}, null, 2);

function FlowEditor({ tenants, existing, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: existing?.name || '',
    tenantId: existing?.tenantId || tenants[0]?.tenantId || '',
    keywords: existing ? '' : 'hello',
    entryNodeId: 'n1',
    nodesJson: FLOW_TEMPLATE,
  });
  const [errors, setErrors] = useState([]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setErrors([]);
    let nodes;
    try { nodes = JSON.parse(form.nodesJson); } catch { setErrors(['Nodes must be valid JSON']); return; }
    const body = {
      tenantId: form.tenantId, name: form.name, entryNodeId: form.entryNodeId, nodes,
      trigger: { type: 'inbound_keyword', config: { keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean) } },
    };
    try {
      if (existing) await api.put(`/admin-ops/automation/flows/${existing.flowId}`, body);
      else await api.post('/admin-ops/automation/flows', body);
      onSaved();
    } catch (e) {
      setErrors(e.response?.data?.errors || [e.response?.data?.message || 'Save failed']);
    }
  };

  return (
    <div style={{ ...card, borderColor: c.cyan + '44' }}>
      <strong style={{ color: c.text }}>{existing ? `Edit "${existing.name}" (v${existing.version} → v${existing.version + 1})` : 'New flow'}</strong>
      {existing?.activeRuns > 0 && (
        <div style={{ color: c.amber, fontSize: '12px', margin: '6px 0' }}>⚠ {existing.activeRuns} run(s) in flight read the live definition — edits affect them.</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '10px', marginTop: '10px' }}>
        <input placeholder="Flow name" value={form.name} onChange={set('name')} style={input} />
        <select value={form.tenantId} onChange={set('tenantId')} style={input}>
          {tenants.map((t) => <option key={t.tenantId} value={t.tenantId}>{t.businessName}</option>)}
        </select>
        <input placeholder="entry node" value={form.entryNodeId} onChange={set('entryNodeId')} style={input} />
      </div>
      <input placeholder="Trigger keywords, comma-separated" value={form.keywords} onChange={set('keywords')} style={input} />
      <textarea value={form.nodesJson} onChange={set('nodesJson')} rows={14} style={{ ...input, fontFamily: 'monospace', fontSize: '12px' }} />
      {errors.length > 0 && (
        <div style={{ color: c.red, fontSize: '12px', marginBottom: '8px' }}>{errors.map((e, i) => <div key={i}>• {e}</div>)}</div>
      )}
      <button onClick={save} style={btn(c.lime, '#080A06')}>{existing ? 'Save new version' : 'Create draft'}</button>
      <button onClick={onCancel} style={btn('transparent', c.muted)}>Cancel</button>
    </div>
  );
}

export default function AutomationPanel() {
  const [agents, setAgents] = useState(null);
  const [flows, setFlows] = useState(null);
  const [error, setError] = useState(null);
  const [configOpen, setConfigOpen] = useState(null); // tenantId
  const [flowEditor, setFlowEditor] = useState(null); // 'new' | flow object

  const flowAction = async (flowId, action) => {
    try { await api.post(`/admin-ops/automation/flows/${flowId}/${action}`); fetchAll(); }
    catch (e) { alert((e.response?.data?.errors || [e.response?.data?.message || 'Action failed']).join('\n')); }
  };

  const fetchAll = async () => {
    try {
      const [a, f] = await Promise.all([
        api.get('/admin-ops/automation/agents'),
        api.get('/admin-ops/automation/flows'),
      ]);
      setAgents(a.data.data || []);
      setFlows(f.data.data || []);
      setError(null);
    } catch {
      setError('Could not load automation data');
    }
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 30_000);
    return () => clearInterval(t);
  }, []);

  if (error) return <div style={{ ...card, color: c.red }}>{error}</div>;
  if (!agents || !flows) return <div style={{ ...card, color: c.muted }}>Loading automation…</div>;

  return (
    <div>
      {/* ── AI Sales Agents ─────────────────────────────────── */}
      <h3 style={{ color: c.text, margin: '0 0 12px', fontSize: '16px' }}>🤖 AI Sales Agents</h3>
      {agents.length === 0 && (
        <div style={{ ...card, color: c.muted }}>No tenants have the AI sales agent enabled yet.</div>
      )}
      {agents.map((a) => (
        <div key={a.tenantId} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <strong style={{ color: c.text }}>{a.businessName}</strong>
            <ModePill mode={a.mode} pausedUntil={a.pausedUntil} />
          </div>
          <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', margin: '10px 0', color: c.muted, fontSize: '13px' }}>
            <span>🔥 <b style={{ color: c.text }}>{a.pipeline.hot}</b> hot</span>
            <span>☀️ <b style={{ color: c.text }}>{a.pipeline.warm}</b> warm</span>
            <span>❄️ <b style={{ color: c.text }}>{a.pipeline.cool}</b> cool</span>
            <span>✖️ <b style={{ color: c.text }}>{a.pipeline.lost}</b> lost</span>
            <span>Catalog: <b style={{ color: c.text }}>{a.catalogSize}</b></span>
            <span>Failures: <b style={{ color: a.consecutiveFailures ? c.red : c.emerald }}>{a.consecutiveFailures}</b></span>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'center' }}>
            <ConfigFlag ok={!!a.bookingUrl} label="booking link" />
            <ConfigFlag ok={!!a.reengagementTemplateSid} label="re-engagement template" />
            <button onClick={() => setConfigOpen(configOpen === a.tenantId ? null : a.tenantId)} style={btn('transparent', c.cyan)}>
              {configOpen === a.tenantId ? 'Close config ▲' : 'Configure ▼'}
            </button>
          </div>
          {configOpen === a.tenantId && <AgentConfigEditor agent={a} onSaved={fetchAll} />}
          {(a.recentShadowDrafts || []).slice(0, 3).map((d, i) => (
            <div key={i} style={{ background: c.surface, borderLeft: '3px solid ' + c.cyan, borderRadius: '8px', padding: '8px 12px', margin: '6px 0' }}>
              <div style={{ color: c.text, fontSize: '13px', fontWeight: 600 }}>
                {d.lead} <span style={{ color: c.muted, fontWeight: 400 }}>· {d.stage || 'greeting'} · {d.intent || '–'}</span>
              </div>
              {(d.latest || []).slice(-1).map((x, j) => (
                <div key={j} style={{ color: c.muted, fontSize: '12px', marginTop: '4px' }}>
                  “{(x.draft || '(no draft)').slice(0, 160)}”
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      {/* ── Workflow Engine ─────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 12px' }}>
        <h3 style={{ color: c.text, margin: 0, fontSize: '16px' }}>⚙️ Workflow Engine</h3>
        <button onClick={() => setFlowEditor(flowEditor === 'new' ? null : 'new')} style={btn(c.lime, '#080A06')}>
          {flowEditor === 'new' ? 'Cancel' : '+ New flow'}
        </button>
      </div>
      {flowEditor && (
        <FlowEditor
          tenants={agents}
          existing={flowEditor === 'new' ? null : flowEditor}
          onSaved={() => { setFlowEditor(null); fetchAll(); }}
          onCancel={() => setFlowEditor(null)}
        />
      )}
      {flows.length === 0 && (
        <div style={{ ...card, color: c.muted }}>No flows yet — create one above.</div>
      )}
      {flows.length > 0 && (
        <div style={{ ...card, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['Flow', 'Status', 'Trigger', 'Nodes', 'Active', 'Today ✓/✗', 'Recent', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '7px 10px', color: c.muted, borderBottom: '1px solid ' + c.borderDim }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flows.map((f) => {
                const paused = f.pausedUntil && new Date(f.pausedUntil) > new Date();
                return (
                  <tr key={f.flowId}>
                    <td style={{ padding: '7px 10px', color: c.text, borderBottom: '1px solid ' + c.borderDim }}>
                      <b>{f.name}</b> <span style={{ color: c.muted }}>v{f.version}</span>
                    </td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid ' + c.borderDim }}>
                      {paused
                        ? <span style={pill('rgba(248,113,113,0.15)', c.red)}>PAUSED</span>
                        : <span style={pill(f.status === 'published' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)', f.status === 'published' ? c.emerald : c.amber)}>{f.status.toUpperCase()}</span>}
                    </td>
                    <td style={{ padding: '7px 10px', color: c.muted, borderBottom: '1px solid ' + c.borderDim }}>{f.trigger || '—'}</td>
                    <td style={{ padding: '7px 10px', color: c.text, borderBottom: '1px solid ' + c.borderDim }}>{f.nodeCount}</td>
                    <td style={{ padding: '7px 10px', color: c.text, borderBottom: '1px solid ' + c.borderDim }}>{f.activeRuns}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid ' + c.borderDim }}>
                      <span style={{ color: c.emerald }}>{f.today.completed}</span>
                      <span style={{ color: c.muted }}>/</span>
                      <span style={{ color: f.today.failed ? c.red : c.muted }}>{f.today.failed}</span>
                      <span style={{ color: c.muted }}> of {f.today.started}</span>
                    </td>
                    <td style={{ padding: '7px 10px', color: c.muted, borderBottom: '1px solid ' + c.borderDim }}>
                      {(f.recentRuns || []).slice(0, 3).map((r) => r.status + (r.outcome ? `(${r.outcome})` : '')).join(', ') || '—'}
                    </td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid ' + c.borderDim, whiteSpace: 'nowrap' }}>
                      <button onClick={() => setFlowEditor(f)} style={btn('transparent', c.cyan)}>Edit</button>
                      {f.status === 'draft' && <button onClick={() => flowAction(f.flowId, 'publish')} style={btn('transparent', c.emerald)}>Publish</button>}
                      {f.status === 'published' && !paused && <button onClick={() => flowAction(f.flowId, 'pause')} style={btn('transparent', c.amber)}>Pause</button>}
                      {paused && <button onClick={() => flowAction(f.flowId, 'resume')} style={btn('transparent', c.emerald)}>Resume</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
