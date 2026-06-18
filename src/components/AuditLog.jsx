// src/components/AuditLog.jsx
import { useState, useEffect } from 'react';
import api from '../api';
import Pagination from './Pagination';

const c = {
  card: '#121710', surface: '#0D110C', lime: '#B8F040',
  cyan: '#22d3ee', amber: '#fbbf24', red: '#f87171',
  text: '#EEF0E8', muted: '#8A9080', borderDim: 'rgba(255,255,255,0.06)',
};

const ACTION_COLORS = {
  create: c.lime, update: c.cyan, delete: c.red,
  suspend: c.amber, activate: c.lime, approve: c.lime,
  reject: c.red, login: c.muted, takeover: c.cyan,
  resume: c.cyan,
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    api.get('/admin-ops/audit-log')
      .then(res => setLogs(res.data.data?.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
      <p style={{ color: c.muted, fontSize: '13px' }}>Loading audit log...</p>
    </div>
  );

  if (!logs.length) return (
    <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
      <p style={{ color: c.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>📋 Audit Log</p>
      <p style={{ color: c.muted, fontSize: '13px' }}>No audit events yet.</p>
    </div>
  );

  const paginatedLogs = logs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
      <p style={{ color: c.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>📋 Audit Log ({logs.length} events)</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {paginatedLogs.map((log, i) => {
          const actionColor = ACTION_COLORS[log.action] || c.muted;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', fontSize: '13px' }}>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: actionColor + '22', color: actionColor, fontWeight: '600', textTransform: 'capitalize', whiteSpace: 'nowrap', minWidth: '70px', textAlign: 'center' }}>
                {log.action}
              </span>
              <span style={{ color: c.text, flex: 1 }}>{log.description}</span>
              <span style={{ color: c.muted, fontSize: '12px', whiteSpace: 'nowrap' }}>{log.userName || 'System'}</span>
              <span style={{ color: c.muted, fontSize: '11px', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString('en-ZA')}</span>
            </div>
          );
        })}
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(logs.length / ITEMS_PER_PAGE)}
        onPageChange={setPage}
        showInfo
        totalItems={logs.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
}