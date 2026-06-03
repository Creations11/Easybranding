// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import api from '../api';

const colors = {
  lime: '#a3e635',
  emerald: '#34d399',
  text: '#f5f5f0',
  muted: '#a1a1aa',
  card: '#121210',
};

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [activeConversations, setActiveConversations] = useState([]);
  const [qualifiedLeads, setQualifiedLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ovRes, activeRes, qualRes] = await Promise.all([
          api.get('/admin-ops/overview'),
          api.get('/admin-ops/conversations/active'),
          api.get('/admin-ops/leads/qualified')
        ]);

        setOverview(ovRes.data.data);
        setActiveConversations(activeRes.data.data || []);
        setQualifiedLeads(qualRes.data.data || []);
      } catch (err) {
        setError('Failed to load some panels');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '140px', textAlign: 'center', color: colors.muted }}>Loading Admin Center...</div>;
  if (error) return <div style={{ padding: '140px', color: '#ef4444' }}>{error}</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: colors.text, padding: '100px 40px' }}>
      <h1 style={{ fontSize: '48px', fontWeight: '900' }}>Admin Control Center</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginTop: '50px' }}>
        <div style={{ background: colors.card, padding: '32px', borderRadius: '24px' }}>
          <div style={{ color: colors.muted }}>TOTAL LEADS</div>
          <div style={{ fontSize: '52px', fontWeight: '900', color: colors.lime }}>{overview?.totalLeads || 0}</div>
        </div>
        <div style={{ background: colors.card, padding: '32px', borderRadius: '24px' }}>
          <div style={{ color: colors.muted }}>ACTIVE</div>
          <div style={{ fontSize: '52px', fontWeight: '900', color: '#22d3ee' }}>{overview?.activeConversations || 0}</div>
        </div>
      </div>

      {/* Active Conversations */}
      <div style={{ marginTop: '60px' }}>
        <h2>Active Conversations</h2>
        <div style={{ background: colors.card, padding: '24px', borderRadius: '24px', marginTop: '20px' }}>
          {activeConversations.length === 0 ? <p>No active conversations.</p> : activeConversations.map(lead => (
            <div key={lead._id} style={{ padding: '16px', background: '#0F0F0D', marginBottom: '12px', borderRadius: '12px' }}>
              {lead.phone} — {lead.currentStage}
            </div>
          ))}
        </div>
      </div>

      {/* Qualified Leads */}
      <div style={{ marginTop: '60px' }}>
        <h2>Qualified Leads</h2>
        <div style={{ background: colors.card, padding: '24px', borderRadius: '24px', marginTop: '20px' }}>
          {qualifiedLeads.map(lead => (
            <div key={lead._id} style={{ padding: '18px', background: '#0F0F0D', marginBottom: '12px', borderRadius: '16px' }}>
              {lead.name} — {lead.phone} — Budget: R{lead.monthlyBudget}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}