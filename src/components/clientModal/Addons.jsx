import { SectionTitle, Hint } from './ui';

export default function Addons({ addons, toggleAddon }) {
  return (
    <>
      {/* NEW: Add-ons — per-tenant paid top-ups, independent of plan.
          This is what lets an R99 tenant unlock, say, invoicing without
          moving to a whole new plan. See hasFeature() in the backend's
          config/planLimits.js for how these combine with the plan's
          own included features. */}
      <SectionTitle className="mb-1">Add-ons</SectionTitle>
      <Hint>Paid top-ups this client has bought, on top of whatever their plan already includes.</Hint>
      <div className="mb-3.5 grid grid-cols-2 gap-2.5 rounded-xl border border-edge bg-surface px-4 py-3.5">
        {[
          { key: 'payments',  label: 'Payments' },
          { key: 'invoicing', label: 'Invoicing' },
          { key: 'ownNumber', label: 'Own WhatsApp Number' },
          { key: 'extraFlow', label: 'Extra Flow' },
        ].map(({ key, label }) => (
          <div key={key} className="flex min-h-[44px] items-center gap-2">
            <input type="checkbox" id={'addon-' + key} checked={addons[key]} onChange={() => toggleAddon(key)} className="h-4 w-4 cursor-pointer accent-lime" />
            <label htmlFor={'addon-' + key} className="cursor-pointer text-sm text-ink">{label}</label>
          </div>
        ))}
      </div>
    </>
  );
}
