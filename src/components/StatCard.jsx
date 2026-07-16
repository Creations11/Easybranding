// src/components/StatCard.jsx
// Extracted from SuperAdminDashboard.jsx. Only depends on its own props
// (plus the shared design tokens) — color is always passed in explicitly
// by the caller, falling back to the default text color.
import { colors } from '../utils/theme';

export default function StatCard({ label, value, color, sub, icon }) {
  return (
    <div style={{ background: colors.card, border: '1px solid ' + colors.borderDim, borderRadius: '14px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <p style={{ color: colors.muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
        {icon && <span style={{ fontSize: '16px', opacity: 0.6 }}>{icon}</span>}
      </div>
      <p style={{ fontSize: '32px', fontWeight: '800', color: color || colors.text, lineHeight: 1, marginBottom: sub ? '4px' : 0, fontFamily: "'Fraunces', serif" }}>{value ?? '—'}</p>
      {sub && <p style={{ color: colors.muted, fontSize: '12px' }}>{sub}</p>}
    </div>
  );
}
