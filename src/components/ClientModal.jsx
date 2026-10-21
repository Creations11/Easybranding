// src/components/ClientModal.jsx
//
// FIX APPLIED (28 June 2026):
// No UI anywhere allowed setting a question's expected answer type
// (phone/email/number) at creation time — confirmed by checking
// every client-editing component in the codebase. This meant a real
// "what's your contact number" question accepted a single digit as
// valid, since nothing declared what kind of answer it expected.
// Added a new "Questions" section using QuestionEditor.jsx, wired to
// customWorkflow.questions (already in the backend's allowed-fields
// whitelist from an earlier fix, so this persists correctly).
import { useState, useEffect } from 'react';
import { loadProducts } from '../config/plans';
import api from '../api';
import QuestionEditor from './QuestionEditor';
import { c, iStyle, labelStyle } from './clientModal/styles';
import EftDetails from './clientModal/EftDetails';
import PaymentSplit from './clientModal/PaymentSplit';
import Addons from './clientModal/Addons';
import BotMessages from './clientModal/BotMessages';

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
    // No default price. Every hardcoded one in this system has been wrong at
    // least once — this said 950 while signup charged 999 — and an unset fee
    // is honest where a guessed one silently bills somebody. Choosing a
    // product below sets it.
    monthlyFee:     tenant?.monthlyFee     ?? '',
    aiEnabled:      tenant?.aiEnabled      ?? true,
    industry:       tenant?.industry       || 'rental_agency',
    ownerPhone:     tenant?.ownerPhone     || '',
    feeMode:        tenant?.paymentSettings?.convenienceFee?.type === 'gross_up' ? 'gross_up' : 'absorb',
    // Paystack subaccount for payment splits. This field MUST round-trip:
    // before it existed, saving this form rebuilt paymentSettings without
    // it and wiped the split (2026-07-20 — a live payment went 100% to
    // the platform, tenant got R0).
    paystackSubaccount: tenant?.paymentSettings?.paystackSubaccount || '',
    // NEW: per-tenant paid top-ups, independent of plan — e.g. an R99
    // tenant who buys invoicing separately. Reads any addons already
    // switched on via the WhatsApp upsell flow, so saving here can't
    // accidentally wipe one out.
    addons: {
      payments:  tenant?.addons?.payments  || false,
      invoicing: tenant?.addons?.invoicing || false,
      ownNumber: tenant?.addons?.ownNumber || false,
      extraFlow: tenant?.addons?.extraFlow || false,
    },
    // Customer-facing EFT details. SEPARATE from paystackSubaccount above:
    // that is where Paystack pays the client OUT, this is where their
    // customers pay IN. Usually the same account, not always — and publishing
    // the wrong one is not noticed until the money is somewhere else.
    //
    // Exists because plenty of customers will not tap a payment link from a
    // number they don't know. An account number asks for no trust: they type
    // it into their own banking app.
    eft: {
      enabled:       tenant?.paymentSettings?.eft?.enabled       || false,
      bankName:      tenant?.paymentSettings?.eft?.bankName      || '',
      accountName:   tenant?.paymentSettings?.eft?.accountName   || '',
      accountNumber: tenant?.paymentSettings?.eft?.accountNumber || '',
      branchCode:    tenant?.paymentSettings?.eft?.branchCode    || '',
      accountType:   tenant?.paymentSettings?.eft?.accountType   || '',
    },
  });
  // NEW: custom questions, separate from `form` since this is a
  // nested array (customWorkflow.questions), not a flat field.
  const [products, setProducts] = useState([]);
  useEffect(() => { loadProducts().then(setProducts).catch(() => {}); }, []);
  const [questions, setQuestions] = useState(tenant?.customWorkflow?.questions || []);
  // Bot Messages — tenantWorkflowService.js's getMessage() reads
  // tenant.customMessages.{welcome,qualified,rejected}, but no UI ever
  // exposed them (found 2026-07-21: "no space to paste the greeting").
  // Prefilled from the tenant so a save can't wipe an existing message.
  const [botMsgs, setBotMsgs] = useState({
    welcome:   tenant?.customMessages?.welcome   || '',
    qualified: tenant?.customMessages?.qualified || '',
    rejected:  tenant?.customMessages?.rejected  || '',
  });
  const setMsg = (k, v) => setBotMsgs(prev => ({ ...prev, [k]: v }));

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const toggleAddon = (key) => setForm(prev => ({ ...prev, addons: { ...prev.addons, [key]: !prev.addons[key] } }));
  const setEft = (key, value) => setForm(prev => ({ ...prev, eft: { ...prev.eft, [key]: value } }));

  // Everything a person needs to actually make the transfer. Half an account
  // number is worse than none: the customer sends money into the void and
  // believes they have paid. Mirrors isUsable() in eftPaymentService.
  const eftComplete = Boolean(
    form.eft?.accountName?.trim() &&
    form.eft?.accountNumber?.trim() &&
    (form.eft?.bankName?.trim() || form.eft?.branchCode?.trim())
  );


  const handleSave = async () => {
    if (!form.businessName) { setError('Business name is required'); return; }
    if (!form.contactEmail)  { setError('Contact email is required'); return; }

    // NEW: validate questions before saving — every question needs
    // at minimum a key and ask text, or the bot will break on it.
    for (const q of questions) {
      if (!q.key || !q.ask) {
        setError('Every question needs a field key and question text. Check your questions list.');
        return;
      }
    }
    const keys = questions.map(q => q.key);
    if (new Set(keys).size !== keys.length) {
      setError('Question field keys must be unique — you have a duplicate key.');
      return;
    }

    setSaving(true); setError('');

    const payload = {
      ...form,
      paymentSettings: {
        enabled: true,
        convenienceFee: {
          type:   form.feeMode === 'gross_up' ? 'gross_up' : 'absorb',
          paidBy: form.feeMode === 'gross_up' ? 'customer' : 'business',
        },
        // Only send the subaccount when non-empty — the backend merges
        // paymentSettings subfields, so omitting it preserves whatever
        // is stored, while an empty string would overwrite it to "".
        // subaccountActive must ride along: initializePayment requires
        // BOTH fields before it attaches the split (code alone silently
        // doesn't split).
        ...(form.paystackSubaccount?.trim()
          ? { paystackSubaccount: form.paystackSubaccount.trim(), subaccountActive: true }
          : {}),
        // Whole object, trimmed. The backend $sets paymentSettings subfields
        // by key, so this replaces `eft` wholesale — which is what we want:
        // the form holds every field, so a cleared box means cleared.
        eft: {
          enabled:       Boolean(form.eft?.enabled && eftComplete),
          bankName:      form.eft?.bankName?.trim()      || null,
          accountName:   form.eft?.accountName?.trim()   || null,
          accountNumber: form.eft?.accountNumber?.replace(/\s/g, '') || null,
          branchCode:    form.eft?.branchCode?.replace(/\s/g, '')    || null,
          accountType:   form.eft?.accountType?.trim()   || null,
        },
      },
      // NEW: persist questions under customWorkflow, alongside
      // whatever workflowMode/qualifyRules already exist there.
      customWorkflow: {
        ...(tenant?.customWorkflow || {}),
        questions,
      },
      customMessages: {
        welcome:   botMsgs.welcome.trim()   || null,
        qualified: botMsgs.qualified.trim() || null,
        rejected:  botMsgs.rejected.trim()  || null,
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

        <label style={labelStyle}>Paystack Subaccount (payment split)</label>
        <p style={{ color: c.muted, fontSize: '12px', marginBottom: '8px' }}>The client's Paystack subaccount code (ACCT_...). Payments split to their bank automatically. Leave blank to keep the current value.</p>
        <input value={form.paystackSubaccount || ''} onChange={e => set('paystackSubaccount', e.target.value)} placeholder="ACCT_xxxxxxxxxxxx" style={iStyle} />

        <EftDetails form={form} setEft={setEft} eftComplete={eftComplete} />

        <PaymentSplit tenant={tenant} isNew={isNew} businessName={form.businessName} onSubaccount={(code) => set('paystackSubaccount', code)} />

        <p style={{ ...labelStyle, color: c.lime, fontWeight: '600', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em', marginBottom: '12px', marginTop: '8px' }}>Plan & Status</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Plan</label>
            {/*
              Names and prices come from src/config/plans.js, the same table
              Onboarding sells from. This dropdown used to carry its own
              copy — "Starter R950" where signup said "Professional R999" —
              so opening a client here silently repriced them by R49 and
              renamed their plan.

              Changing the plan only ever sets a STARTING price. monthlyFee
              stays editable below because what a client pays is negotiated,
              not implied by the key: NovaCare is on growth at R599.
            */}
            {/*
              Products come from the API, not a table in this file. Choosing
              one sets BOTH the plan (feature limits) and monthlyFee (what
              they are charged) — the two are different things and were
              conflated across five copies until 2026-08-22.

              monthlyFee stays editable below: a product sets the standard
              price, and what a client actually pays is negotiated. NovaCare
              is on `growth` at R150.
            */}
            <select
              value={form.product || ''}
              onChange={e => {
                const chosen = products.find(p => p.key === e.target.value);
                if (!chosen) return;
                set('product', chosen.key);
                set('plan', chosen.plan);
                set('monthlyFee', chosen.price);
              }}
              style={{ ...iStyle, marginBottom: 0 }}
            >
              <option value="">
                {products.length ? `Current: ${form.plan} · R${form.monthlyFee}` : 'Loading prices…'}
              </option>
              {products.map(p => (
                <option key={p.key} value={p.key}>{p.label} — R{p.price}/mo</option>
              ))}
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

        <Addons addons={form.addons} toggleAddon={toggleAddon} />

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

        <BotMessages botMsgs={botMsgs} setMsg={setMsg} />

        {/* NEW: Custom Questions section — the actual fix. Every
            question's answer type is now a deliberate choice made
            here, not guessed at by the backend after the fact. */}
        <p style={{ ...labelStyle, color: c.lime, fontWeight: '600', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em', marginTop: '16px', marginBottom: '12px' }}>
          Custom Questions
        </p>
        <QuestionEditor questions={questions} onChange={setQuestions} />

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
          <option value="easy_branding">🌿 Easy Branding AI (own demo)</option>
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
