import { c, labelStyle } from './styles';

export default function Addons({ addons, toggleAddon }) {
  return (
    <>
      {/* NEW: Add-ons — per-tenant paid top-ups, independent of plan.
          This is what lets an R99 tenant unlock, say, invoicing without
          moving to a whole new plan. See hasFeature() in the backend's
          config/planLimits.js for how these combine with the plan's
          own included features. */}
      <p style={{ ...labelStyle, color: c.lime, fontWeight: '600', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em', marginTop: '16px', marginBottom: '4px' }}>Add-ons</p>
      <p style={{ color: c.muted, fontSize: '12px', marginBottom: '10px' }}>Paid top-ups this client has bought, on top of whatever their plan already includes.</p>
      <div style={{ background: c.surface, borderRadius: '12px', padding: '14px 16px', border: '1px solid ' + c.borderDim, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        {[
          { key: 'payments',  label: 'Payments' },
          { key: 'invoicing', label: 'Invoicing' },
          { key: 'ownNumber', label: 'Own WhatsApp Number' },
          { key: 'extraFlow', label: 'Extra Flow' },
        ].map(({ key, label }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" id={'addon-' + key} checked={addons[key]} onChange={() => toggleAddon(key)} style={{ cursor: 'pointer', accentColor: c.lime, width: '16px', height: '16px' }} />
            <label htmlFor={'addon-' + key} style={{ color: c.text, fontSize: '14px', cursor: 'pointer' }}>{label}</label>
          </div>
        ))}
      </div>
    </>
  );
}
