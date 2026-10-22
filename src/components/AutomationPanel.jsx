// src/components/AutomationPanel.jsx
// ─────────────────────────────────────────────────────────────
// Super-admin view over the Phase 4/5 automation: AI sales agents
// (mode, pipeline, shadow drafts, config completeness) and the
// workflow engine (flows, runs, daily metrics). Reads the two
// endpoints added 2026-07-18:
//   GET /admin-ops/automation/agents
//   GET /admin-ops/automation/flows
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import api from '../api';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { Input, Select, Textarea } from './ui/Field';
import DataTable, { Th, Td } from './ui/DataTable';

const card = 'mb-4 rounded-[14px] border border-edge bg-card p-4';

function ModePill({ mode, pausedUntil }) {
  const paused = pausedUntil && new Date(pausedUntil) > new Date();
  if (paused) return <Badge tone="bad" mono>PAUSED</Badge>;
  if (mode === 'live') return <Badge tone="good" mono>LIVE</Badge>;
  return <Badge tone="warn" mono>SHADOW</Badge>;
}

function ConfigFlag({ ok, label }) {
  return (
    <span className={`text-xs ${ok ? 'text-emerald' : 'text-amber'}`}>
      {ok ? '✓' : '⚠'} {label}
    </span>
  );
}

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
    <div className="mt-2.5 rounded-[10px] bg-surface p-3">
      <div className="grid grid-cols-[1fr_2fr] gap-2.5 max-sm:grid-cols-1">
        <Select value={form.mode} onChange={set('mode')} aria-label="Mode" className="mb-2 bg-ground">
          <option value="shadow">shadow (drafts only)</option>
          <option value="live">live (answers customers)</option>
        </Select>
        <Input placeholder="Booking link (Calendly etc.)" value={form.bookingUrl} onChange={set('bookingUrl')} className="mb-2 bg-ground" />
      </div>
      <Textarea placeholder="Business description (blank = keep current)" value={form.description} onChange={set('description')} rows={2} className="mb-2 bg-ground" />
      <Textarea placeholder="Policies — delivery, payment, hours (blank = keep current)" value={form.policies} onChange={set('policies')} rows={2} className="mb-2 bg-ground" />
      <Textarea mono placeholder='Catalog JSON, e.g. [{"name":"Plan A","category":"sub","price":99,"description":"..."}] (blank = keep current)' value={form.catalogJson} onChange={set('catalogJson')} rows={3} className="mb-2 bg-ground" />
      <Textarea mono placeholder='FAQ JSON, e.g. [{"q":"Delivery?","a":"5 days"}] (blank = keep current)' value={form.faqJson} onChange={set('faqJson')} rows={2} className="mb-2 bg-ground" />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={save}>Save config</Button>
        {msg && <span className={`text-xs ${msg.startsWith('✅') ? 'text-emerald' : 'text-red'}`}>{msg}</span>}
      </div>
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
    <div className={`${card} border-cyan/25`}>
      <strong className="text-ink">{existing ? `Edit "${existing.name}" (v${existing.version} → v${existing.version + 1})` : 'New flow'}</strong>
      {existing?.activeRuns > 0 && (
        <div className="my-1.5 text-xs text-amber">⚠ {existing.activeRuns} run(s) in flight read the live definition — edits affect them.</div>
      )}
      <div className="mt-2.5 grid grid-cols-[2fr_2fr_1fr] gap-2.5 max-sm:grid-cols-1">
        <Input mono={false} placeholder="Flow name" value={form.name} onChange={set('name')} aria-label="Flow name" className="mb-2 bg-surface" />
        <Select value={form.tenantId} onChange={set('tenantId')} aria-label="Client" className="mb-2 bg-surface">
          {tenants.map((t) => <option key={t.tenantId} value={t.tenantId}>{t.businessName}</option>)}
        </Select>
        <Input placeholder="entry node" value={form.entryNodeId} onChange={set('entryNodeId')} aria-label="Entry node" className="mb-2 bg-surface" />
      </div>
      <Input mono={false} placeholder="Trigger keywords, comma-separated" value={form.keywords} onChange={set('keywords')} aria-label="Trigger keywords" className="mb-2 bg-surface" />
      <Textarea mono value={form.nodesJson} onChange={set('nodesJson')} rows={14} aria-label="Flow nodes (JSON)" className="mb-2 bg-surface" />
      {errors.length > 0 && (
        <div className="mb-2 text-xs text-red">{errors.map((e, i) => <div key={i}>• {e}</div>)}</div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={save}>{existing ? 'Save new version' : 'Create draft'}</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
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

  // Lifts a pause; live or shadow stays as it was. If the AI account is still
  // out of credit, the agent pauses itself again on its first failure, so the
  // confirmation says to top up first.
  const resumeAgent = async (agent) => {
    if (!window.confirm(`Resume ${agent.businessName}'s sales agent now?\n\nIf it paused for lack of AI credit, top up first, or it pauses again on the next message.`)) return;
    try { await api.post(`/admin-ops/automation/agents/${agent.tenantId}/resume`); fetchAll(); }
    catch (e) { alert(e.response?.data?.message || 'Resume failed. Nothing was changed.'); }
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

  if (error) return <div className={`${card} text-red`}>{error}</div>;
  if (!agents || !flows) return <div className={`${card} text-muted`}>Loading automation…</div>;

  return (
    <div>
      {/* ── AI Sales Agents ─────────────────────────────────── */}
      <h3 className="mb-3 text-base text-ink">🤖 AI Sales Agents</h3>
      {agents.length === 0 && (
        <div className={`${card} text-muted`}>No tenants have the AI sales agent enabled yet.</div>
      )}
      {agents.map((a) => (
        <div key={a.tenantId} className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-ink">{a.businessName}</strong>
            <span className="flex items-center gap-2">
              <ModePill mode={a.mode} pausedUntil={a.pausedUntil} />
              {/* The agent pauses itself (a day when out of AI credit). Until
                  2026-10-08 nothing here could lift it. */}
              {a.pausedUntil && new Date(a.pausedUntil) > new Date() && (
                <Button variant="good" onClick={() => resumeAgent(a)}>Resume</Button>
              )}
            </span>
          </div>
          {a.pausedUntil && new Date(a.pausedUntil) > new Date() && (
            <div className="mt-1.5 text-xs text-muted">
              Paused until {new Date(a.pausedUntil).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' })}. Customers get the rule-based flow meanwhile.
            </div>
          )}
          <div className="my-2.5 flex flex-wrap gap-[18px] text-[13px] text-muted">
            <span>🔥 <b className="font-mono tabular-nums text-ink">{a.pipeline.hot}</b> hot</span>
            <span>☀️ <b className="font-mono tabular-nums text-ink">{a.pipeline.warm}</b> warm</span>
            <span>❄️ <b className="font-mono tabular-nums text-ink">{a.pipeline.cool}</b> cool</span>
            <span>✖️ <b className="font-mono tabular-nums text-ink">{a.pipeline.lost}</b> lost</span>
            <span>Catalog: <b className="font-mono tabular-nums text-ink">{a.catalogSize}</b></span>
            <span>Failures: <b className={`font-mono tabular-nums ${a.consecutiveFailures ? 'text-red' : 'text-emerald'}`}>{a.consecutiveFailures}</b></span>
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-4">
            <ConfigFlag ok={!!a.bookingUrl} label="booking link" />
            <ConfigFlag ok={!!a.reengagementTemplateSid} label="re-engagement template" />
            <Button variant="system" onClick={() => setConfigOpen(configOpen === a.tenantId ? null : a.tenantId)}>
              {configOpen === a.tenantId ? 'Close config ▲' : 'Configure ▼'}
            </Button>
          </div>
          {configOpen === a.tenantId && <AgentConfigEditor agent={a} onSaved={fetchAll} />}
          {(a.recentShadowDrafts || []).slice(0, 3).map((d, i) => (
            <div key={i} className="my-1.5 rounded-lg border-l-[3px] border-cyan bg-surface px-3 py-2">
              <div className="text-[13px] font-semibold text-ink">
                {d.lead} <span className="font-normal text-muted">· {d.stage || 'greeting'} · {d.intent || '–'}</span>
              </div>
              {(d.latest || []).slice(-1).map((x, j) => (
                <div key={j} className="mt-1 text-xs text-muted">
                  “{(x.draft || '(no draft)').slice(0, 160)}”
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      {/* ── Workflow Engine ─────────────────────────────────── */}
      <div className="mt-5 mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base text-ink">⚙️ Workflow Engine</h3>
        <Button variant="primary" onClick={() => setFlowEditor(flowEditor === 'new' ? null : 'new')}>
          {flowEditor === 'new' ? 'Cancel' : '+ New flow'}
        </Button>
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
        <div className={`${card} text-muted`}>No flows yet — create one above.</div>
      )}
      {flows.length > 0 && (
        <div className={card}>
          <DataTable minWidth={760}>
            <thead>
              <tr>
                {['Flow', 'Status', 'Trigger', 'Nodes', 'Active', 'Today ✓/✗', 'Recent', 'Actions'].map((h) => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {flows.map((f) => {
                const paused = f.pausedUntil && new Date(f.pausedUntil) > new Date();
                return (
                  <tr key={f.flowId}>
                    <Td className="text-ink"><b>{f.name}</b> <span className="font-mono text-muted">v{f.version}</span></Td>
                    <Td>
                      {paused
                        ? <Badge tone="bad" mono>PAUSED</Badge>
                        : <Badge tone={f.status === 'published' ? 'good' : 'warn'} mono>{f.status.toUpperCase()}</Badge>}
                    </Td>
                    <Td className="text-muted">{f.trigger || '—'}</Td>
                    <Td mono className="text-ink">{f.nodeCount}</Td>
                    <Td mono className="text-ink">{f.activeRuns}</Td>
                    <Td mono>
                      <span className="text-emerald">{f.today.completed}</span>
                      <span className="text-muted">/</span>
                      <span className={f.today.failed ? 'text-red' : 'text-muted'}>{f.today.failed}</span>
                      <span className="text-muted"> of {f.today.started}</span>
                    </Td>
                    <Td className="text-muted">
                      {(f.recentRuns || []).slice(0, 3).map((r) => r.status + (r.outcome ? `(${r.outcome})` : '')).join(', ') || '—'}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <span className="flex gap-1.5">
                        <Button variant="system" onClick={() => setFlowEditor(f)}>Edit</Button>
                        {f.status === 'draft' && <Button variant="good" onClick={() => flowAction(f.flowId, 'publish')}>Publish</Button>}
                        {f.status === 'published' && !paused && <Button variant="warn" onClick={() => flowAction(f.flowId, 'pause')}>Pause</Button>}
                        {paused && <Button variant="good" onClick={() => flowAction(f.flowId, 'resume')}>Resume</Button>}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        </div>
      )}
    </div>
  );
}
