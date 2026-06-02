import { useEffect, useState } from 'react';

const colors = { lime: '#a3e635', text: '#f5f5f0', muted: '#a1a1aa', card: '#121210' };

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalLeads: 0, activeConversations: 0 });

  useEffect(() => {
    // Placeholder for future admin stats
    setStats({ totalLeads: 12, activeConversations: 5 });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: colors.text, padding: '100px 40px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '12px' }}>Admin Control Center</h1>
        <p style={{ color: colors.muted, fontSize: '20px' }}>Platform Overview & Management</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '60px' }}>
          <div style={{ background: colors.card, padding: '32px', borderRadius: '24px' }}>
            <h3>Total Leads</h3>
            <div style={{ fontSize: '52px', fontWeight: '900', color: colors.lime }}>{stats.totalLeads}</div>
          </div>
          <div style={{ background: colors.card, padding: '32px', borderRadius: '24px' }}>
            <h3>Active Conversations</h3>
            <div style={{ fontSize: '52px', fontWeight: '900', color: '#22d3ee' }}>{stats.activeConversations}</div>
          </div>
        </div>

        <p style={{ marginTop: '60px', color: colors.muted }}>More admin features coming soon (clients, analytics, broadcasts).</p>
      </div>
    </div>
  );
}