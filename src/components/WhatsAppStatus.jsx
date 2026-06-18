// src/components/WhatsAppStatus.jsx
import { useState, useEffect } from 'react';
import api from '../api';

const c = {
  card: '#121710', surface: '#0D110C', lime: '#B8F040',
  cyan: '#22d3ee', emerald: '#34d399', amber: '#fbbf24',
  red: '#f87171', text: '#EEF0E8', muted: '#8A9080',
  borderDim: 'rgba(255,255,255,0.06)',
};

export default function WhatsAppStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/admin-ops/whatsapp/status');
      setStatus(res.data.data);
    } catch {
      setStatus({ connected: false, error: 'Failed to fetch status' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  if (loading) return (
    <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
      <p style={{ color: c.muted, fontSize: '13px' }}>Checking WhatsApp connection...</p>
    </div>
  );

  const isConnected = status?.connected;
  const statusColor = isConnected ? c.emerald : c.red;
  const statusBg = isConnected ? c.emerald + '18' : c.red + '18';
  const statusText = isConnected ? '✅ Connected' : '❌ Disconnected';
  const lastWebhook = status?.lastWebhookAt ? new Date(status.lastWebhookAt).toLocaleString('en-ZA') : 'Never';
  const queueDepth = status?.messageQueueDepth ?? 0;
  const queueColor = queueDepth > 50 ? c.red : queueDepth > 20 ? c.amber : c.emerald;

  return (
    <div style={{ background: c.card, border: '1px solid ' + (isConnected ? c.emerald + '44' : c.red + '44'), borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ color: c.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📱 WhatsApp Connection</p>
        <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', background: statusBg, color: statusColor, fontWeight: '700' }}>{statusText}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
        <div style={{ background: c.surface, borderRadius: '10px', padding: '14px' }}>
          <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>Last Webhook</p>
          <p style={{ color: c.text, fontSize: '14px', fontWeight: '600' }}>{lastWebhook}</p>
        </div>

        <div style={{ background: c.surface, borderRadius: '10px', padding: '14px' }}>
          <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>Message Queue</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{ color: queueColor, fontSize: '24px', fontWeight: '800', fontFamily: "'Fraunces', serif" }}>{queueDepth}</p>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: queueColor + '22', color: queueColor, fontWeight: '600' }}>
              {queueDepth === 0 ? 'Clear' : queueDepth < 20 ? 'Normal' : queueDepth < 50 ? 'Backlog' : 'Critical'}
            </span>
          </div>
        </div>

        <div style={{ background: c.surface, borderRadius: '10px', padding: '14px' }}>
          <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>Phone Number</p>
          <p style={{ color: c.text, fontSize: '14px', fontWeight: '600' }}>{status?.phoneNumber || '—'}</p>
        </div>

        <div style={{ background: c.surface, borderRadius: '10px', padding: '14px' }}>
          <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>Messages Today</p>
          <p style={{ color: c.cyan, fontSize: '24px', fontWeight: '800', fontFamily: "'Fraunces', serif" }}>{status?.messagesToday ?? '—'}</p>
        </div>
      </div>

      {!isConnected && (
        <div style={{ marginTop: '14px', padding: '12px 16px', background: c.red + '11', border: '1px solid ' + c.red + '33', borderRadius: '10px' }}>
          <p style={{ color: c.red, fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>⚠️ WhatsApp is disconnected</p>
          <p style={{ color: c.muted, fontSize: '12px' }}>{status?.error || 'Check your WhatsApp Business API configuration and webhook endpoint.'}</p>
          <button onClick={fetchStatus} style={{ marginTop: '8px', padding: '6px 14px', background: c.lime + '22', color: c.lime, border: '1px solid ' + c.lime + '33', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
            🔄 Retry Connection Check
          </button>
        </div>
      )}
    </div>
  );
}