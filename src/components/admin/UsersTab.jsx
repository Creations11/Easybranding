import api from '../../api';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function UsersTab({ pendingUsers, allUsers, isSuperAdmin, userTenantId, currentUser, setApproveModal, handleRejectUser, loadData }) {
  return (
    <div>
      {/* Pending approvals — filter by tenant for admin */}
      <div className="mb-10">
        <h2 className="mb-4 text-xl">
          Pending Approvals
          {pendingUsers.length > 0 && <span className="ml-2.5 rounded-full bg-amber px-2.5 py-[3px] text-xs font-bold text-[#050505]">{pendingUsers.length} waiting</span>}
        </h2>
        {pendingUsers.length === 0
          ? <div className="rounded-[14px] border border-edge bg-card p-10 text-center text-muted"><p className="mb-3 text-[32px]">✅</p><p>No pending approvals.</p></div>
          : pendingUsers.map(user => (
            <div key={user._id} className="mb-2.5 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-amber/25 bg-card px-6 py-[18px]">
              <div>
                <strong className="text-base">{user.fullName}</strong>
                <p className="mt-0.5 text-[13px] text-muted">{user.email} · <span className="font-mono">{user.phone}</span></p>
                <p className="mt-0.5 text-xs text-muted">
                  Registered {new Date(user.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {user.requestedPlan && (
                    <span className="ml-2 rounded-full bg-lime/12 px-2 py-0.5 text-[11px] font-semibold capitalize text-lime">
                      {user.requestedPlan} plan
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="live" onClick={() => setApproveModal(user)}>✅ Approve</Button>
                <Button variant="danger" onClick={() => handleRejectUser(user)}>Reject</Button>
              </div>
            </div>
          ))}
      </div>

      {/* All users — admin sees only their tenant's users */}
      {(() => {
        const visibleUsers = isSuperAdmin
          ? allUsers
          : allUsers.filter(u => u.tenantId === userTenantId);
        return (
          <div>
            <h2 className="mb-4 text-xl">
              {isSuperAdmin ? `All Users (${allUsers.length})` : `Your Team (${visibleUsers.length})`}
            </h2>
            {visibleUsers.map(user => (
              <div key={user._id} className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-edge bg-card px-6 py-4">
                <div className="min-w-0">
                  <strong>{user.fullName}</strong>
                  <p className="mt-0.5 text-[13px] text-muted">{user.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={user.approved ? 'live' : 'warn'}>
                    {user.approved ? '✅ Approved' : '⏳ Pending'}
                  </Badge>
                  {/* Protect super_admin accounts — show badge, no dropdown */}
                  {user.role === 'super_admin' || user._id === currentUser.id ? (
                    <Badge tone="system">
                      {user.role} {user._id === currentUser.id ? '(you)' : '🔒'}
                    </Badge>
                  ) : (
                    <select
                      defaultValue={user.role}
                      onChange={async (e) => {
                        try {
                          await api.put(`/users/${user._id}`, { role: e.target.value });
                          loadData();
                        } catch (err) {
                          alert(err.response?.data?.message || 'Failed to update role');
                          e.target.value = user.role;
                        }
                      }}
                      className="min-h-[44px] cursor-pointer rounded-lg border border-cyan/20 bg-cyan/10 px-2.5 text-xs text-cyan focus:outline-none"
                    >
                      <option value="borrower">borrower</option>
                      <option value="agent">agent</option>
                      <option value="admin">admin</option>
                      {isSuperAdmin && <option value="super_admin">super_admin</option>}
                    </select>
                  )}
                </div>
              </div>
            ))}
            {visibleUsers.length === 0 && (
              <div className="py-10 text-center text-muted">
                <p className="mb-3 text-[32px]">👥</p>
                <p>No team members yet.</p>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
