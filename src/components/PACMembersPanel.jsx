// src/components/PACMembersPanel.jsx
// ─────────────────────────────────────────────────────────────
// PAC Members Dashboard — Complete
// Stats, province breakdown, consent tracking, payment status,
// search, filter, pagination, member detail modal, CSV export
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import api from '../api';
import Pagination from './Pagination';

const c = {
  card: '#121710', lime: '#B8F040', earth: '#C4873A',
  cyan: '#22d3ee', emerald: '#34d399', amber: '#fbbf24',
  red: '#f87171', text: '#EEF0E8', muted: '#8A9080',
  borderDim: 'rgba(255,255,255,0.06)', surface: '#0D110C',
};

export default function PACMembersPanel() {
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);
  const ITEMS_PER_PAGE = 15;

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, sRes] = await Promise.all([
        api.get('/admin-ops/members', {
          params: {
            page,
            limit: ITEMS_PER_PAGE,
            search: search || undefined,
            province: provinceFilter !== 'all' ? provinceFilter : undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            payment: paymentFilter !== 'all' ? paymentFilter : undefined,
          },
        }),
        api.get('/admin-ops/members/stats'),
      ]);
      setMembers(mRes.data.data?.members || []);
      setTotal(mRes.data.data?.total || 0);
      setStats(sRes.data.data?.stats || null);
    } catch (err) {
      console.error('Failed to load members', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [page, search, provinceFilter, statusFilter, paymentFilter]);

  const handleExport = async () => {
    try {
      const res = await api.get('/admin-ops/members/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'pac-members.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Export failed');
    }
  };

  const provinces = ['gauteng', 'western_cape', 'kwazulu_natal', 'eastern_cape', 'limpopo', 'mpumalanga', 'north_west', 'free_state', 'northern_cape'];

  const paidCount = members.filter(m => m.membershipPaid).length;
  const totalRevenue = paidCount * 50;

  if (loading && !members.length) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: c.muted }}>
        Loading members...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: 4 }}>
            Members
          </h1>
          <p style={{ color: c.muted, fontSize: 15 }}>
            {stats ? `${stats.total} registered members` : 'Member management'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport} style={{ padding: '10px 18px', background: c.cyan + '22', color: c.cyan, border: '1px solid ' + c.cyan + '33', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total Members', value: stats.total, color: c.text, icon: '👥' },
            { label: 'Active', value: stats.active, color: c.lime, icon: '✅' },
            { label: 'Today', value: stats.today, color: c.cyan, icon: '📅' },
            { label: 'Paid Members', value: `${paidCount}/${stats.total}`, color: c.emerald, icon: '💳' },
            { label: 'Revenue', value: `R${totalRevenue}`, color: c.lime, icon: '💰' },
            { label: 'Meetings Consent', value: stats.consented?.meetings || 0, color: c.emerald, icon: '📋' },
            { label: 'Campaigns Consent', value: stats.consented?.campaigns || 0, color: c.amber, icon: '📢' },
            { label: 'Fundraising Consent', value: stats.consented?.fundraising || 0, color: c.earth, icon: '💰' },
          ].map(s => (
            <div key={s.label} style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <p style={{ color: c.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                <span>{s.icon}</span>
              </div>
              <p style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "'Fraunces', serif" }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Consent Overview */}
      {stats && (
        <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <p style={{ color: c.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Consent Overview
          </p>
          {[
            { label: 'Meeting & Event Notices', granted: stats.consented?.meetings || 0, total: stats.total, icon: '📋', color: c.emerald },
            { label: 'Campaign & Mobilization', granted: stats.consented?.campaigns || 0, total: stats.total, icon: '📢', color: c.amber },
            { label: 'Fundraising & Donations', granted: stats.consented?.fundraising || 0, total: stats.total, icon: '💰', color: c.earth },
          ].map(item => {
            const pct = item.total > 0 ? Math.round((item.granted / item.total) * 100) : 0;
            return (
              <div key={item.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: c.muted, fontSize: 13 }}>{item.icon} {item.label}</span>
                  <span style={{ color: item.color, fontSize: 13, fontWeight: 600 }}>{item.granted}/{item.total} ({pct}%)</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', background: item.color, borderRadius: 999, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Province Breakdown */}
      {stats?.byProvince && (
        <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <p style={{ color: c.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Members by Province
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {stats.byProvince.map(p => (
              <div key={p._id} style={{ background: c.surface, borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <p style={{ color: c.lime, fontSize: 22, fontWeight: 800, fontFamily: "'Fraunces', serif", marginBottom: 4 }}>{p.count}</p>
                <p style={{ color: c.muted, fontSize: 12, textTransform: 'capitalize' }}>{(p._id || 'Unknown').replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, phone, or member number..."
          style={{ padding: '10px 14px', background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 10, color: c.text, fontSize: 14, outline: 'none', fontFamily: 'inherit', flex: 1, minWidth: 200 }}
        />
        <select value={provinceFilter} onChange={e => { setProvinceFilter(e.target.value); setPage(1); }} style={{ padding: '10px 14px', background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 10, color: c.text, fontSize: 14, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          <option value="all">All Provinces</option>
          {provinces.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: '10px 14px', background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 10, color: c.text, fontSize: 14, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1); }} style={{ padding: '10px 14px', background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 10, color: c.text, fontSize: 14, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          <option value="all">All Payment</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* Results count */}
      {total !== members.length && (
        <p style={{ color: c.muted, fontSize: 13, marginBottom: 12 }}>
          Showing {members.length} of {total} members
        </p>
      )}

      {/* Member List */}
      {members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>👥</p>
          <p>{search ? 'No members match your search.' : 'No members registered yet.'}</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>Members register via WhatsApp by messaging your number.</p>
        </div>
      ) : (
        <>
          {members.map(member => (
            <div
              key={member._id}
              onClick={() => setSelectedMember(member)}
              style={{
                background: c.card,
                border: '1px solid ' + c.borderDim,
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 8,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              className="card-hover"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <strong style={{ fontSize: 15 }}>{member.fullName}</strong>
                    <span style={{ fontSize: 12, color: c.lime, fontFamily: 'monospace' }}>{member.memberNumber}</span>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 999,
                      background: member.status === 'active' ? c.lime + '22' : c.amber + '22',
                      color: member.status === 'active' ? c.lime : c.amber,
                      fontWeight: 600,
                    }}>
                      {member.status}
                    </span>
                  </div>
                  <p style={{ color: c.muted, fontSize: 12 }}>
                    {member.phone} · {member.province || 'No province'} · {member.branch || 'No branch'}
                  </p>
                  <p style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>
                    Registered: {new Date(member.registeredAt).toLocaleDateString('en-ZA')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {member.consents?.meetings && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, background: c.emerald + '22', color: c.emerald }}>📋</span>}
                  {member.consents?.campaigns && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, background: c.amber + '22', color: c.amber }}>📢</span>}
                  {member.consents?.fundraising && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, background: c.earth + '22', color: c.earth }}>💰</span>}
                  {member.membershipPaid
                    ? <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, background: c.emerald + '22', color: c.emerald }}>💳 Paid</span>
                    : <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, background: c.amber + '22', color: c.amber }}>⚠️ Unpaid</span>
                  }
                </div>
              </div>
            </div>
          ))}

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / ITEMS_PER_PAGE)}
            onPageChange={setPage}
            showInfo
            totalItems={total}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
      )}

      {/* Member Detail Modal */}
      {selectedMember && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
          }}
          onClick={() => setSelectedMember(null)}
        >
          <div
            style={{
              width: '100%', maxWidth: 520, background: c.surface,
              borderRadius: 20, border: '1px solid ' + c.borderDim,
              padding: 28, maxHeight: '85vh', overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 900, color: c.lime }}>
                Member Details
              </h3>
              <button onClick={() => setSelectedMember(null)} style={{ background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontSize: 20 }}>
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['Name', selectedMember.fullName],
                ['Member Number', selectedMember.memberNumber],
                ['Phone', selectedMember.phone],
                ['Province', selectedMember.province || '—'],
                ['Branch', selectedMember.branch || '—'],
                ['Status', selectedMember.status],
                ['Registered', new Date(selectedMember.registeredAt).toLocaleDateString('en-ZA')],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid ' + c.borderDim }}>
                  <span style={{ color: c.muted, fontSize: 13 }}>{label}</span>
                  <span style={{ color: c.text, fontSize: 13, fontWeight: 600 }}>{value}</span>
                </div>
              ))}

              {/* Payment Status */}
              <div style={{ marginTop: 4 }}>
                <p style={{ color: c.muted, fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Payment Status
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid ' + c.borderDim, paddingBottom: 8 }}>
                  <span style={{ color: c.muted, fontSize: 13 }}>Membership Fee (R50)</span>
                  <span style={{
                    fontSize: 12, padding: '2px 10px', borderRadius: 999,
                    background: selectedMember.membershipPaid ? c.lime + '22' : c.amber + '22',
                    color: selectedMember.membershipPaid ? c.lime : c.amber,
                    fontWeight: 600,
                  }}>
                    {selectedMember.membershipPaid ? '✅ Paid' : '⚠️ Unpaid'}
                  </span>
                </div>
                {selectedMember.membershipPaid && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                      <span style={{ color: c.muted, fontSize: 13 }}>Paid On</span>
                      <span style={{ color: c.text, fontSize: 13 }}>
                        {selectedMember.membershipPaidAt ? new Date(selectedMember.membershipPaidAt).toLocaleDateString('en-ZA') : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                      <span style={{ color: c.muted, fontSize: 13 }}>Reference</span>
                      <span style={{ color: c.text, fontSize: 13, fontFamily: 'monospace' }}>
                        {selectedMember.membershipPaymentRef || '—'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Consent Settings */}
              <div style={{ marginTop: 4 }}>
                <p style={{ color: c.muted, fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Consent Settings
                </p>
                {[
                  ['Meeting & Event Notices', selectedMember.consents?.meetings],
                  ['Campaign & Mobilization Updates', selectedMember.consents?.campaigns],
                  ['Fundraising & Donation Requests', selectedMember.consents?.fundraising],
                ].map(([label, granted]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid ' + c.borderDim, paddingBottom: 8, marginBottom: 4 }}>
                    <span style={{ color: c.muted, fontSize: 13 }}>{label}</span>
                    <span style={{
                      fontSize: 12, padding: '2px 10px', borderRadius: 999,
                      background: granted ? c.lime + '22' : c.red + '22',
                      color: granted ? c.lime : c.red,
                      fontWeight: 600,
                    }}>
                      {granted ? '✅ Granted' : '❌ Not Granted'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Consent History */}
              {selectedMember.consentHistory?.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <p style={{ color: c.muted, fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Consent History
                  </p>
                  {selectedMember.consentHistory.map((entry, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                      <span style={{ color: c.text, textTransform: 'capitalize' }}>{entry.type} — {entry.action}</span>
                      <span style={{ color: c.muted }}>{new Date(entry.date).toLocaleDateString('en-ZA')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedMember(null)}
                style={{ padding: '10px 20px', background: 'transparent', border: '1px solid ' + c.borderDim, color: c.muted, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}