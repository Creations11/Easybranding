import api from '../../api';
import Pagination from '../Pagination';
import exportCSV from '../../utils/exportCSV';
import { c } from './tokens';

export default function UsersSection({ usersFilter, usersPage, setUsersPage, ITEMS_PER_PAGE, pendingUsers, setApproveModal, handleRejectUser, handleDeleteUser, user, isSuperAdmin, refetch }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div><h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, marginBottom: 4 }}>Users</h1><p style={{ color: c.muted, fontSize: 15 }}>Platform user management</p></div>
        <button onClick={() => {
          const exportData = usersFilter.filtered.map(u => ({
            name: u.fullName || '',
            email: u.email || '',
            phone: u.phone || '',
            role: u.role || '',
            approved: u.approved ? 'Yes' : 'No',
            plan: u.requestedPlan || '',
          }));
          exportCSV(exportData, 'users-export');
        }} style={{ padding: '12px 18px', background: c.cyan + '22', color: c.cyan, border: '1px solid ' + c.cyan + '33', borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>📥 Export CSV</button>
      </div>
      {pendingUsers.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: c.amber }}>⏳ Pending Approvals ({pendingUsers.length})</h3>
          {pendingUsers.map(u => (
            <div key={u._id} style={{ background: c.card, border: '1px solid ' + c.amber + '44', borderRadius: 14, padding: '16px 20px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div><strong>{u.fullName}</strong><p style={{ color: c.muted, fontSize: 13, marginTop: 2 }}>{u.email} · {u.phone}</p>{u.requestedPlan && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: c.lime + '18', color: c.lime, fontWeight: 600, marginTop: 4, display: 'inline-block' }}>{u.requestedPlan} plan</span>}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setApproveModal(u)} style={{ padding: '8px 18px', background: c.lime + '22', color: c.lime, border: '1px solid ' + c.border, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>✅ Approve</button>
                <button onClick={() => handleRejectUser(u)} style={{ padding: '8px 14px', background: c.red + '22', color: c.red, border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={usersFilter.searchTerm}
          onChange={e => { usersFilter.setSearchTerm(e.target.value); setUsersPage(1); }}
          placeholder="Search users..."
          style={{ padding: '10px 14px', background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', flex: 1, minWidth: '200px' }}
        />
        <select
          value={usersFilter.filters.role || 'all'}
          onChange={e => { usersFilter.setFilter('role', e.target.value === 'all' ? null : e.target.value); setUsersPage(1); }}
          style={{ padding: '10px 14px', background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="eb_manager">EB Manager</option>
          <option value="eb_agent">EB Agent</option>
          <option value="admin">Admin</option>
          <option value="agent">Agent</option>
          <option value="borrower">Borrower</option>
        </select>
        {(usersFilter.searchTerm || usersFilter.filters.role) && (
          <button onClick={() => { usersFilter.clearAll(); setUsersPage(1); }} style={{ padding: '10px 14px', background: 'transparent', border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.muted, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
            Clear
          </button>
        )}
      </div>

      {usersFilter.filteredCount !== usersFilter.totalCount && (
        <p style={{ color: c.muted, fontSize: 13, marginBottom: 12 }}>
          Showing {usersFilter.filteredCount} of {usersFilter.totalCount} users
        </p>
      )}

      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>All Users ({usersFilter.filteredCount})</h3>

      {usersFilter.filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: c.muted }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>{usersFilter.searchTerm ? '🔍' : '👤'}</p>
          <p>{usersFilter.searchTerm ? 'No users match your search.' : 'No users yet.'}</p>
        </div>
      ) : (
        <>
          {usersFilter.filtered
            .slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE)
            .map(u => (
            <div key={u._id} style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 12, padding: '14px 18px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div><strong>{u.fullName}</strong><p style={{ color: c.muted, fontSize: 13, marginTop: 2 }}>{u.email}</p></div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: u.approved ? c.lime + '22' : c.amber + '22', color: u.approved ? c.lime : c.amber }}>{u.approved ? '✅ Approved' : '⏳ Pending'}</span>
                {u.role === 'super_admin' || u._id === user.id ? <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: c.cyan + '22', color: c.cyan, fontWeight: 600 }}>{u.role} {u._id === user.id ? '(you)' : '🔒'}</span>
                  : <select defaultValue={u.role} onChange={async (e) => { try { await api.put('/users/' + u._id, { role: e.target.value }); refetch(); } catch (err) { alert(err.response?.data?.message || 'Failed'); e.target.value = u.role; } }} style={{ padding: '4px 8px', background: c.cyan + '18', border: '1px solid ' + c.cyan + '33', color: c.cyan, borderRadius: 8, fontSize: 12, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                    <option value="borrower">borrower</option><option value="agent">agent</option><option value="admin">admin</option><option value="eb_agent">eb_agent</option><option value="eb_manager">eb_manager</option>{isSuperAdmin && <option value="super_admin">super_admin</option>}
                  </select>}
                {!(u.role === 'super_admin' || u._id === user.id) && (
                  <button onClick={() => handleDeleteUser(u)} title="Delete user" style={{ padding: '5px 10px', background: c.red + '18', color: c.red, border: '1px solid ' + c.red + '33', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>🗑 Delete</button>
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
