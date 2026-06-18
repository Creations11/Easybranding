// src/components/ClientModal.jsx
import { useState } from 'react';
import api from '../api';

const c = {
  surface: '#0D110C', lime: '#B8F040', cyan: '#22d3ee',
  amber: '#fbbf24', red: '#f87171', text: '#EEF0E8',
  muted: '#8A9080', border: 'rgba(184,240,64,0.12)',
  borderDim: 'rgba(255,255,255,0.06)',
};

export default function ClientModal({ tenant, onClose, onSaved }) {
  const isNew = !tenant?._id;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    businessName:   tenant?.businessName   || '',
    brandName:      tenant?.brandName      || '',
    contactEmail:   tenant?.contactEmail   || '',
    whatsappNumber: tenant?.whatsappNumber || '',
    plan:           tenant?.plan           || 'starter',
    status:         tenant?.status         || 'trial',
    workflowType:   tenant?.workflowType   || 'basic',
    monthlyFee:     tenant?.monthlyFee     || 950,
    aiEnabled:      tenant?.aiEnabled      ?? true,
    industry:       tenant?.industry       || 'rental_agency',
    ownerPhone:     tenant?.ownerPhone     || '',
    feeMode:        tenant?.paymentSettings?.convenienceFee?.type === 'gross_up' ? 'gross_up' : 'absorb',
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const iStyle = { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid ' + c.borderDim, borderRadius: '10px', color: c.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', marginBottom: '14px' };
  const labelStyle = { color: c.muted, fontSize: '12px', marginBottom: '6px', display: 'block' };

  const handleSave = async () => {
    if (!form.businessName) { setError('Business name is required'); return; }
    if (!form.contactEmail)  { setError('Contact email is required'); return; }
    setSaving(true); setError('');

    const payload = {
      ...form,
      paymentSettings: {
        enabled: true,
        convenienceFee: {
          type:   form.feeMode === 'gross_up' ? 'gross_up' : 'absorb',
          paidBy: form.feeMode === 'gross_up' ? 'customer' : 'business',
        },
      },
    };

    try {
      if (isNew) {
        await api.post('/tenants', payload);
      } else {
        await api.put('/tenants/' + tenant._id, payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save client');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: '560px', background: c.surface, borderRadius: '24px', border: '1px solid ' + c.border, padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: '900', color: c.lime }}>
            {isNew ? '+ Add Client' : 'Edit — ' + tenant.businessName}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontSize: '20px' }}>×</button>
        </div>

        {error && <div style={{ background: c.red + '18', border: '1px solid ' + c.red + '33', borderRadius: '10px', padding: '12px 16px', color: c.red, fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

        <p style={{ ...labelStyle, color: c.lime, fontWeight: '600', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em', marginBottom: '12px' }}>Business Details</p>
        <label style={labelStyle}>Business Name *</label>
        <input value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="ABC Rentals" style={iStyle} />
        <label style={labelStyle}>Brand Name</label>
        <input value={form.brandName} onChange={e => set('brandName', e.target.value)} placeholder="Displayed to renters" style={iStyle} />
        <label style={labelStyle}>Contact Email *</label>
        <input value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="admin@abcrentals.co.za" style={iStyle} />
        <label style={labelStyle}>WhatsApp Number</label>
        <input value={form.whatsappNumber} onChange={e => set('whatsappNumber', e.target.value)} placeholder="whatsapp:+27821234567" style={iStyle} />
        <label style={labelStyle}>Owner Personal WhatsApp</label>
        <input value={form.ownerPhone || ''} onChange={e => set('ownerPhone', e.target.value)} placeholder="+27831234567" style={iStyle} />

        <label style={labelStyle}>Payment Processing Fee</label>
        <p style={{ color: c.muted, fontSize: '12px', marginBottom: '8px' }}>Who covers the Paystack + platform fees?</p>
        <select value={form.feeMode || 'absorb'} onChange={e => set('feeMode', e.target.value)} style={{ ...iStyle, cursor: 'pointer' }}>
          <option value="absorb">Business absorbs — customer pays exact price</option>
          <option value="gross_up">Pass to customer — customer covers all fees</option>
        </select>

        <p style={{ ...labelStyle, color: c.lime, fontWeight: '600', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em', marginBottom: '12px', marginTop: '8px' }}>Plan & Status</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Plan</label>
            <select value={form.plan} onChange={e => {
              set('plan', e.target.value);
              set('monthlyFee', e.target.value === 'starter' ? 950 : e.target.value === 'growth' ? 2450 : 0);
            }} style={{ ...iStyle, marginBottom: 0 }}>
              <option value="starter">Starter — R950/mo</option>
              <option value="growth">Growth — R2,450/mo</option>
              <option value="enterprise">Enterprise — Custom</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...iStyle, marginBottom: 0 }}>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <p style={{ ...labelStyle, color: c.lime, fontWeight: '600', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em', marginTop: '16px', marginBottom: '12px' }}>Workflow</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Workflow Type</label>
            <select value={form.workflowType} onChange={e => set('workflowType', e.target.value)} style={{ ...iStyle, marginBottom: 0 }}>
              <option value="basic">Basic</option>
              <option value="full">Full</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Monthly Fee (R)</label>
            <input type="number" value={form.monthlyFee} onChange={e => set('monthlyFee', Number(e.target.value))} style={{ ...iStyle, marginBottom: 0 }} />
          </div>
        </div>

        <p style={{ ...labelStyle, color: c.lime, fontWeight: '600', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em', marginTop: '16px', marginBottom: '12px' }}>AI Settings</p>
        <div style={{ background: c.surface, borderRadius: '12px', padding: '14px 16px', border: '1px solid ' + c.borderDim }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <input type="checkbox" id="aiEnabled" checked={form.aiEnabled} onChange={e => set('aiEnabled', e.target.checked)} style={{ cursor: 'pointer', accentColor: c.lime, width: '16px', height: '16px' }} />
            <label htmlFor="aiEnabled" style={{ color: c.text, fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}>Enable AI lead summaries</label>
          </div>
        </div>

        <p style={{ ...labelStyle, color: c.lime, fontWeight: '600', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em', marginTop: '16px', marginBottom: '12px' }}>Industry</p>
        <select value={form.industry || 'appointment'} onChange={e => set('industry', e.target.value)} style={{ ...iStyle }}>
          <option value="driving_school">🚦 Driving School</option>
          <option value="salon">💇 Salon / Barbershop</option>
          <option value="appointment">📅 Appointment Booking</option>
          <option value="order_taking">🛒 Order Taking</option>
          <option value="medical">🏥 Medical Practice</option>
          <option value="car_dealership">🚗 Car Dealership</option>
          <option value="law_firm">⚖️ Law Firm</option>
          <option value="recruitment">💼 Recruitment Agency</option>
          <option value="education">🎓 Education / Training</option>
          <option value="rental_agency">🏠 Rental Agency</option>
          <option value="property_sales">🏡 Property Sales</option>
          <option value="custom">⚙️ General / Custom</option>
        </select>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button onClick={onClose} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid ' + c.borderDim, color: c.muted, borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 28px', background: c.lime, color: '#050505', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
            {saving ? 'Saving...' : isNew ? 'Add Client' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}