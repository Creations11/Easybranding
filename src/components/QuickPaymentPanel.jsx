// src/components/QuickPaymentPanel.jsx
import { useState, useEffect } from 'react';
import api from '../api';

const c = {
  card: '#121710', surface: '#0D110C', lime: '#B8F040',
  cyan: '#22d3ee', amber: '#fbbf24', red: '#f87171',
  text: '#EEF0E8', muted: '#8A9080', borderDim: 'rgba(255,255,255,0.06)',
};

export default function QuickPaymentPanel() {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/payments/platform/stats')
      .then(r => setStats(r.data.data))
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert('Enter a valid amount'); return;
    }
    setLoading(true);
    try {
      const tenantsRes = await api.get('/tenants').catch(() => ({ data: { data: { tenants: [] } } }));
      const firstTenant = tenantsRes.data.data?.tenants?.[0];

      const res = await api.post('/payments/quick', {
        amount: Number(amount),
        note,
        sendToPhone: phone,
        tenantId: firstTenant?._id || null,
      });
      setResult(res.data.data);
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Failed to generate link'));
    } finally { setLoading(false); }
  };

  const iStyle = {
    width: '100%', padding: '10px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid ' + c.borderDim, borderRadius: '8px',
    color: c.text, fontSize: '14px', outline: 'none',
    fontFamily: 'inherit', marginBottom: '10px'
  };

  return (
    <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
      <p style={{ color: c.lime, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px', fontWeight: '700' }}>💳 Quick Payment Generator</p>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { l: 'This month', v: 'R' + (stats.thisMonth?.monthRevenue?.toLocaleString() || 0), c2: c.lime },
            { l: 'Transactions', v: stats.thisMonth?.monthTx || 0, c2: c.cyan },
            { l: 'Platform fees', v: 'R' + (stats.thisMonth?.monthFees?.toFixed(2) || 0), c2: c.amber },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: '900', color: s.c2 }}>{s.v}</p>
              <p style={{ color: c.muted, fontSize: '11px', marginTop: '2px' }}>{s.l}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <p style={{ color: c.muted, fontSize: '12px', marginBottom: '4px' }}>Amount (R)</p>
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="500" type="number" style={iStyle} />
        </div>
        <div>
          <p style={{ color: c.muted, fontSize: '12px', marginBottom: '4px' }}>Send to WhatsApp</p>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27821234567" style={iStyle} />
        </div>
      </div>
      <p style={{ color: c.muted, fontSize: '12px', marginBottom: '4px' }}>Note</p>
      <input value={note} onChange={e => setNote(e.target.value)} placeholder="Holding deposit, booking fee..." style={iStyle} />

      {result ? (
        <div style={{ background: 'rgba(184,240,64,0.08)', border: '1px solid ' + c.lime + '33', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
          <p style={{ color: c.lime, fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>✅ Payment link generated</p>
          <p style={{ color: c.muted, fontSize: '12px', marginBottom: '6px' }}>Amount: R{result.chargeAmount?.toFixed(2)}</p>
          <p style={{ color: c.lime, fontSize: '12px', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '8px' }}>{result.authorizationUrl}</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigator.clipboard.writeText(result.authorizationUrl)} style={{ padding: '6px 14px', background: c.lime + '22', color: c.lime, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>Copy Link</button>
            <button onClick={() => setResult(null)} style={{ padding: '6px 14px', background: 'transparent', color: c.muted, border: '1px solid ' + c.borderDim, borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>New</button>
          </div>
        </div>
      ) : (
        <button onClick={handleGenerate} disabled={loading} style={{ width: '100%', padding: '11px', background: c.lime, color: '#06080A', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Generating...' : '⚡ Generate Payment Link'}
        </button>
      )}
    </div>
  );
}