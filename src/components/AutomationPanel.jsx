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

export default function AutomationPanel() {
  const [agents, setAgents] = useState(null);
  const [flows, setFlows] = useState(null);
  const [error, setError] = useState(null);

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
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <ConfigFlag ok={!!a.bookingUrl} label="booking link" />
            <ConfigFlag ok={!!a.reengagementTemplateSid} label="re-engagement template" />
          </div>
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
      <h3 style={{ color: c.text, margin: '20px 0 12px', fontSize: '16px' }}>⚙️ Workflow Engine</h3>
      {flows.length === 0 && (
        <div style={{ ...card, color: c.muted }}>No flows published yet.</div>
      )}
      {flows.length > 0 && (
        <div style={{ ...card, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['Flow', 'Status', 'Trigger', 'Nodes', 'Active', 'Today ✓/✗', 'Recent'].map((h) => (
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
