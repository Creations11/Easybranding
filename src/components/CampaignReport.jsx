// src/components/CampaignReport.jsx
//
// What marketing went out, and who should get it next.
//
// Both halves are computed on the server by services/campaignEligibility.js —
// the same module the sender itself uses. This component deliberately does no
// filtering of its own: the moment the dashboard decides who is sendable, it
// starts disagreeing with what actually sends, and it looks authoritative
// while doing it.
import { useState, useEffect } from 'react';
import api from '../api';

const c = {
  card: '#121710', lime: '#B8F040', earth: '#C4873A',
  cyan: '#22d3ee', emerald: '#34d399', amber: '#fbbf24',
  red: '#f87171', orange: '#f97316', text: '#EEF0E8',
  muted: '#8A9080', border: 'rgba(184,240,64,0.12)',
  borderDim: 'rgba(255,255,255,0.06)', surface: '#0D110C',
};

// Reason codes carry meaning the count alone does not: "opted out" is forever,
// "cooldown" expires on its own, "resting" needs a person to clear a flag.
const REASON_TONE = {
  opted_out: c.red, reviewed: c.red, spam: c.muted, own_number: c.muted,
  no_phone: c.muted, no_opt_in: c.muted, customer: c.emerald,
  resting: c.amber, committed: c.orange, already_sent: c.cyan,
  cooldown: c.cyan, in_window: c.lime,
};

const Card = ({ children, pad = '16px 18px' }) => (
  <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '12px', padding: pad }}>{children}</div>
);

