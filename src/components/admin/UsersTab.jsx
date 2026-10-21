import api from '../../api';
import { colors } from '../../utils/theme';

export default function UsersTab({ pendingUsers, allUsers, isSuperAdmin, userTenantId, currentUser, setApproveModal, handleRejectUser, loadData }) {
  return (
    <div>
      {/* Pending approvals — filter by tenant for admin */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>
          Pending Approvals
          {pendingUsers.length > 0 && <span style={{ marginLeft: '10px', background: colors.amber, color: '#050505', fontSize: '12px', padding: '3px 10px', borderRadius: '999px', fontWeight: '700' }}>{pendingUsers.length} waiting</span>}
        </h2>
        {pendingUsers.length === 0
          ? <div style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '14px', padding: '40px', textAlign: 'center', color: colors.muted }}><p style={{ fontSize: '32px', marginBottom: '12px' }}>✅</p><p>No pending approvals.</p></div>
          : pendingUsers.map(user => (
            <div key={user._id} style={{ background: colors.card, border: `1px solid ${colors.amber}44`, borderRadius: '14px', padding: '18px 24px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '16px' }}>{user.fullName}</strong>
                <p style={{ color: colors.muted, fontSize: '13px', marginTop: '2px' }}>{user.email} · {user.phone}</p>
                <p style={{ color: colors.muted, fontSize: '12px', marginTop: '2px' }}>
                  Registered {new Date(user.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {user.requestedPlan && (
                    <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(184,240,64,0.12)', color: '#B8F040', fontWeight: '600', fontSize: '11px', textTransform: 'capitalize' }}>
                      {user.requestedPlan} plan
                    </span>
                  )}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setApproveModal(user)} style={{ padding: '10px 20px', background: `${colors.lime}22`, color: colors.lime, border: `1px solid ${colors.border}`, borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>✅ Approve</button>
                <button onClick={() => handleRejectUser(user)} style={{ padding: '10px 16px', background: `${colors.red}22`, color: colors.red, border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>Reject</button>
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
            <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>
              {isSuperAdmin ? `All Users (${allUsers.length})` : `Your Team (${visibleUsers.length})`}
            </h2>
            {visibleUsers.map(user => (
              <div key={user._id} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '14px', padding: '16px 24px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{user.fullName}</strong>
                  <p style={{ color: colors.muted, fontSize: '13px', marginTop: '2px' }}>{user.email}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: user.approved ? `${colors.lime}22` : `${colors.amber}22`, color: user.approved ? colors.lime : colors.amber }}>
                    {user.approved ? '✅ Approved' : '⏳ Pending'}
                  </span>
                  {/* Protect super_admin accounts — show badge, no dropdown */}
                  {user.role === 'super_admin' || user._id === currentUser.id ? (
                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: `${colors.cyan}22`, color: colors.cyan, fontWeight: '600' }}>
                      {user.role} {user._id === currentUser.id ? '(you)' : '🔒'}
                    </span>
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
                      style={{ padding: '4px 10px', background: `${colors.cyan}18`, border: `1px solid ${colors.cyan}33`, color: colors.cyan, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', outline: 'none' }}
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
              <div style={{ textAlign: 'center', padding: '40px 0', color: colors.muted }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>👥</p>
                <p>No team members yet.</p>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
