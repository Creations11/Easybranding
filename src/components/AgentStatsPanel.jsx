// src/components/AgentStatsPanel.jsx
import { useState, useEffect } from 'react';
import api from '../api';

const c = {
  card: '#121710', lime: '#B8F040', earth: '#C4873A',
  cyan: '#22d3ee', emerald: '#34d399', amber: '#fbbf24',
  red: '#f87171', orange: '#f97316', text: '#EEF0E8',
  muted: '#8A9080', border: 'rgba(184,240,64,0.12)',
  borderDim: 'rgba(255,255,255,0.06)',
};

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '14px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
        {icon && <span style={{ fontSize: '16px', opacity: 0.6 }}>{icon}</span>}
      </div>
      <p style={{ fontSize: '32px', fontWeight: '800', color: color || c.text, lineHeight: 1, fontFamily: "'Fraunces', serif" }}>{value ?? '—'}</p>
    </div>
  );
}

export default function AgentStatsPanel({ user }) {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/prospecting')
      .then(res => {
        const all = res.data.data?.prospects || [];
        const mine = all.filter(p => p.assignedTo?.toString() === user?.id?.toString());
        setProspects(mine);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const stats = {
    total: prospects.length,
    sent: prospects.filter(p => ['sent','delivered','replied'].includes(p.status)).length,
    replied: prospects.filter(p => p.status === 'replied').length,
    demos: prospects.filter(p => p.outcome === 'demo_booked').length,
    calls: prospects.filter(p => p.outcome === 'hot_lead').length,
    converted: prospects.filter(p => p.status === 'converted').length,
  };

  const replyRate = stats.sent > 0 ? Math.round((stats.replied / stats.sent) * 100) : 0;
  const convRate = stats.replied > 0 ? Math.round((stats.converted / stats.replied) * 100) : 0;
  const demoRate = stats.replied > 0 ? Math.round((stats.demos / stats.replied) * 100) : 0;

  const recent = [...prospects].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 10);

  const STATUS_COLORS = {
    pending: c.muted, sent: c.cyan, delivered: c.emerald,
    replied: c.lime, not_interested: c.red, converted: c.lime, demo_booked: c.earth,
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: c.muted }}>Loading your stats...</div>;

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '900', marginBottom: '4px' }}>
          Hey {user.fullName?.split(' ')[0] || 'Agent'} 👋
        </h1>
        <p style={{ color: c.muted, fontSize: '15px' }}>Your performance this month</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        <StatCard label="Total Contacts" value={stats.total} icon="📋" color={c.text} />
        <StatCard label="Messages Sent" value={stats.sent} icon="📤" color={c.cyan} />
        <StatCard label="Replied" value={stats.replied} icon="💬" color={c.lime} />
        <StatCard label="Demos Booked" value={stats.demos} icon="🎯" color={c.amber} />
        <StatCard label="Calls Booked" value={stats.calls} icon="📞" color={c.orange} />
        <StatCard label="Converted" value={stats.converted} icon="✅" color={c.emerald} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Reply Rate', value: replyRate, desc: 'of sent messages got a reply', color: c.lime },
          { label: 'Demo Rate', value: demoRate, desc: 'of replies booked a demo', color: c.amber },
          { label: 'Conversion Rate', value: convRate, desc: 'of replies became clients', color: c.emerald },
        ].map(s => (
          <div key={s.label} style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '14px', padding: '20px' }}>
            <p style={{ color: c.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{s.label}</p>
            <p style={{ fontSize: '42px', fontWeight: '900', color: s.color, fontFamily: "'Fraunces', serif", lineHeight: 1, marginBottom: '4px' }}>{s.value}%</p>
            <p style={{ color: c.muted, fontSize: '12px' }}>{s.desc}</p>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '999px', height: '4px', overflow: 'hidden', marginTop: '12px' }}>
              <div style={{ height: '100%', width: s.value + '%', background: s.color, borderRadius: '999px' }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        <p style={{ color: c.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Pipeline Breakdown</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Pending', value: prospects.filter(p => p.status === 'pending').length, color: c.muted },
            { label: 'Sent', value: stats.sent, color: c.cyan },
            { label: 'Replied', value: stats.replied, color: c.lime },
            { label: 'Demo Booked', value: stats.demos, color: c.amber },
            { label: 'Not Interested', value: prospects.filter(p => p.status === 'not_interested').length, color: c.red },
            { label: 'Converted', value: stats.converted, color: c.emerald },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <p style={{ color: c.muted, fontSize: '13px', width: '120px', flexShrink: 0 }}>{s.label}</p>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: stats.total > 0 ? (s.value / stats.total) * 100 + '%' : '0%', background: s.color, borderRadius: '999px' }} />
              </div>
              <p style={{ color: s.color, fontSize: '13px', fontWeight: '700', width: '30px', textAlign: 'right', flexShrink: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {recent.length > 0 && (
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: c.muted }}>Recent Activity</h3>
          {recent.map(p => (
            <div key={p._id} style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '12px', padding: '12px 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <strong style={{ fontSize: '14px' }}>{p.name !== 'Unknown' ? p.name : p.phone}</strong>
                <p style={{ color: c.muted, fontSize: '12px', marginTop: '2px' }}>{p.phone}{p.agencyName ? ' · ' + p.agencyName : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: (STATUS_COLORS[p.status] || c.muted) + '22', color: STATUS_COLORS[p.status] || c.muted, fontWeight: '600' }}>{p.status?.replace(/_/g, ' ')}</span>
                {p.outcome && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: c.earth + '22', color: c.earth }}>{p.outcome?.replace(/_/g, ' ')}</span>}
                <span style={{ fontSize: '11px', color: c.muted }}>{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('en-ZA') : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {prospects.length === 0 && (
        <div style={{ background: c.card, border: '1px solid ' + c.border, borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>📊</p>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: '900', marginBottom: '8px' }}>No activity yet</h3>
          <p style={{ color: c.muted, fontSize: '15px' }}>Go to Prospecting to start contacting agencies.</p>
        </div>
      )}
    </div>
  );
}