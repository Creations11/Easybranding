// src/pages/Home.jsx
// Theme: Machines working with organic matter
// Energy: South African hustle — STABLE, no movement
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const t = {
  bg:      '#080A06',
  surface: '#0E110B',
  card:    '#141810',
  lime:    '#B8F040',
  earth:   '#C4873A',
  moss:    '#4A6741',
  sage:    '#7A9E6E',
  text:    '#EEF0E8',
  muted:   '#8A9080',
  border:  'rgba(184,240,64,0.12)',
};

const GrainSVG = () => (
  <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.025, pointerEvents: 'none', zIndex: 0 }}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)"/>
  </svg>
);

function WhatsAppPreview() {
  const messages = [
    { dir: 'in',  text: 'Hi' },
    { dir: 'out', text: 'Sawubona 👋\n\nWelcome to Alexandra Rentals.\n\nReply with your full name to start.' },
    { dir: 'in',  text: 'Thabo Nkosi' },
    { dir: 'out', text: 'What type of property are you looking for?' },
    { dir: 'in',  text: 'Backroom' },
    { dir: 'out', text: '✅ Great news, Thabo!\n\nWe have properties in your range.\n\nOur team will call you within 24 hours. 🏠' },
  ];

  return (
    <div style={{
      background: '#1a1a1a', borderRadius: '24px', overflow: 'hidden',
      width: '100%', maxWidth: '320px',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 32px 64px rgba(0,0,0,0.6)',
    }}>
      <div style={{ background: '#075e54', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${t.lime}, ${t.moss})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🏠</div>
        <div>
          <p style={{ color: '#fff', fontWeight: '600', fontSize: '14px', margin: 0 }}>Alexandra Rentals</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', margin: 0 }}>Automated · Always on</p>
        </div>
      </div>
      <div style={{ background: '#0b141a', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.dir === 'out' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
            <div style={{
              padding: '9px 13px',
              borderRadius: msg.dir === 'out' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: msg.dir === 'out' ? '#005c4b' : '#202c33',
              color: '#e9edef', fontSize: '12px', lineHeight: '1.5', whiteSpace: 'pre-wrap',
            }}>{msg.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: '🤖', title: 'Always On', desc: '24/7 automated conversations. Your business qualifies leads while you sleep.' },
    { icon: '🌱', title: 'Grows With You', desc: 'Start with one agency. Scale to ten. Each client gets their own number and workflow.' },
    { icon: '💬', title: 'Human When It Counts', desc: 'Agents jump into any conversation, send messages, then hand back to the bot.' },
    { icon: '📊', title: 'Full Visibility', desc: 'Live dashboard. Every lead, every conversation, every qualification in one place.' },
    { icon: '⚡', title: 'Instant Response', desc: 'Renters get a reply in seconds. No waiting. No missed leads. No lost business.' },
    { icon: '🏘️', title: 'Built for SA', desc: 'Designed for the South African rental market. From Alexandra to Sandton.' },
  ];

  const steps = [
    { n: '01', icon: '📱', title: 'Renter says Hi', desc: 'They message your WhatsApp. The bot responds in seconds.' },
    { n: '02', icon: '🌿', title: 'Machine qualifies', desc: 'Four smart questions. Budget, property, area, move-in date.' },
    { n: '03', icon: '✅', title: 'Lead captured', desc: 'Saved automatically with full conversation history.' },
    { n: '04', icon: '🤝', title: 'Your team closes', desc: 'Agent sees the lead, makes contact, closes the deal.' },
  ];

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: "'Outfit', sans-serif", overflowX: 'hidden' }}>
      <GrainSVG />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&display=swap" rel="stylesheet" />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(184,240,64,0.2); }
        html { scroll-behavior: smooth; }
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .btn-lime { transition: box-shadow 0.2s ease, background 0.2s ease; }
        .btn-lime:hover { box-shadow: 0 8px 28px rgba(184,240,64,0.3); background: #C8FF50 !important; }
        .btn-ghost { transition: background 0.2s ease, border-color 0.2s ease; }
        .btn-ghost:hover { background: rgba(184,240,64,0.06) !important; }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; padding: 80px 20px 40px !important; }
          .hero-grid > div:last-child { display: none !important; }
          .how-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .how-grid > div { border-radius: 16px !important; }
          .how-arrow { display: none !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .preview-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .footer-inner { flex-direction: column !important; text-align: center !important; gap: 16px !important; }
          .section-pad { padding: 60px 20px !important; }
          .hero-section { padding: 80px 20px 40px !important; min-height: auto !important; }
          .trust-bar { padding: 16px 20px !important; }
          .cta-section { padding: 60px 20px !important; }
          .nav-pad { padding: 0 16px !important; }
        }

      `}</style>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px', height: '70px',
        display: 'flex', alignItems: 'center',
        background: scrolled ? 'rgba(8,10,6,0.96)' : 'rgba(8,10,6,0.7)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${scrolled ? t.border : 'transparent'}`,
        transition: 'border-color 0.3s ease, background 0.3s ease',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span style={{ fontSize: '20px' }}>🌿</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: t.text }}>Easy Branding <span style={{ color: t.lime }}>AI</span></span>
          </Link>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link to="/login" className="btn-ghost" style={{ padding: '9px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: t.muted, borderRadius: '10px', textDecoration: 'none', fontSize: '14px' }}>Sign In</Link>
            <Link to="/register" className="btn-lime" style={{ padding: '9px 22px', background: t.lime, color: '#080A06', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 40px 80px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '20%', right: '8%', width: '420px', height: '420px', background: 'radial-gradient(ellipse, rgba(74,103,65,0.12) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '2%', width: '320px', height: '320px', background: 'radial-gradient(ellipse, rgba(184,240,64,0.04) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />

        <div className="hero-grid" style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(74,103,65,0.18)', border: '1px solid rgba(74,103,65,0.35)', borderRadius: '999px', padding: '6px 16px', marginBottom: '36px' }}>
              <span style={{ width: '6px', height: '6px', background: t.lime, borderRadius: '50%', display: 'inline-block' }} />
              <span style={{ color: t.sage, fontSize: '13px', fontWeight: '500' }}>Live in South Africa</span>
            </div>

            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(48px, 5vw, 76px)', fontWeight: '900', lineHeight: '1.02', marginBottom: '28px', letterSpacing: '-0.02em' }}>
              Built for the<br />
              <span style={{ fontStyle: 'italic', color: t.lime }}>hustle.</span><br />
              Runs while<br />
              you <span style={{ color: t.earth }}>sleep.</span>
            </h1>

            <p style={{ fontSize: '17px', color: t.muted, lineHeight: '1.7', marginBottom: '44px', maxWidth: '420px' }}>
              Easy Branding AI automates your WhatsApp conversations — qualified leads land in your dashboard while you focus on closing deals.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn-lime" style={{ padding: '15px 36px', background: t.lime, color: '#080A06', borderRadius: '12px', fontWeight: '700', fontSize: '15px', textDecoration: 'none' }}>
                Start Free Trial →
              </Link>
              <button onClick={() => setDemoOpen(true)} className="btn-ghost" style={{ padding: '15px 28px', background: 'transparent', color: t.text, border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', fontWeight: '500', fontSize: '15px', cursor: 'pointer' }}>
                See it live
              </button>
            </div>

            <div style={{ marginTop: '52px', display: 'flex', gap: '40px', paddingTop: '36px', borderTop: `1px solid ${t.border}` }}>
              {[
                { v: '24/7', l: 'Always on' },
                { v: '100%', l: 'Automated' },
                { v: '4',    l: 'Questions to qualify' },
              ].map((s, i) => (
                <div key={i}>
                  <p style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: '700', color: t.lime, marginBottom: '4px' }}>{s.v}</p>
                  <p style={{ fontSize: '13px', color: t.muted }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <WhatsAppPreview />
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────── */}
      <div className="trust-bar" style={{ background: t.surface, padding: '18px 40px', borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[...Array(5)].map((_, i) => <span key={i} style={{ color: t.earth, fontSize: '14px' }}>★</span>)}
          </div>
          <p style={{ color: t.muted, fontSize: '14px' }}>Helping rental agencies across South Africa automate their WhatsApp pipeline</p>
        </div>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="section-pad" style={{ padding: '120px 40px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <p style={{ color: t.sage, fontSize: '11px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>How it works</p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(34px, 4vw, 56px)', fontWeight: '900', letterSpacing: '-0.02em', lineHeight: '1.1' }}>
              From message to<br /><span style={{ fontStyle: 'italic', color: t.lime }}>qualified lead</span> in minutes.
            </h2>
          </div>

          <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px' }}>
            {steps.map((step, i) => (
              <div key={i} className="card-hover" style={{
                background: t.card, padding: '36px 24px',
                borderRadius: i === 0 ? '16px 0 0 16px' : i === 3 ? '0 16px 16px 0' : '0',
                border: '1px solid rgba(255,255,255,0.05)',
                position: 'relative',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '14px' }}>{step.icon}</div>
                <p style={{ fontFamily: 'monospace', fontSize: '11px', color: t.lime, marginBottom: '10px', opacity: 0.5 }}>{step.n}</p>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{step.title}</h3>
                <p style={{ color: t.muted, fontSize: '14px', lineHeight: '1.6' }}>{step.desc}</p>
                {i < 3 && (
                  <div className="how-arrow" style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', background: t.lime, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: t.bg, fontWeight: '800', zIndex: 1 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="section-pad" style={{ padding: '100px 40px', background: t.surface }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ color: t.sage, fontSize: '11px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>Platform features</p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: '900', letterSpacing: '-0.02em' }}>
              Everything your agency needs.<br /><span style={{ color: t.earth, fontStyle: 'italic' }}>Nothing it doesn't.</span>
            </h2>
          </div>
          <div className="features-grid" className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {features.map((f, i) => (
              <div key={i} className="card-hover" style={{ background: t.card, padding: '28px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: '44px', height: '44px', background: 'rgba(184,240,64,0.07)', border: `1px solid ${t.border}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ color: t.muted, fontSize: '14px', lineHeight: '1.6' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ────────────────────────────────── */}
      <section className="section-pad" style={{ padding: '120px 40px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="preview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <p style={{ color: t.sage, fontSize: '11px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>Operations dashboard</p>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(30px, 3.5vw, 48px)', fontWeight: '900', letterSpacing: '-0.02em', marginBottom: '18px', lineHeight: '1.1' }}>
                See everything.<br /><span style={{ color: t.lime, fontStyle: 'italic' }}>Miss nothing.</span>
              </h2>
              <p style={{ color: t.muted, fontSize: '16px', lineHeight: '1.7', marginBottom: '32px' }}>
                Live lead feed, conversation history, agent controls, viewing schedules — your entire rental pipeline in one place.
              </p>
              {['Live WhatsApp conversation view', 'Qualify, assign, and schedule in one click', 'Team management with role-based access', 'Alerts for stale leads so nothing slips'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '20px', height: '20px', background: 'rgba(184,240,64,0.1)', border: `1px solid ${t.border}`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: t.lime, fontSize: '11px' }}>✓</span>
                  </div>
                  <span style={{ color: t.muted, fontSize: '14px' }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ background: t.card, borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                {['#ff5f57','#ffbd2e','#28c840'].map(bg => <div key={bg} style={{ width: '10px', height: '10px', borderRadius: '50%', background: bg }} />)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                {[{ l: 'Total Leads', v: '47', c: t.text }, { l: 'Qualified', v: '31', c: t.lime }, { l: 'Today', v: '8', c: t.earth }].map(s => (
                  <div key={s.l} style={{ background: t.surface, borderRadius: '10px', padding: '12px' }}>
                    <p style={{ color: t.muted, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{s.l}</p>
                    <p style={{ color: s.c, fontSize: '22px', fontWeight: '800', fontFamily: "'Fraunces', serif" }}>{s.v}</p>
                  </div>
                ))}
              </div>
              {[
                { name: 'Thabo Nkosi',    status: 'qualified',     c: t.lime },
                { name: 'Sipho Dube',     status: 'qualified',     c: t.lime },
                { name: 'Naledi Khumalo', status: 'in progress',   c: t.earth },
                { name: 'Zanele Mokoena', status: 'not qualified', c: '#f87171' },
              ].map((lead, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: t.surface, borderRadius: '8px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${t.moss}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: t.lime, fontWeight: '700' }}>
                      {lead.name.charAt(0)}
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: '500' }}>{lead.name}</p>
                  </div>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${lead.c}15`, color: lead.c, fontWeight: '600' }}>{lead.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section className="section-pad" className="section-pad" style={{ padding: '100px 40px', background: t.surface }} id="pricing">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ color: t.sage, fontSize: '11px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>Pricing</p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(34px, 4vw, 52px)', fontWeight: '900', letterSpacing: '-0.02em' }}>
              Start free.<br /><span style={{ color: t.lime, fontStyle: 'italic' }}>Scale when ready.</span>
            </h2>
          </div>

          <div className="features-grid" className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {[
              { name: 'Starter',    price: 'R950',   period: '/mo', highlight: false, features: ['1 WhatsApp number', 'Automated qualification', 'Lead dashboard', 'Up to 3 agents', 'Email support'] },
              { name: 'Growth',     price: 'R2,450', period: '/mo', highlight: true,  features: ['2 WhatsApp numbers', 'Custom workflow messages', 'Full agent workspace', 'Viewing scheduling', 'Priority support', 'Up to 10 agents'] },
              { name: 'Enterprise', price: 'Custom', period: '',    highlight: false, features: ['Unlimited numbers', 'Custom qualification rules', 'Dedicated onboarding', 'SLA guarantee', 'API access', 'Unlimited agents'] },
            ].map((plan, i) => (
              <div key={i} className="card-hover" style={{
                background: plan.highlight ? 'linear-gradient(160deg, #182A08, #101808)' : t.card,
                borderRadius: '20px', padding: '32px 26px',
                border: plan.highlight ? '2px solid rgba(184,240,64,0.3)' : '1px solid rgba(255,255,255,0.06)',
                position: 'relative',
              }}>
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: t.lime, color: t.bg, fontSize: '10px', fontWeight: '800', padding: '4px 16px', borderRadius: '999px', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>MOST POPULAR</div>
                )}
                <p style={{ color: t.muted, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>{plan.name}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                  <span style={{ fontFamily: "'Fraunces', serif", fontSize: '48px', fontWeight: '900', color: plan.highlight ? t.lime : t.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ color: t.muted, fontSize: '14px' }}>{plan.period}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '28px' }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: t.lime, fontSize: '12px', flexShrink: 0 }}>✓</span>
                      <span style={{ color: t.muted, fontSize: '13px' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link to={`/register${plan.price === 'Custom' ? '' : `?plan=${plan.name.toLowerCase()}`}`} className={plan.highlight ? 'btn-lime' : 'btn-ghost'} style={{
                  display: 'block', textAlign: 'center', padding: '13px',
                  background: plan.highlight ? t.lime : 'rgba(255,255,255,0.05)',
                  color: plan.highlight ? t.bg : t.text,
                  borderRadius: '10px', fontWeight: '700', fontSize: '14px',
                  textDecoration: 'none', border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}>
                  {plan.price === 'Custom' ? 'Talk to us' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="cta-section" style={{ padding: '120px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(74,103,65,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ fontSize: '56px', marginBottom: '28px' }}>🌿</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: '900', letterSpacing: '-0.02em', marginBottom: '20px', lineHeight: '1.05' }}>
            Ready to let your<br /><span style={{ color: t.lime, fontStyle: 'italic' }}>business breathe?</span>
          </h2>
          <p style={{ color: t.muted, fontSize: '17px', lineHeight: '1.7', marginBottom: '44px' }}>
            Join rental agencies across South Africa who've automated their WhatsApp pipeline and reclaimed their time.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-lime" style={{ padding: '16px 40px', background: t.lime, color: t.bg, borderRadius: '12px', fontWeight: '700', fontSize: '16px', textDecoration: 'none' }}>
              Start Free Trial →
            </Link>
            <a href="https://wa.me/27846549578?text=Hi, I want to learn more about Easy Branding AI" target="_blank" rel="noreferrer" className="btn-ghost" style={{ padding: '16px 32px', background: 'transparent', color: t.text, border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', fontWeight: '500', fontSize: '16px', textDecoration: 'none' }}>
              📱 WhatsApp us
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ padding: '28px 40px', borderTop: `1px solid ${t.border}` }}>
        <div className="footer-inner" style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🌿</span>
            <span style={{ fontWeight: '700', color: t.lime, fontSize: '15px' }}>Easy Branding AI</span>
          </div>
          <p style={{ color: t.muted, fontSize: '12px' }}>© 2026 Easy Branding AI · Built for South Africa</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/login"    style={{ color: t.muted, fontSize: '13px', textDecoration: 'none' }}>Sign In</Link>
            <Link to="/register" style={{ color: t.lime,  fontSize: '13px', textDecoration: 'none' }}>Get Started</Link>
            <a href="#pricing"   style={{ color: t.muted, fontSize: '13px', textDecoration: 'none' }}>Pricing</a>
          </div>
        </div>
      </footer>

      {/* ── Demo Modal ────────────────────────────────────────── */}
      {demoOpen && (
        <div onClick={() => setDemoOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: t.card, borderRadius: '20px', padding: '36px', maxWidth: '380px', width: '100%', border: `1px solid ${t.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: '44px', marginBottom: '18px' }}>📱</div>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: '800', marginBottom: '10px' }}>Try it live</h3>
            <p style={{ color: t.muted, marginBottom: '24px', lineHeight: '1.6', fontSize: '14px' }}>Send a WhatsApp to our demo number and experience the full qualification flow in real time.</p>
            <a href="https://wa.me/14155238886?text=Hi" target="_blank" rel="noreferrer" style={{ display: 'block', padding: '14px', background: '#25d366', color: '#fff', borderRadius: '10px', fontWeight: '700', fontSize: '15px', textDecoration: 'none', marginBottom: '10px' }}>
              Open WhatsApp Demo →
            </a>
            <button onClick={() => setDemoOpen(false)} style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', fontSize: '13px' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}