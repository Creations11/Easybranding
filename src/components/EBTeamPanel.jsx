// src/components/EBTeamPanel.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import Badge from './ui/Badge';
import Button from './ui/Button';
import StatTile from './ui/StatTile';
import PageHeader from './ui/PageHeader';
import { Select } from './ui/Field';

const NO_TEAM = { team: [], prospects: [] };

// Each call degrades on its own: a failing /prospecting leaves the activity
// columns at zero rather than hiding the team.
async function loadTeamData() {
  const [uSettled, pSettled] = await Promise.allSettled([
    api.get('/users'),
    api.get('/prospecting'),
  ]);
  if (uSettled.status === 'rejected') console.error(uSettled.reason);
  if (pSettled.status === 'rejected') console.error(pSettled.reason);
  const allUsers = uSettled.status === 'fulfilled' ? uSettled.value.data.data?.users || [] : [];
  return {
    team: allUsers.filter(u => ['eb_agent', 'eb_manager', 'super_admin'].includes(u.role)),
    prospects: pSettled.status === 'fulfilled' ? pSettled.value.data.data?.prospects || [] : [],
  };
}

export default function EBTeamPanel({ isSuperAdmin }) {
  // A query since 2026-10-05. A reload after removing someone keeps the list
  // on screen instead of flashing back to "loading".
  const teamQ = useQuery({ queryKey: ['eb-team'], queryFn: loadTeamData });
  const { team, prospects } = teamQ.data ?? NO_TEAM;
  const loading = teamQ.isPending;
  const loadTeam = () => teamQ.refetch();
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteRole, setInviteRole] = useState('eb_agent');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');


  const getActivity = (userId) => {
    const userProspects = prospects.filter(p => p.assignedTo?.toString() === userId?.toString());
    return {
      contacted: userProspects.filter(p => ['sent','delivered','replied'].includes(p.status)).length,
      replied: userProspects.filter(p => p.status === 'replied').length,
      demos: userProspects.filter(p => p.outcome === 'demo_booked').length,
      converted: userProspects.filter(p => p.outcome === 'converted' || p.status === 'converted').length,
      total: userProspects.length,
    };
  };

  // Removal is the account's soft delete: deactivated, stamped with who did
  // it, and gone from every list. It used to demote them to `borrower` (the
  // old loan-app role), which left a working account behind and changed
  // nothing for a session they already had: platform access for up to the
  // seven days a session lasts. The API now checks the account on every
  // request, so a removed member is locked out of the session they hold too.
  const handleRemove = async (u) => {
    if (!window.confirm('Remove ' + u.fullName + ' from the team? Their access ends immediately, including on any device they are signed in on.')) return;
    try {
      await api.delete('/users/' + u._id);
      setMsg('✅ ' + u.fullName + ' removed from team');
      setTimeout(() => setMsg(''), 3000);
      loadTeam();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Failed')); }
  };

  const handleGenerateInvite = async () => {
    setSending(true);
    setInviteUrl(window.location.origin + '/register?role=' + inviteRole);
    setMsg('✅ Share this registration link');
    setSending(false);
  };

  const ROLE_TONE = { super_admin: 'live', eb_manager: 'system', eb_agent: 'warn' };
  const ROLE_AVATAR = { super_admin: 'bg-lime/15 text-lime', eb_manager: 'bg-cyan/15 text-cyan', eb_agent: 'bg-amber/15 text-amber' };
  const ROLE_LABEL = { super_admin: 'Super Admin', eb_manager: 'EB Manager', eb_agent: 'EB Agent' };

  const totalContacted = prospects.filter(p => ['sent','delivered','replied'].includes(p.status)).length;
  const totalReplied = prospects.filter(p => p.status === 'replied').length;
  const totalConverted = prospects.filter(p => p.status === 'converted').length;

  if (loading) return <div className="p-[60px] text-center text-muted">Loading team data...</div>;

  return (
    <div>
      <PageHeader title="EB Team" sub={`Easy Branding AI internal staff — ${team.length} member${team.length !== 1 ? 's' : ''}`}>
        {isSuperAdmin && (
          <Button variant="primary" onClick={() => setInviteModal(true)}>
            + Invite Team Member
          </Button>
        )}
      </PageHeader>

      {msg && <div className={`mb-4 rounded-[10px] border px-4 py-2.5 text-sm ${msg.startsWith('✅') ? 'border-lime/20 bg-lime/10 text-lime' : 'border-red/20 bg-red/10 text-red'}`}>{msg}</div>}

      <div className="mb-7 flex flex-wrap gap-3">
        <StatTile label="Team Size" value={team.length} tone="lime" />
        <StatTile label="Contacted" value={totalContacted} tone="cyan" />
        <StatTile label="Replied" value={totalReplied} tone="amber" />
        <StatTile label="Converted" value={totalConverted} tone="emerald" />
      </div>

      {team.length === 0 ? (
        <div className="rounded-2xl border border-edge-live bg-card p-12 text-center">
          <p className="mb-4 text-5xl">👔</p>
          <h3 className="mb-2 font-['Fraunces',serif] text-2xl font-black">No team members yet</h3>
          <p className="mb-5 text-[15px] text-muted">Invite your first EB agent or manager to get started.</p>
          {isSuperAdmin && (
            <Button variant="primary" onClick={() => setInviteModal(true)}>
              + Invite First Team Member
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {team.map(member => {
            const activity = getActivity(member._id);
            const currentUserId = JSON.parse(localStorage.getItem('eb_user') || '{}')?.id;
            return (
              <div key={member._id} className="rounded-[14px] border border-edge bg-card px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold ${ROLE_AVATAR[member.role] || 'bg-white/8 text-muted'}`}>
                      {member.fullName?.[0] || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <strong className="text-base">{member.fullName}</strong>
                        <Badge tone={ROLE_TONE[member.role] || 'neutral'}>{ROLE_LABEL[member.role] || member.role}</Badge>
                        {member._id === currentUserId && <span className="text-[11px] text-muted">(you)</span>}
                      </div>
                      <p className="truncate text-[13px] text-muted">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {[
                      { l: 'Contacted', v: activity.contacted, cls: 'text-cyan' },
                      { l: 'Replied', v: activity.replied, cls: 'text-lime' },
                      { l: 'Demos', v: activity.demos, cls: 'text-amber' },
                      { l: 'Converted', v: activity.converted, cls: 'text-emerald' },
                    ].map(s => (
                      <div key={s.l} className="text-center">
                        <p className={`font-mono text-[22px] font-extrabold leading-none tabular-nums ${s.cls}`}>{s.v}</p>
                        <p className="mt-0.5 text-[11px] text-muted">{s.l}</p>
                      </div>
                    ))}
                    {isSuperAdmin && member.role !== 'super_admin' && (
                      <Button variant="danger" onClick={() => handleRemove(member)}>Remove</Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {inviteModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-5">
          <div className="w-full max-w-[480px] rounded-3xl border border-edge-live bg-surface p-8 max-sm:p-5">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-['Fraunces',serif] text-[22px] font-black text-lime">Invite Team Member</h3>
              <button type="button" onClick={() => { setInviteModal(false); setInviteUrl(''); setMsg(''); }} aria-label="Close" className="min-h-[44px] min-w-[44px] cursor-pointer text-xl text-muted">×</button>
            </div>
            <p className="mb-1.5 text-xs text-muted">Role</p>
            <Select value={inviteRole} onChange={e => setInviteRole(e.target.value)} aria-label="Role" className="mb-3.5 cursor-pointer bg-[#1C1C19]">
              <option value="eb_agent">EB Agent — Prospecting only</option>
              <option value="eb_manager">EB Manager — Full platform access</option>
            </Select>
            {inviteUrl && (
              <div className="mb-3.5 break-all rounded-[10px] border border-edge bg-[#1C1C19] p-3.5">
                <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">Invite Link</p>
                <p className="font-mono text-[13px] text-lime">{inviteUrl}</p>
              </div>
            )}
            <div className="flex gap-2.5">
              {!inviteUrl ? (
                <Button variant="primary" className="flex-1" onClick={handleGenerateInvite} disabled={sending}>
                  {sending ? 'Generating...' : 'Generate Invite Link'}
                </Button>
              ) : (
                <Button variant="primary" className="flex-1" onClick={() => navigator.clipboard.writeText(inviteUrl)}>
                  Copy Link
                </Button>
              )}
              <Button variant="secondary" onClick={() => { setInviteModal(false); setInviteUrl(''); }}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
