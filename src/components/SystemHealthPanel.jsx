// src/components/SystemHealthPanel.jsx
//
// Everything the alerts said, on one screen.
//
// On 2026-09-11 every health fact arrived as a WhatsApp alert or had to be
// dug out with a query: the ad account unsettled for eight days, leads gone
// quiet, Pay Now falling back to a bare link for weeks, the agent paused for
// credit, a client whose number could not send, CI red.
//
// The rule this screen inherits from the API: a check whose SOURCE failed
// reads "unknown", never "ok", and the page is never green while one is
// unknown. A dashboard that goes green because a check threw is worse than
// no dashboard — it is the same silence-looks-like-success failure with a
// reassuring colour on top. So "unknown" keeps its own colour and its own
// wording, and is never folded into the healthy count.
import { colors as c } from '../utils/theme';
import { useSystemHealth } from '../hooks/useSystemHealth';

const TONE = { ok: c.emerald, warn: c.amber, alert: c.red, unknown: c.cyan };
const ICON = { ok: '✅', warn: '⚠️', alert: '🚨', unknown: '❔' };
// Worst first: the page is read top-down, and nobody scrolls past green.
const ORDER = { alert: 0, unknown: 1, warn: 2, ok: 3 };

const TITLE = {
  ads: 'Ads', quietStreams: 'Quiet streams', fallbacks: 'Quiet fallbacks', delivery: 'Delivery',
  ci: 'CI & deploy', agent: 'Sales agent', clients: 'Clients', takeovers: 'Takeovers',
};

const HEADLINE = { ok: 'All clear', alert: 'Needs attention', warn: 'Worth a look', unknown: 'Cannot tell' };

const rand = (n) => 'R' + Number(n || 0).toLocaleString('en-ZA', { maximumFractionDigits: 2 });
const time = (t) => (t ? new Date(t).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : '');

/** The rows under a section's sentence — whatever that section actually carries. */
function Detail({ section: s }) {
  const line = { fontSize: 12, color: c.muted, marginTop: 4 };

  if (s.name === 'ads') {
    return (s.accounts || []).map((a) => (
      <div key={a.adAccountId} style={line}>
        {a.tenant}: {a.accountStatus || 'not checked'}
        {a.owed > 0 && <span style={{ color: c.amber }}> · {rand(a.owed)} owed</span>}
        {a.lastSpendDay && <span> · last spend {a.lastSpendDay}</span>}
        <span> · {rand(a.spend7d)} over 7 days, {a.conversations7d} conversations started</span>
      </div>
    ));
  }
  if (s.name === 'quietStreams') {
    return (s.streams || []).map((q) => <div key={q.key} style={line}>{q.label} — quiet since {q.since}</div>);
  }
  if (s.name === 'fallbacks') {
    return (s.kinds || []).map((k) => <div key={k.kind} style={line}>{k.label} ×{k.count} — {k.lastReason}</div>);
  }
  if (s.name === 'delivery') {
    return (s.clients || []).map((d) => (
      <div key={d.tenant} style={line}>
        {d.tenant}: {d.sent} sent, {d.failed} failed ({d.failureRate}%), {d.stuck} unconfirmed
        {d.alerts?.length > 0 && <span style={{ color: c.red }}> — {d.alerts.join('; ')}</span>}
      </div>
    ));
  }
  if (s.name === 'ci') {
    return (
      <div style={line}>
        {s.lastTest ? <span>Tests {s.lastTest.result} on {s.lastTest.sha}</span> : <span>No CI result reported yet</span>}
        <span> · production runs {s.running}</span>
        {s.lastDeploy && <span> · deploy {s.lastDeploy.result} ({s.lastDeploy.sha})</span>}
      </div>
    );
  }
  if (s.name === 'agent') {
    return (
      <div style={line}>
        {s.enabled ? <span>Enabled ({s.mode})</span> : <span>Switched off</span>}
        <span> · {s.turnsToday ?? '—'} of {s.turnCap} turns today</span>
        {s.consecutiveFailures > 0 && <span style={{ color: c.amber }}> · {s.consecutiveFailures} consecutive failures</span>}
      </div>
    );
  }
  if (s.name === 'clients') {
    return (s.blocked || []).map((b) => <div key={b.tenant} style={line}>{b.tenant} ({b.status}) — {b.blocker}</div>);
  }
  if (s.name === 'takeovers') {
    return (s.owners || []).map((o) => <div key={o.owner} style={line}>{o.owner}: {o.open} of {o.cap} slots in use</div>);
  }
  return null;
}

export default function SystemHealthPanel() {
  const { data, isLoading, isError, refetch, isFetching } = useSystemHealth();

  const header = (extra) => (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: 4, color: c.text }}>System health</h1>
      <p style={{ color: c.muted, fontSize: 15 }}>Everything the alerts would tell you, in one place.</p>
      {extra}
    </div>
  );

  if (isLoading) return header(<p style={{ color: c.muted, fontSize: 13, marginTop: 10 }}>Checking…</p>);

  // A failed load is not an all-clear — the same rule the API applies to its
  // own sections, applied to the page itself.
  if (isError) {
    return header(
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12, padding: '12px 16px', background: c.red + '11', border: '1px solid ' + c.red + '33', borderRadius: 12 }}>
        <span style={{ fontSize: 13, color: c.red }}>Couldn&apos;t load system health — this is not an all-clear.</span>
        <button onClick={() => refetch?.()} style={{ padding: '5px 12px', background: c.red + '22', color: c.red, border: '1px solid ' + c.red + '44', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Retry</button>
      </div>
    );
  }

  const sections = [...(data?.sections || [])].sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9));
  const overall = data?.status || 'unknown';
  const counts = sections.reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] || 0) + 1 }), {});
  const tally = [
    counts.alert && `${counts.alert} alert`,
    counts.warn && `${counts.warn} warning`,
    counts.unknown && `${counts.unknown} unknown`,
    counts.ok && `${counts.ok} ok`,
  ].filter(Boolean).join(' · ');

  return (
    <div>
      {header(
        <div data-testid="overall" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, padding: '14px 18px', borderRadius: 12, background: TONE[overall] + '14', border: '1px solid ' + TONE[overall] + '44' }}>
          <span style={{ fontSize: 22 }}>{ICON[overall]}</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: TONE[overall] }}>{HEADLINE[overall] || overall}</div>
            <div style={{ fontSize: 12, color: c.muted }}>{tally} · checked {time(data?.checkedAt)}</div>
          </div>
          <button onClick={() => refetch?.()} style={{ marginLeft: 'auto', padding: '6px 12px', background: c.surface, color: c.muted, border: '1px solid ' + c.borderDim, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
            {isFetching ? 'Checking…' : 'Check now'}
          </button>
        </div>
      )}

      {sections.map((s) => (
        <div key={s.name} data-testid={`section-${s.name}`} style={{ background: c.card, border: '1px solid ' + (s.status === 'ok' ? c.borderDim : TONE[s.status] + '44'), borderRadius: 12, padding: '12px 16px', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
            <span>{ICON[s.status]}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{TITLE[s.name] || s.name}</span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: TONE[s.status] + '22', color: TONE[s.status], textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.status}</span>
          </div>
          <div style={{ fontSize: 13, color: s.status === 'ok' ? c.muted : c.text, marginTop: 6 }}>{s.summary}</div>
          <Detail section={s} />
        </div>
      ))}
    </div>
  );
}
