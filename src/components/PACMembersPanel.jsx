// src/components/PACMembersPanel.jsx
// ─────────────────────────────────────────────────────────────
// PAC Members Dashboard — Complete
// Stats, province breakdown, consent tracking, payment status,
// search, filter, pagination, member detail modal, CSV export
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../api';
import Pagination from './Pagination';
import Badge from './ui/Badge';
import Button from './ui/Button';
import StatTile from './ui/StatTile';
import PageHeader from './ui/PageHeader';
import { Input, Select } from './ui/Field';

// A tone's text and bar colours, as whole class names so Tailwind sees them.
const TONE_TEXT = { emerald: 'text-emerald', amber: 'text-amber', earth: 'text-earth' };
const TONE_FILL = { emerald: 'bg-emerald', amber: 'bg-amber', earth: 'bg-earth' };

const NO_MEMBERS = { members: [], total: 0 };

export default function PACMembersPanel() {
  const [search, setSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState(null);
  const ITEMS_PER_PAGE = 15;

  // Two queries since 2026-10-05, both polled every 30s as before.
  //
  // The list is keyed by every filter, so typing "ab" then "abc" can no longer
  // have the slower "ab" answer land last and overwrite the "abc" results.
  // keepPreviousData keeps the current rows on screen while a new filter
  // loads, which is how the effect behaved (it never cleared them).
  //
  // Stats are their own query: they do not depend on the filters, so they are
  // no longer re-fetched on every keystroke, and a failing stats call no
  // longer hides the member list (Promise.all used to drop both).
  const filters = { page, search, provinceFilter, statusFilter, paymentFilter };
  const membersQ = useQuery({
    queryKey: ['pac-members', filters],
    queryFn: () => api.get('/admin-ops/members', {
      params: {
        page,
        limit: ITEMS_PER_PAGE,
        search: search || undefined,
        province: provinceFilter !== 'all' ? provinceFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        payment: paymentFilter !== 'all' ? paymentFilter : undefined,
      },
    }).then((res) => ({ members: res.data.data?.members || [], total: res.data.data?.total || 0 })),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
  const statsQ = useQuery({
    queryKey: ['pac-members-stats'],
    queryFn: () => api.get('/admin-ops/members/stats').then((res) => res.data.data?.stats || null),
    refetchInterval: 30_000,
  });
  const { members, total } = membersQ.data ?? NO_MEMBERS;
  const stats = statsQ.data ?? null;
  const loading = membersQ.isPending;

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
    } catch {
      alert('Export failed');
    }
  };

  const provinces = ['gauteng', 'western_cape', 'kwazulu_natal', 'eastern_cape', 'limpopo', 'mpumalanga', 'north_west', 'free_state', 'northern_cape'];

  // Every paid member, from the stats (2026-10-22). This used to count the
  // members on the page being shown, so past one page both figures read low.
  // Null until the stats answer, shown as a dash rather than a wrong number.
  const paidCount = stats?.paid ?? null;
  const totalRevenue = paidCount === null ? null : paidCount * 50;

  if (loading && !members.length) {
    return (
      <div className="p-[60px] text-center text-muted">
        Loading members...
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Team Members" sub={stats ? `${stats.total} registered members` : 'Member management'}>
        <Button variant="system" onClick={handleExport}>📥 Export CSV</Button>
      </PageHeader>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6 flex flex-wrap gap-2.5">
          {[
            { label: 'Total Members', value: stats.total, tone: 'ink' },
            { label: 'Active', value: stats.active, tone: 'lime' },
            { label: 'Today', value: stats.today, tone: 'cyan' },
            { label: 'Paid Members', value: paidCount === null ? '—' : `${paidCount}/${stats.total}`, tone: 'emerald' },
            { label: 'Revenue', value: totalRevenue === null ? '—' : `R${totalRevenue}`, tone: 'lime' },
            { label: 'Meetings Consent', value: stats.consented?.meetings || 0, tone: 'emerald' },
            { label: 'Campaigns Consent', value: stats.consented?.campaigns || 0, tone: 'amber' },
            { label: 'Fundraising Consent', value: stats.consented?.fundraising || 0, tone: 'earth' },
          ].map(s => <StatTile key={s.label} label={s.label} value={s.value} tone={s.tone} />)}
        </div>
      )}

      {/* Consent Overview */}
      {stats && (
        <div className="mb-6 rounded-[14px] border border-edge bg-card p-5">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.06em] text-muted">
            Consent Overview
          </p>
          {[
            { label: 'Meeting & Event Notices', granted: stats.consented?.meetings || 0, total: stats.total, icon: '📋', tone: 'emerald' },
            { label: 'Campaign & Mobilization', granted: stats.consented?.campaigns || 0, total: stats.total, icon: '📢', tone: 'amber' },
            { label: 'Fundraising & Donations', granted: stats.consented?.fundraising || 0, total: stats.total, icon: '💰', tone: 'earth' },
          ].map(item => {
            const pct = item.total > 0 ? Math.round((item.granted / item.total) * 100) : 0;
            return (
              <div key={item.label} className="mb-3.5">
                <div className="mb-1.5 flex justify-between gap-3">
                  <span className="text-[13px] text-muted">{item.icon} {item.label}</span>
                  <span className={`font-mono text-[13px] font-semibold tabular-nums ${TONE_TEXT[item.tone]}`}>{item.granted}/{item.total} ({pct}%)</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className={`h-full rounded-full transition-[width] duration-300 ${TONE_FILL[item.tone]}`} style={{ width: pct + '%' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Province Breakdown */}
      {stats?.byProvince && (
        <div className="mb-6 rounded-[14px] border border-edge bg-card p-5">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.06em] text-muted">
            Members by Province
          </p>
          <div className="flex flex-wrap gap-2.5">
            {stats.byProvince.map(p => (
              <div key={p._id} className="min-w-[140px] flex-1 rounded-[10px] bg-surface p-3.5 text-center">
                <p className="mb-1 font-mono text-[22px] font-extrabold tabular-nums text-lime">{p.count}</p>
                <p className="text-xs capitalize text-muted">{(p._id || 'Unknown').replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <Input
          mono={false}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, phone, or member number..."
          aria-label="Search members"
          className="min-w-[200px] flex-1 bg-card"
        />
        <Select value={provinceFilter} onChange={e => { setProvinceFilter(e.target.value); setPage(1); }} aria-label="Province" className="w-auto cursor-pointer bg-card">
          <option value="all">All Provinces</option>
          {provinces.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
        </Select>
        <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} aria-label="Status" className="w-auto cursor-pointer bg-card">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="unsubscribed">Unsubscribed</option>
        </Select>
        <Select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1); }} aria-label="Payment" className="w-auto cursor-pointer bg-card">
          <option value="all">All Payment</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </Select>
      </div>

      {/* Results count */}
      {total !== members.length && (
        <p className="mb-3 text-[13px] text-muted">
          Showing {members.length} of {total} members
        </p>
      )}

      {/* Member List */}
      {members.length === 0 ? (
        <div className="py-[60px] text-center text-muted">
          <p className="mb-4 text-[40px]">👥</p>
          <p>{search ? 'No members match your search.' : 'No members registered yet.'}</p>
          <p className="mt-2 text-[13px]">Members register via WhatsApp by messaging your number.</p>
        </div>
      ) : (
        <>
          {members.map(member => (
            <div
              key={member._id}
              onClick={() => setSelectedMember(member)}
              className="card-hover mb-2 cursor-pointer rounded-[14px] border border-edge bg-card px-5 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <strong className="text-[15px]">{member.fullName}</strong>
                    <span className="font-mono text-xs text-lime">{member.memberNumber}</span>
                    <Badge tone={member.status === 'active' ? 'live' : 'warn'}>{member.status}</Badge>
                  </div>
                  <p className="text-xs text-muted">
                    <span className="font-mono">{member.phone}</span> · {member.province || 'No province'} · {member.branch || 'No branch'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Registered: {new Date(member.registeredAt).toLocaleDateString('en-ZA')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {member.consents?.meetings && <span className="rounded-full bg-emerald/15 px-1.5 py-0.5 text-[10px] text-emerald">📋</span>}
                  {member.consents?.campaigns && <span className="rounded-full bg-amber/15 px-1.5 py-0.5 text-[10px] text-amber">📢</span>}
                  {member.consents?.fundraising && <span className="rounded-full bg-earth/15 px-1.5 py-0.5 text-[10px] text-earth">💰</span>}
                  {member.membershipPaid
                    ? <span className="rounded-full bg-emerald/15 px-1.5 py-0.5 text-[10px] text-emerald">💳 Paid</span>
                    : <span className="rounded-full bg-amber/15 px-1.5 py-0.5 text-[10px] text-amber">⚠️ Unpaid</span>
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
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-5"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-[520px] overflow-y-auto rounded-[20px] border border-edge bg-surface p-7 max-sm:p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-['Fraunces',serif] text-xl font-black text-lime">
                Member Details
              </h3>
              <button type="button" onClick={() => setSelectedMember(null)} aria-label="Close" className="min-h-[44px] min-w-[44px] cursor-pointer text-xl text-muted">
                ×
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              {[
                ['Name', selectedMember.fullName],
                ['Member Number', selectedMember.memberNumber],
                ['Phone', selectedMember.phone],
                ['Province', selectedMember.province || '—'],
                ['Branch', selectedMember.branch || '—'],
                ['Status', selectedMember.status],
                ['Registered', new Date(selectedMember.registeredAt).toLocaleDateString('en-ZA')],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-edge pb-2">
                  <span className="text-[13px] text-muted">{label}</span>
                  <span className={`text-right text-[13px] font-semibold text-ink ${label === 'Phone' || label === 'Member Number' ? 'font-mono' : ''}`}>{value}</span>
                </div>
              ))}

              {/* Payment Status */}
              <div className="mt-1">
                <p className="mb-2.5 font-mono text-xs uppercase tracking-[0.06em] text-muted">
                  Payment Status
                </p>
                <div className="flex items-center justify-between gap-3 border-b border-edge py-1.5 pb-2">
                  <span className="text-[13px] text-muted">Membership Fee (R50)</span>
                  <Badge tone={selectedMember.membershipPaid ? 'live' : 'warn'}>
                    {selectedMember.membershipPaid ? '✅ Paid' : '⚠️ Unpaid'}
                  </Badge>
                </div>
                {selectedMember.membershipPaid && (
                  <>
                    <div className="flex justify-between gap-3 py-1.5">
                      <span className="text-[13px] text-muted">Paid On</span>
                      <span className="text-[13px] text-ink">
                        {selectedMember.membershipPaidAt ? new Date(selectedMember.membershipPaidAt).toLocaleDateString('en-ZA') : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 py-1.5">
                      <span className="text-[13px] text-muted">Reference</span>
                      <span className="font-mono text-[13px] text-ink">
                        {selectedMember.membershipPaymentRef || '—'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Consent Settings */}
              <div className="mt-1">
                <p className="mb-2.5 font-mono text-xs uppercase tracking-[0.06em] text-muted">
                  Consent Settings
                </p>
                {[
                  ['Meeting & Event Notices', selectedMember.consents?.meetings],
                  ['Campaign & Mobilization Updates', selectedMember.consents?.campaigns],
                  ['Fundraising & Donation Requests', selectedMember.consents?.fundraising],
                ].map(([label, granted]) => (
                  <div key={label} className="mb-1 flex items-center justify-between gap-3 border-b border-edge py-1.5 pb-2">
                    <span className="text-[13px] text-muted">{label}</span>
                    <Badge tone={granted ? 'live' : 'bad'}>
                      {granted ? '✅ Granted' : '❌ Not Granted'}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Consent History */}
              {selectedMember.consentHistory?.length > 0 && (
                <div className="mt-1">
                  <p className="mb-2.5 font-mono text-xs uppercase tracking-[0.06em] text-muted">
                    Consent History
                  </p>
                  {selectedMember.consentHistory.map((entry, i) => (
                    <div key={i} className="flex justify-between gap-3 py-1 text-xs">
                      <span className="capitalize text-ink">{entry.type} — {entry.action}</span>
                      <span className="text-muted">{new Date(entry.date).toLocaleDateString('en-ZA')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <Button variant="secondary" onClick={() => setSelectedMember(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
