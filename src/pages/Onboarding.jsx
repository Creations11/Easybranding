// src/pages/Onboarding.jsx
//
// FIX APPLIED (26 June 2026):
// 1. monthlyFee was hardcoded to 950 regardless of which plan was
//    selected — but the live homepage's actual current price is
//    R999 (Professional tier). Every tenant created through this
//    flow was being silently written to the database at the wrong,
//    outdated price. Added a real plan-selection step instead of a
//    hidden hardcoded value, so the price written to the database
//    always matches what the business owner actually agreed to.
// 2. The internal plan enum (starter/growth/enterprise, per
//    Tenant.js) had drifted from the public-facing tier names
//    (Professional/Business/Enterprise on the homepage) — "starter"
//    was being saved while the customer-facing pricing page never
//    used that word at all. Mapped plan values to the real public
//    tier names and prices so the two can't drift apart again.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const c = {
  bg: '#06080A', surface: '#0D110C', card: '#121710',
  lime: '#B8F040', earth: '#C4873A', moss: '#4A6741',
  cyan: '#22d3ee', emerald: '#34d399', amber: '#fbbf24',
  text: '#EEF0E8', muted: '#8A9080',
  border: 'rgba(184,240,64,0.12)', borderDim: 'rgba(255,255,255,0.06)',
};

