// src/components/EBTeamPanel.jsx
import { useState, useEffect } from 'react';
import api from '../api';

const c = {
  card: '#121710', lime: '#B8F040', cyan: '#22d3ee',
  emerald: '#34d399', amber: '#fbbf24', red: '#f87171',
  text: '#EEF0E8', muted: '#8A9080',
  border: 'rgba(184,240,64,0.12)', borderDim: 'rgba(255,255,255,0.06)',
  surface: '#0D110C',
};

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '14px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <p style={{ color: c.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
        {icon && <span style={{ fontSize: '16px', opacity: 0.6 }}>{icon}</span>}
      </div>
      <p style={{ fontSize: '32px', fontWeight: '800', color: color || c.text, lineHeight: 1, fontFamily: "'Fraunces', serif" }}>{value ?? '—'}</p>
    </div>
  );
}

export default function EBTeamPanel({ isSuperAdmin, tenants, onReload }) {
  const [team, setTeam] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('eb_agent');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  const loadTeam = async () => {
    setLoading(true);
    try {
      const [uSettled, pSettled] = await Promise.allSettled([
        api.get('/users'),
        api.get('/prospecting'),
      ]);
      const usersRes = uSettled.status === 'fulfilled' ? uSettled.value : { data: { data: {} } };
      const prospectsRes = pSettled.status === 'fulfilled' ? pSettled.value : { data: { data: {} } };
      const allUsers = usersRes.data.data?.users || [];
      const ebTeam = allUsers.filter(u => ['eb_agent', 'eb_manager', 'super_admin'].includes(u.role));
      setTeam(ebTeam);
      setProspects(prospectsRes.data.data?.prospects || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTeam(); }, []);

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

  const handleRemove = async (u) => {
    if (!window.confirm('Remove ' + u.fullName + ' from the team?')) return;
    try {
      await api.patch('/users/' + u._id + '/role', { role: 'borrower' });
      setMsg('✅ ' + u.fullName + ' removed from team');
      setTimeout(() => setMsg(''), 3000);
      loadTeam();
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Failed')); }
  };

  const handleGenerateInvite = async () => {
    setSending(true);
    try {
      const res = await api.post('/auth/invite-team', { email: inviteEmail, role: inviteRole });
      setInviteUrl(res.data.data?.inviteUrl || '');
      setMsg('✅ Invite link generated');
    } catch (err) {
      setInviteUrl(window.location.origin + '/register?role=' + inviteRole);
      setMsg('✅ Share this registration link');
    } finally { setSending(false); }
  };

  const ROLE_COLOR = { super_admin: c.lime, eb_manager: c.cyan, eb_agent: c.amber };
  const ROLE_LABEL = { super_admin: 'Super Admin', eb_manager: 'EB Manager', eb_agent: 'EB Agent' };

  const totalContacted = prospects.filter(p => ['sent','delivered','replied'].includes(p.status)).length;
  const totalReplied = prospects.filter(p => p.status === 'replied').length;
  const totalConverted = prospects.filter(p => p.status === 'converted').length;

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: c.muted }}>Loading team data...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: '900', marginBottom: '4px' }}>EB Team</h1>
          <p style={{ color: c.muted, fontSize: '15px' }}>Easy Branding AI internal staff — {team.length} member{team.length !== 1 ? 's' : ''}</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setInviteModal(true)} style={{ padding: '12px 24px', background: c.lime, color: '#080A06', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Invite Team Member
          </button>
        )}
      </div>

      {msg && <div style={{ background: msg.startsWith('✅') ? c.lime + '18' : c.red + '18', border: '1px solid ' + (msg.startsWith('✅') ? c.lime : c.red) + '33', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', color: msg.startsWith('✅') ? c.lime : c.red, fontSize: '14px' }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        <StatCard label="Team Size" value={team.length} icon="👔" color={c.lime} />
        <StatCard label="Contacted" value={totalContacted} icon="📤" color={c.cyan} />
        <StatCard label="Replied" value={totalReplied} icon="💬" color={c.amber} />
        <StatCard label="Converted" value={totalConverted} icon="✅" color={c.emerald} />
      </div>

      {team.length === 0 ? (
        <div style={{ background: c.card, border: '1px solid ' + c.border, borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>👔</p>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: '900', marginBottom: '8px' }}>No team members yet</h3>
          <p style={{ color: c.muted, fontSize: '15px', marginBottom: '20px' }}>Invite your first EB agent or manager to get started.</p>
          {isSuperAdmin && (
            <button onClick={() => setInviteModal(true)} style={{ padding: '12px 28px', background: c.lime, color: '#080A06', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              + Invite First Team Member
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {team.map(member => {
            const activity = getActivity(member._id);
            const roleColor = ROLE_COLOR[member.role] || c.muted;
            const currentUserId = JSON.parse(localStorage.getItem('eb_user') || '{}')?.id;
            return (
              <div key={member._id} style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: '14px', padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: roleColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: roleColor, flexShrink: 0 }}>
                      {member.fullName?.[0] || '?'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '16px' }}>{member.fullName}</strong>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: roleColor + '22', color: roleColor, fontWeight: '600' }}>{ROLE_LABEL[member.role] || member.role}</span>
                        {member._id === currentUserId && <span style={{ fontSize: '11px', color: c.muted }}>(you)</span>}
                      </div>
                      <p style={{ color: c.muted, fontSize: '13px' }}>{member.email}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {[
                      { l: 'Contacted', v: activity.contacted, c2: c.cyan },
                      { l: 'Replied', v: activity.replied, c2: c.lime },
                      { l: 'Demos', v: activity.demos, c2: c.amber },
                      { l: 'Converted', v: activity.converted, c2: c.emerald },
                    ].map(s => (
                      <div key={s.l} style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '22px', fontWeight: '800', color: s.c2, fontFamily: "'Fraunces', serif", lineHeight: 1 }}>{s.v}</p>
                        <p style={{ fontSize: '11px', color: c.muted, marginTop: '2px' }}>{s.l}</p>
                      </div>
                    ))}
                    {isSuperAdmin && member.role !== 'super_admin' && (
                      <button onClick={() => handleRemove(member)} style={{ padding: '7px 14px', background: c.red + '22', color: c.red, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>Remove</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {inviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: c.surface, borderRadius: '24px', border: '1px solid ' + c.border, padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: '900', color: c.lime }}>Invite Team Member</h3>
              <button onClick={() => { setInviteModal(false); setInviteUrl(''); setMsg(''); }} style={{ background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <p style={{ color: c.muted, fontSize: '12px', marginBottom: '6px' }}>Role</p>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#1C1C19', border: '1px solid ' + c.borderDim, color: c.text, fontSize: '14px', marginBottom: '14px', outline: 'none', fontFamily: 'inherit' }}>
              <option value="eb_agent">EB Agent — Prospecting only</option>
              <option value="eb_manager">EB Manager — Full platform access</option>
            </select>
            <p style={{ color: c.muted, fontSize: '12px', marginBottom: '6px' }}>Email (optional)</p>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="agent@easybranding.co.za" style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', marginBottom: '20px' }} />
            {inviteUrl && (
              <div style={{ background: '#1C1C19', border: '1px solid ' + c.borderDim, borderRadius: '10px', padding: '14px', marginBottom: '14px', wordBreak: 'break-all' }}>
                <p style={{ color: c.muted, fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Invite Link</p>
                <p style={{ color: c.lime, fontSize: '13px', fontFamily: 'monospace' }}>{inviteUrl}</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              {!inviteUrl ? (
                <button onClick={handleGenerateInvite} disabled={sending} style={{ flex: 1, padding: '12px', background: c.lime, color: '#050505', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: sending ? 0.7 : 1 }}>
                  {sending ? 'Generating...' : 'Generate Invite Link'}
                </button>
              ) : (
                <button onClick={() => navigator.clipboard.writeText(inviteUrl)} style={{ flex: 1, padding: '12px', background: c.lime, color: '#050505', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Copy Link
                </button>
              )}
              <button onClick={() => { setInviteModal(false); setInviteUrl(''); }} style={{ padding: '12px 20px', background: 'transparent', border: '1px solid ' + c.borderDim, color: c.muted, borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}