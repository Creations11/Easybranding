import api from '../../api';
import Pagination from '../Pagination';
import exportCSV from '../../utils/exportCSV';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';
import { Input, Select } from '../ui/Field';

export default function UsersSection({ usersFilter, usersPage, setUsersPage, ITEMS_PER_PAGE, pendingUsers, setApproveModal, handleRejectUser, handleDeleteUser, user, isSuperAdmin, refetch }) {
  return (
    <div>
      <PageHeader title="Users" sub="Platform user management">
        <Button variant="system" onClick={() => {
          const exportData = usersFilter.filtered.map(u => ({
            name: u.fullName || '',
            email: u.email || '',
            phone: u.phone || '',
            role: u.role || '',
            approved: u.approved ? 'Yes' : 'No',
            plan: u.requestedPlan || '',
          }));
          exportCSV(exportData, 'users-export');
        }}>📥 Export CSV</Button>
      </PageHeader>

      {pendingUsers.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3.5 text-base font-bold text-amber">⏳ Pending Approvals ({pendingUsers.length})</h3>
          {pendingUsers.map(u => (
            <div key={u._id} className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-amber/25 bg-card px-5 py-4">
              <div>
                <strong>{u.fullName}</strong>
                <p className="mt-0.5 text-[13px] text-muted">{u.email} · <span className="font-mono">{u.phone}</span></p>
                {u.requestedPlan && <span className="mt-1 inline-block rounded-full bg-lime/10 px-2 py-0.5 text-[11px] font-semibold text-lime">{u.requestedPlan} plan</span>}
              </div>
              <div className="flex gap-2">
                <Button variant="live" onClick={() => setApproveModal(u)}>✅ Approve</Button>
                <Button variant="danger" onClick={() => handleRejectUser(u)}>Reject</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <Input
          mono={false}
          value={usersFilter.searchTerm}
          onChange={e => { usersFilter.setSearchTerm(e.target.value); setUsersPage(1); }}
          placeholder="Search users..."
          aria-label="Search users"
          className="min-w-[200px] flex-1 bg-card"
        />
        <Select
          value={usersFilter.filters.role || 'all'}
          onChange={e => { usersFilter.setFilter('role', e.target.value === 'all' ? null : e.target.value); setUsersPage(1); }}
          aria-label="Role"
          className="w-auto cursor-pointer bg-card"
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="eb_manager">EB Manager</option>
          <option value="eb_agent">EB Agent</option>
          <option value="admin">Admin</option>
          <option value="agent">Agent</option>
          <option value="borrower">Borrower</option>
        </Select>
        {(usersFilter.searchTerm || usersFilter.filters.role) && (
          <Button variant="ghost" onClick={() => { usersFilter.clearAll(); setUsersPage(1); }}>
            Clear
          </Button>
        )}
      </div>

      {usersFilter.filteredCount !== usersFilter.totalCount && (
        <p className="mb-3 text-[13px] text-muted">
          Showing {usersFilter.filteredCount} of {usersFilter.totalCount} users
        </p>
      )}

      <h3 className="mb-3.5 text-base font-bold">All Users ({usersFilter.filteredCount})</h3>

      {usersFilter.filtered.length === 0 ? (
        <div className="py-[60px] text-center text-muted">
          <p className="mb-4 text-[40px]">{usersFilter.searchTerm ? '🔍' : '👤'}</p>
          <p>{usersFilter.searchTerm ? 'No users match your search.' : 'No users yet.'}</p>
        </div>
      ) : (
        <>
          {usersFilter.filtered
            .slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE)
            .map(u => (
            <div key={u._id} className="mb-2 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-edge bg-card px-[18px] py-3.5">
              <div className="min-w-0"><strong>{u.fullName}</strong><p className="mt-0.5 text-[13px] text-muted">{u.email}</p></div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={u.approved ? 'live' : 'warn'}>{u.approved ? '✅ Approved' : '⏳ Pending'}</Badge>
                {u.role === 'super_admin' || u._id === user.id ? <Badge tone="system">{u.role} {u._id === user.id ? '(you)' : '🔒'}</Badge>
                  : <select defaultValue={u.role} aria-label={`Role for ${u.fullName || u.email}`} onChange={async (e) => { try { await api.put('/users/' + u._id, { role: e.target.value }); refetch(); } catch (err) { alert(err.response?.data?.message || 'Failed'); e.target.value = u.role; } }}
                      className="min-h-[44px] cursor-pointer rounded-lg border border-cyan/20 bg-cyan/10 px-2 text-xs text-cyan focus:outline-none">
                    <option value="borrower">borrower</option><option value="agent">agent</option><option value="admin">admin</option><option value="eb_agent">eb_agent</option><option value="eb_manager">eb_manager</option>{isSuperAdmin && <option value="super_admin">super_admin</option>}
                  </select>}
                {!(u.role === 'super_admin' || u._id === user.id) && (
                  <Button variant="danger" onClick={() => handleDeleteUser(u)} title="Delete user">🗑 Delete</Button>
                )}
              </div>
            </div>
          ))}
          <Pagination
            currentPage={usersPage}
            totalPages={Math.ceil(usersFilter.filtered.length / ITEMS_PER_PAGE)}
            onPageChange={setUsersPage}
            showInfo
            totalItems={usersFilter.filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
      )}
    </div>
  );
}