const Stat = ({ label, value, tone = c.text, sub }) => (
  <Card>
    <p style={{ color: c.muted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</p>
    <p style={{ fontSize: '26px', fontWeight: '800', color: tone, fontFamily: "'Fraunces', serif", lineHeight: 1.1 }}>{value}</p>
    {sub && <p style={{ color: c.muted, fontSize: '11px', marginTop: '4px' }}>{sub}</p>}
  </Card>
);

const Th = ({ children, align = 'left' }) => (
  <th style={{ textAlign: align, padding: '8px 10px', color: c.muted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '600', borderBottom: '1px solid ' + c.borderDim, whiteSpace: 'nowrap' }}>{children}</th>
);
const Td = ({ children, align = 'left', tone = c.text }) => (
  <td style={{ textAlign: align, padding: '9px 10px', color: tone, fontSize: '13px', borderBottom: '1px solid ' + c.borderDim }}>{children}</td>
);

export default function CampaignReport() {
  const [report, setReport] = useState(null);
  const [recs, setRecs] = useState(null);
  const [awaiting, setAwaiting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setErr('');
      // allSettled: one failing endpoint must not blank the other two.
      const [r, e, a] = await Promise.allSettled([
        api.get(`/prospecting/campaigns?days=${days}`),
        api.get('/prospecting/recommendations'),
        api.get('/prospecting/awaiting-payment'),
      ]);
      if (!alive) return;
      const unwrap = (s) => (s.status === 'fulfilled' ? (s.value?.data?.data ?? s.value?.data ?? null) : null);
      setReport(unwrap(r));
      setRecs(unwrap(e));
      setAwaiting(unwrap(a));
      if ([r, e, a].every((s) => s.status === 'rejected')) setErr('Could not load campaign data.');
      setLoading(false);
    };
    load();
    return () => { alive = false; };
  }, [days]);

  if (loading) return <p style={{ color: c.muted, fontSize: '14px', padding: '20px 0' }}>Loading campaign data…</p>;
  if (err) return <p style={{ color: c.red, fontSize: '14px', padding: '20px 0' }}>{err}</p>;

  const eng = report?.engagement;
  const peak = Math.max(1, ...(report?.timeline || []).map((d) => d.total));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── What we sent ─────────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '19px', fontWeight: '800' }}>What we sent</h2>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => setDays(d)} style={{ padding: '6px 12px', background: days === d ? c.lime + '22' : 'transparent', border: '1px solid ' + (days === d ? c.lime + '44' : c.borderDim), borderRadius: '8px', color: days === d ? c.lime : c.muted, cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>{d}d</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          <Stat label={`Sends · ${days}d`} value={report?.totalSends ?? 0} tone={c.cyan} />
          <Stat label="Carousel reach" value={eng?.recipients ?? 0} />
          <Stat label="Tapped a product" value={eng?.tapped ?? 0} tone={c.lime} sub={eng ? `${eng.tapRate}% of those reached` : null} />
          <Stat label="Replied in words" value={eng?.replied ?? 0} tone={c.emerald} />
          <Stat label="No response" value={eng?.silent ?? 0} tone={c.muted} />
        </div>

        {!!(report?.byCampaign || []).length && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {report.byCampaign.map((b) => (
              <span key={b.name} style={{ padding: '5px 11px', background: c.surface, border: '1px solid ' + c.borderDim, borderRadius: '20px', fontSize: '12px', color: c.text }}>
                {b.name} <strong style={{ color: c.cyan }}>{b.count}</strong>
              </span>
            ))}
          </div>
        )}

        {(report?.timeline || []).length === 0 ? (
          <p style={{ color: c.muted, fontSize: '13px' }}>No marketing sent in this window.</p>
        ) : (
          <Card pad="6px 10px">
            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><Th>Date</Th><Th>Campaigns</Th><Th align="right">Sent</Th><Th /></tr></thead>
                <tbody>
                  {report.timeline.map((d) => (
                    <tr key={d.date}>
                      <Td tone={c.muted}>{d.date}</Td>
                      <Td>{Object.entries(d.campaigns).map(([n, v]) => `${n} (${v})`).join(', ')}</Td>
                      <Td align="right" tone={c.cyan}><strong>{d.total}</strong></Td>
                      <td style={{ width: '34%', padding: '9px 10px', borderBottom: '1px solid ' + c.borderDim }}>
                        <div style={{ height: '6px', width: `${(d.total / peak) * 100}%`, background: c.cyan + '66', borderRadius: '3px', minWidth: '2px' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {report?.caveat && (
          <p style={{ color: c.muted, fontSize: '11px', marginTop: '10px', fontStyle: 'italic' }}>⚠ {report.caveat}</p>
        )}
      </section>

      {/* ── Who tapped ───────────────────────────────────────── */}
      {!!eng?.taps?.length && (
        <section>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '19px', fontWeight: '800', marginBottom: '4px' }}>Who tapped a product</h2>
          <p style={{ color: c.muted, fontSize: '12px', marginBottom: '12px' }}>The highest-intent signal there is — they chose a priced product by name.</p>
          <Card pad="6px 10px">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><Th>Name</Th><Th>Chose</Th><Th>Stage</Th></tr></thead>
              <tbody>
                {eng.taps.map((t) => (
                  <tr key={t.phone}>
                    <Td>{t.name}</Td>
                    <Td tone={c.lime}>{t.product}</Td>
                    <Td tone={t.stage ? c.text : c.muted}>{t.stage || 'no stage recorded'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      )}

      {/* ── Who to send to next ──────────────────────────────── */}
      <section>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '19px', fontWeight: '800', marginBottom: '4px' }}>Who to send to next</h2>
        <p style={{ color: c.muted, fontSize: '12px', marginBottom: '12px' }}>
          {recs?.campaign || 'Campaign'} · {recs?.cooldownDays ?? 7}-day cooldown · computed with the same rules the sender uses.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          <Stat label="Eligible now" value={recs?.eligible?.length ?? 0} tone={c.lime} />
          <Stat label="Tier 1" value={recs?.tier1 ?? 0} sub="engaged more than once" />
          <Stat label="Tier 2" value={recs?.tier2 ?? 0} sub="one message only" />
          <Stat label="Audience" value={recs?.total ?? 0} tone={c.muted} />
        </div>

        {(recs?.eligible || []).length === 0 ? (
          <Card>
            <p style={{ color: c.amber, fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Nobody is eligible right now.</p>
            <p style={{ color: c.muted, fontSize: '12.5px' }}>Everyone is either sent, resting, in cooldown, or already past commitment. The breakdown below says which.</p>
          </Card>
        ) : (
          <Card pad="6px 10px">
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><Th>Name</Th><Th>Phone</Th><Th align="right">Quiet</Th><Th align="right">Tier</Th></tr></thead>
                <tbody>
                  {recs.eligible.map((e) => (
                    <tr key={e.id}>
                      <Td>{e.name}</Td>
                      <Td tone={c.muted}>{e.phone}</Td>
                      <Td align="right">{e.quietDays != null ? `${e.quietDays}d` : '—'}</Td>
                      <Td align="right" tone={e.tier === 1 ? c.lime : c.muted}>{e.tier}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {!!(recs?.byReason || []).length && (
          <>
            <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '18px 0 8px' }}>Why everyone else is held back</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {recs.byReason.map((r) => (
                <span key={r.code} title={r.permanent ? 'Permanent' : 'Temporary — this can change'} style={{ padding: '6px 12px', background: (REASON_TONE[r.code] || c.muted) + '18', border: '1px solid ' + (REASON_TONE[r.code] || c.muted) + '33', borderRadius: '20px', fontSize: '12px', color: REASON_TONE[r.code] || c.muted }}>
                  {r.label} <strong>{r.count}</strong>{r.actionable ? ' ⚑' : ''}
                </span>
              ))}
            </div>
            <p style={{ color: c.muted, fontSize: '11px', marginTop: '8px' }}>⚑ needs a person — a flag nobody clears automatically, or a lead who already said yes.</p>
          </>
        )}
      </section>

      {/* ── Said yes, never paid ─────────────────────────────── */}
      {!!awaiting?.count && (
        <section>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '19px', fontWeight: '800', marginBottom: '4px' }}>Said yes — waiting on payment</h2>
          <p style={{ color: c.muted, fontSize: '12px', marginBottom: '12px' }}>Excluded from marketing on purpose. They need a working payment link, not another advert.</p>
          <Card pad="6px 10px">
            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><Th>Name</Th><Th>Stage</Th><Th>Last said</Th><Th align="right">Quiet</Th><Th align="right">Window</Th></tr></thead>
                <tbody>
                  {awaiting.leads.map((l) => (
                    <tr key={l.id}>
                      <Td>{l.name}</Td>
                      <Td tone={c.orange}>{l.stage}</Td>
                      <Td tone={c.muted}>{l.lastSaid ? `"${l.lastSaid.slice(0, 46)}${l.lastSaid.length > 46 ? '…' : ''}"` : '—'}</Td>
                      <Td align="right">{l.quietDays != null ? `${l.quietDays}d` : '—'}</Td>
                      <Td align="right" tone={l.windowOpen ? c.lime : c.muted}>{l.windowOpen ? 'open' : 'closed'}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