// FIX: single source of truth for plan -> public name -> price,
// matching the live homepage pricing exactly (Professional R999,
// Business R2,499, Enterprise Custom). Update this object, and both
// the onboarding form AND the database write stay in sync.
const PLANS = {
  starter:    { label: 'Professional', price: 999,  description: '1 WhatsApp number, up to 5 agents' },
  growth:     { label: 'Business',     price: 2499, description: '2 WhatsApp numbers, unlimited agents' },
  enterprise: { label: 'Enterprise',   price: null, description: 'Custom — contact us for pricing' },
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    brandName: '',
    contactEmail: '',
    contactPhone: '',
    industry: 'appointment',
    whatsappNumber: '',
    workflowType: 'full',
    ownerPhone: '',
    plan: 'starter',
  });

  const steps = [
    {
      title: 'Welcome to WABOS',
      icon: '🌿',
      description: "Let's get your business set up in under 15 minutes.",
      fields: [],
    },
    {
      title: 'Business Details',
      icon: '🏢',
      description: 'Tell us about your business.',
      fields: [
        { name: 'businessName', label: 'Business Name', placeholder: 'ABC Rentals', required: true },
        { name: 'brandName', label: 'Brand Name (shown to customers)', placeholder: 'ABC Rentals', required: false },
        { name: 'industry', label: 'Industry', placeholder: 'Select your industry', type: 'select', options: [
          'appointment', 'salon', 'driving_school', 'car_dealership', 'medical',
          'law_firm', 'recruitment', 'education', 'rental_agency', 'property_sales',
          'order_taking', 'custom'
        ], required: true },
      ],
    },
    {
      title: 'Contact Information',
      icon: '📞',
      description: 'How can we reach you and your customers?',
      fields: [
        { name: 'contactEmail', label: 'Your Email', placeholder: 'admin@abcrentals.co.za', type: 'email', required: true },
        { name: 'contactPhone', label: 'Your Phone Number', placeholder: '+27821234567', required: true },
        { name: 'ownerPhone', label: 'Owner WhatsApp (for commands)', placeholder: '+27821234567', required: true },
        { name: 'whatsappNumber', label: 'Business WhatsApp Number', placeholder: 'whatsapp:+27821234567', required: true },
      ],
    },
    {
      title: 'Workflow Configuration',
      icon: '⚙️',
      description: 'Choose how you want the bot to qualify leads.',
      fields: [
        { name: 'workflowType', label: 'Workflow Type', type: 'select', options: [
          { value: 'full', label: 'Full — 6 questions including income' },
          { value: 'basic', label: 'Basic — 4 questions, no income check' },
        ], required: true },
      ],
    },
    {
      // FIX: plan selection is now a real step, not a hidden
      // hardcoded value. Options and prices come from PLANS above,
      // the same source used when building the database payload.
      title: 'Choose Your Plan',
      icon: '💳',
      description: 'Pick the plan that fits your business.',
      fields: [
        { name: 'plan', label: 'Plan', type: 'select', options: Object.entries(PLANS).map(([value, p]) => ({
          value,
          label: p.price ? `${p.label} — R${p.price}/month` : `${p.label} — ${p.description}`,
        })), required: true },
      ],
    },
    {
      title: 'Almost There!',
      icon: '🚀',
      description: 'Review your details and launch your business.',
      fields: [],
    },
  ];

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleNext = () => {
    const currentStep = steps[step];
    const requiredFields = currentStep.fields.filter(f => f.required);
    for (const field of requiredFields) {
      if (!form[field.name]?.trim()) {
        alert(`Please fill in ${field.label}`);
        return;
      }
    }
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const selectedPlan = PLANS[form.plan] || PLANS.starter;
      const payload = {
        ...form,
        status: 'trial',
        plan: form.plan,
        // FIX: monthlyFee now comes from the same PLANS table shown
        // to the customer during selection — never silently hardcoded.
        // Enterprise has no fixed price (null), so it's omitted and
        // handled as a custom-quote case rather than written as 0
        // or a guessed number.
        monthlyFee: selectedPlan.price,
        workflowType: form.workflowType || 'full',
      };
      await api.post('/tenants', payload);
      // After successful creation, redirect to dashboard
      navigate('/admin');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      background: c.bg,
      color: c.text,
      fontFamily: "'Outfit', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&display=swap" rel="stylesheet" />

      <div style={{
        width: '100%',
        maxWidth: '560px',
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: '24px',
        padding: '40px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>{currentStep.icon}</div>
          <h1 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: '28px',
            fontWeight: '900',
          }}>
            {currentStep.title}
          </h1>
          <p style={{ color: c.muted, fontSize: '15px', marginTop: '4px' }}>
            {currentStep.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '12px',
            color: c.muted,
          }}>
            <span>Step {step + 1} of {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div style={{
            background: c.bg,
            borderRadius: '999px',
            height: '6px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: c.lime,
              borderRadius: '999px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Fields */}
        <div style={{ marginBottom: '32px' }}>
          {currentStep.fields.map(field => (
            <div key={field.name} style={{ marginBottom: '16px' }}>
              <label style={{
                color: c.muted,
                fontSize: '13px',
                marginBottom: '6px',
                display: 'block',
              }}>
                {field.label} {field.required && <span style={{ color: c.lime }}>*</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  value={form[field.name] || ''}
                  onChange={e => set(field.name, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: c.card,
                    border: `1px solid ${c.borderDim}`,
                    color: c.text,
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="">Select...</option>
                  {field.options.map(opt => (
                    typeof opt === 'string' ? (
                      <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                    ) : (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    )
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || 'text'}
                  value={form[field.name] || ''}
                  onChange={e => set(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: c.card,
                    border: `1px solid ${c.borderDim}`,
                    color: c.text,
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              )}
            </div>
          ))}

          {/* Review step */}
          {step === steps.length - 1 && (
            <div style={{
              background: c.card,
              border: `1px solid ${c.border}`,
              borderRadius: '12px',
              padding: '16px',
              marginTop: '8px',
            }}>
              {Object.entries(form).map(([key, value]) => {
                // FIX: show the real plan label + price in the review
                // step, not the raw internal value ("starter"), so
                // the customer sees exactly what they're agreeing to.
                if (key === 'plan') {
                  const p = PLANS[value] || PLANS.starter;
                  const display = p.price ? `${p.label} — R${p.price}/month` : `${p.label} — Custom pricing`;
                  return (
                    <div key={key} style={{
                      display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                      borderBottom: `1px solid ${c.borderDim}`, fontSize: '13px',
                    }}>
                      <span style={{ color: c.muted }}>Plan:</span>
                      <span style={{ color: c.lime, fontWeight: '700' }}>{display}</span>
                    </div>
                  );
                }
                return (
                  <div key={key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: `1px solid ${c.borderDim}`,
                    fontSize: '13px',
                  }}>
                    <span style={{ color: c.muted }}>{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span style={{ color: c.text }}>{value || '—'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
          <button
            onClick={handleBack}
            disabled={step === 0}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: `1px solid ${c.borderDim}`,
              color: step === 0 ? c.muted : c.text,
              borderRadius: '10px',
              cursor: step === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: '500',
              opacity: step === 0 ? 0.5 : 1,
            }}
          >
            Back
          </button>

          {step === steps.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '12px 32px',
                background: c.lime,
                color: '#050505',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontFamily: 'inherit',
                fontSize: '14px',
              }}
            >
              {loading ? 'Launching...' : '🚀 Launch Business'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              style={{
                padding: '12px 32px',
                background: c.lime,
                color: '#050505',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '14px',
              }}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}