// src/components/AIStatsPanel.jsx
import { useState, useEffect } from 'react';
import api from '../api';

const c = {
  card: '#121710', surface: '#0D110C', lime: '#B8F040',
  cyan: '#22d3ee', amber: '#fbbf24', red: '#f87171',
  text: '#EEF0E8', muted: '#8A9080', borderDim: 'rgba(255,255,255,0.06)',
};

export default function AIStatsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ai/stats')
      .then(res => setStats(res.data.data?.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
      <p style={{ color: c.muted, fontSize: '13px' }}>Loading AI stats...</p>
    </div>
  );

  if (!stats) return null;

  const pct = stats.budgetCap > 0 ? Math.min(100, (stats.totals.costZAR / stats.budgetCap) * 100) : 0;
  const barColor = pct >= 80 ? c.red : pct >= 60 ? c.amber : c.lime;

  return (
    <div style={{ background: c.card, border: '1px solid ' + (stats.budgetAlert ? c.amber + '44' : c.borderDim), borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ color: c.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🤖 AI Usage — {stats.month}</p>
        {stats.budgetAlert && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: c.amber + '22', color: c.amber, fontWeight: '700' }}>⚠️ 80% of budget used</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: c.surface, borderRadius: '10px', padding: '14px' }}>
          <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Total Calls</p>
          <p style={{ color: c.lime, fontSize: '24px', fontWeight: '800', fontFamily: "'Fraunces', serif" }}>{stats.totals.calls}</p>
        </div>
        <div style={{ background: c.surface, borderRadius: '10px', padding: '14px' }}>
          <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Cost (USD)</p>
          <p style={{ color: c.text, fontSize: '24px', fontWeight: '800', fontFamily: "'Fraunces', serif" }}>${stats.totals.costUSD.toFixed(3)}</p>
        </div>
        <div style={{ background: c.surface, borderRadius: '10px', padding: '14px' }}>
          <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Cost (ZAR)</p>
          <p style={{ color: c.text, fontSize: '24px', fontWeight: '800', fontFamily: "'Fraunces', serif" }}>R{stats.totals.costZAR.toFixed(2)}</p>
        </div>
        <div style={{ background: c.surface, borderRadius: '10px', padding: '14px' }}>
          <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Budget Cap</p>
          <p style={{ color: barColor, fontSize: '24px', fontWeight: '800', fontFamily: "'Fraunces', serif" }}>R{stats.budgetCap}</p>
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <p style={{ color: c.muted, fontSize: '12px' }}>Monthly budget usage</p>
          <p style={{ color: barColor, fontSize: '12px', fontWeight: '600' }}>{pct.toFixed(1)}%</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: pct + '%', background: barColor, borderRadius: '999px', transition: 'width 0.3s ease' }} />
        </div>
      </div>
    </div>
  );
}