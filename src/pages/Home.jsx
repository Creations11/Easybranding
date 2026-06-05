// src/pages/Home.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const c = {
  bg:      '#040403',
  surface: '#0A0A08',
  card:    '#111110',
  lime:    '#a3e635',
  emerald: '#34d399',
  amber:   '#fbbf24',
  text:    '#f0efe8',
  muted:   '#8a8a7a',
  border:  'rgba(163,230,53,0.15)',
  glow:    'rgba(163,230,53,0.08)',
};

// ── Animated counter ──────────────────────────────────────────
function Counter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(ease * end));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ── WhatsApp conversation preview ─────────────────────────────
function WhatsAppDemo() {
  const messages = [
    { dir: 'in',  text: 'Hi',                                   delay: 0 },
    { dir: 'out', text: 'Welcome to Alexandra Rentals 🏠\n\nReply with your full name to start your property search.', delay: 600 },
    { dir: 'in',  text: 'Thabo Nkosi',                          delay: 1400 },
    { dir: 'out', text: 'What type of property are you looking for?\n(e.g. Room, Backroom, Apartment)', delay: 2000 },
    { dir: 'in',  text: 'Backroom',                              delay: 2800 },
    { dir: 'out', text: 'What is your monthly budget?\n(e.g. 2500)',  delay: 3400 },
    { dir: 'in',  text: 'R2000',                                 delay: 4200 },
    { dir: 'out', text: '✅ Great news, Thabo!\n\nWe have properties in your range.\n\nOur team will contact you within 24 hours. 🏠', delay: 4800 },
  ];

  const [visible, setVisible] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (visible >= messages.length) return;
    const timer = setTimeout(() => setVisible(v => v + 1), messages[visible]?.delay || 600);
    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visible]);

  return (
    <div style={{ background: '#1a1a1a', borderRadius: '24px', overflow: 'hidden', width: '100%', maxWidth: '360px', boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)` }}>
      {/* Phone header */}
      <div style={{ background: '#075e54', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: c.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏠</div>
        <div>
          <p style={{ color: '#fff', fontWeight: '600', fontSize: '14px', margin: 0 }}>Alexandra Rentals</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: 0 }}>Online</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ background: '#0b141a', padding: '16px', height: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.slice(0, visible).map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.dir === 'out' ? 'flex-end' : 'flex-start', maxWidth: '80%', animation: 'fadeSlide 0.3s ease' }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: msg.dir === 'out' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.dir === 'out' ? '#005c4b' : '#202c33',
              color: '#e9edef',
              fontSize: '13px',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {visible < messages.length && (
          <div style={{ alignSelf: 'flex-start' }}>
            <div style={{ padding: '10px 16px', background: '#202c33', borderRadius: '18px', display: 'flex', gap: '4px', alignItems: 'center' }}>
              {[0,1,2].map(i => <span key={i} style={{ width: '6px', height: '6px', background: '#8a8a8a', borderRadius: '50%', animation: `bounce 1.2s infinite ${i*150}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
      `}</style>
    </div>
  );
}

// ── Main Landing Page ─────────────────────────────────────────
export default function Home() {
  const [demoOpen, setDemoOpen] = useState(false);

  const features = [
    { icon: '🤖', title: 'Automated Qualification', desc: 'The bot asks the right questions 24/7. You only speak to leads who meet your criteria.' },
    { icon: '📊', title: 'Live Operations Dashboard', desc: 'See every lead, conversation, and qualification in real time. No spreadsheets.' },
    { icon: '💬', title: 'Manual Takeover', desc: 'Your agents can jump into any conversation, send messages, and hand back to the bot.' },
    { icon: '📅', title: 'Viewing Scheduling', desc: 'Schedule property viewings directly from the dashboard and notify your team.' },
    { icon: '👥', title: 'Team Management', desc: 'Assign leads to agents, manage roles, and track who is handling what.' },
    { icon: '🏢', title: 'Multi-Agency Platform', desc: 'Run multiple agencies on one platform. Each gets their own number, workflow, and dashboard.' },
  ];

  const steps = [
    { n: '01', title: 'Renter sends Hi', desc: 'They message your WhatsApp number. The bot responds instantly.' },
    { n: '02', title: 'Bot qualifies them', desc: 'Asks 4 questions. Budget, property type, move-in date, area.' },
    { n: '03', title: 'Lead saved automatically', desc: 'Qualified or not — every lead is stored with full conversation history.' },
    { n: '04', title: 'Your team takes over', desc: 'Agent sees the lead, takes over the chat, schedules a viewing.' },
  ];

  const plans = [
    { name: 'Starter', price: 'R950', period: '/mo', features: ['1 WhatsApp number', 'Automated qualification', 'Lead dashboard', 'Up to 3 agents', 'Email support'], highlight: false },
    { name: 'Growth', price: 'R2,450', period: '/mo', features: ['2 WhatsApp numbers', 'Custom workflow messages', 'Full agent workspace', 'Viewing scheduling', 'Priority support', 'Up to 10 agents'], highlight: true },
    { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited numbers', 'Custom qualification rules', 'Dedicated onboarding', 'SLA guarantee', 'API access', 'Unlimited agents'], highlight: false },
  ];

  return (
    <div style={{ background: c.bg, color: c.text, fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(163,230,53,0.3); }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .btn-primary { transition: all 0.2s ease; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(163,230,53,0.4); }
        .btn-secondary { transition: all 0.2s ease; }
        .btn-secondary:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 40px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '400px', background: 'radial-gradient(ellipse, rgba(163,230,53,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>

          <div style={{ animation: 'slideUp 0.8s ease' }}>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(163,230,53,0.1)', border: `1px solid ${c.border}`, borderRadius: '999px', padding: '6px 16px', marginBottom: '32px' }}>
              <span style={{ width: '6px', height: '6px', background: c.lime, borderRadius: '50%', animation: 'pulse 2s infinite' }} />
              <span style={{ color: c.lime, fontSize: '13px', fontWeight: '600' }}>Now live in South Africa</span>
            </div>

            <h1 style={{ fontSize: 'clamp(44px, 5vw, 72px)', fontWeight: '900', lineHeight: '1.05', marginBottom: '24px', letterSpacing: '-0.02em' }}>
              Turn WhatsApp<br />
              into your<br />
              <span style={{ color: c.lime }}>rental engine.</span>
            </h1>

            <p style={{ fontSize: '20px', color: c.muted, lineHeight: '1.6', marginBottom: '48px', maxWidth: '480px' }}>
              Automatically qualify rental leads on WhatsApp. Your agents only handle leads who are ready to move.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn-primary" style={{ padding: '18px 40px', background: c.lime, color: '#050505', borderRadius: '14px', fontWeight: '700', fontSize: '17px', textDecoration: 'none', display: 'inline-block' }}>
                Start Free Trial
              </Link>
              <button onClick={() => setDemoOpen(true)} className="btn-secondary" style={{ padding: '18px 40px', background: 'rgba(255,255,255,0.05)', color: c.text, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '14px', fontWeight: '600', fontSize: '17px', cursor: 'pointer' }}>
                Watch Demo →
              </button>
            </div>

            {/* Social proof */}
            <div style={{ marginTop: '48px', display: 'flex', gap: '32px' }}>
              {[
                { value: <Counter end={24} suffix="hrs" />, label: 'Response time' },
                { value: <Counter end={100} suffix="%" />,  label: 'Automated' },
                { value: <Counter end={3} suffix="min" />,  label: 'Setup time' },
              ].map((s, i) => (
                <div key={i}>
                  <p style={{ fontSize: '28px', fontWeight: '800', color: c.lime }}>{s.value}</p>
                  <p style={{ fontSize: '13px', color: c.muted, marginTop: '2px' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp demo */}
          <div style={{ display: 'flex', justifyContent: 'center', animation: 'float 6s ease-in-out infinite' }}>
            <WhatsAppDemo />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ padding: '120px 40px', borderTop: `1px solid rgba(255,255,255,0.05)` }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <p style={{ color: c.lime, fontSize: '13px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>How it works</p>
            <h2 style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: '900', letterSpacing: '-0.02em' }}>From message to viewing<br />in minutes.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2px' }}>
            {steps.map((step, i) => (
              <div key={i} className="hover-lift" style={{ background: c.card, padding: '48px 36px', position: 'relative', borderRadius: i === 0 ? '20px 0 0 20px' : i === steps.length - 1 ? '0 20px 20px 0' : '0', border: `1px solid rgba(255,255,255,0.05)` }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: c.lime, marginBottom: '24px', opacity: 0.7 }}>{step.n}</p>
                <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', letterSpacing: '-0.01em' }}>{step.title}</h3>
                <p style={{ color: c.muted, fontSize: '15px', lineHeight: '1.6' }}>{step.desc}</p>
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', background: c.lime, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#050505', fontWeight: '700', zIndex: 1 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section style={{ padding: '120px 40px', background: c.surface }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <p style={{ color: c.lime, fontSize: '13px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>Everything you need</p>
            <h2 style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: '900', letterSpacing: '-0.02em' }}>Built for rental agencies.<br />Not generic chatbots.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {features.map((f, i) => (
              <div key={i} className="hover-lift" style={{ background: c.card, padding: '36px', borderRadius: '20px', border: `1px solid rgba(255,255,255,0.05)` }}>
                <div style={{ fontSize: '36px', marginBottom: '20px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ color: c.muted, fontSize: '15px', lineHeight: '1.6' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ────────────────────────────────── */}
      <section style={{ padding: '120px 40px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <p style={{ color: c.lime, fontSize: '13px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>Operations dashboard</p>
              <h2 style={{ fontSize: 'clamp(32px, 3.5vw, 48px)', fontWeight: '900', letterSpacing: '-0.02em', marginBottom: '24px' }}>Everything visible.<br />Nothing missed.</h2>
              <p style={{ color: c.muted, fontSize: '17px', lineHeight: '1.7', marginBottom: '40px' }}>
                See active conversations, qualified leads, rejected applicants, and stale leads — all in one place. Your team knows exactly what needs attention.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['Live lead feed with qualification status', 'Full conversation history per lead', 'Agent assignment and takeover controls', 'Viewing scheduling and management', 'Alerts for stale or abandoned leads'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '20px', height: '20px', background: `${c.lime}22`, border: `1px solid ${c.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: c.lime, fontSize: '11px' }}>✓</span>
                    </div>
                    <span style={{ color: c.muted, fontSize: '15px' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard mockup */}
            <div style={{ background: c.card, borderRadius: '24px', padding: '24px', border: `1px solid rgba(255,255,255,0.06)`, boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                {['#ff5f57','#ffbd2e','#28c840'].map(bg => <div key={bg} style={{ width: '10px', height: '10px', borderRadius: '50%', background: bg }} />)}
              </div>
              {/* Fake stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                {[{ l: 'Total Leads', v: '47', c: c.text }, { l: 'Qualified', v: '31', c: c.lime }, { l: 'Today', v: '8', c: c.amber }].map(s => (
                  <div key={s.l} style={{ background: c.surface, borderRadius: '12px', padding: '14px' }}>
                    <p style={{ color: c.muted, fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px' }}>{s.l}</p>
                    <p style={{ color: s.c, fontSize: '24px', fontWeight: '800' }}>{s.v}</p>
                  </div>
                ))}
              </div>
              {/* Fake leads */}
              {[
                { name: 'Thabo Nkosi',    status: 'qualified',    color: c.lime },
                { name: 'Sipho Dube',     status: 'qualified',    color: c.lime },
                { name: 'Naledi Khumalo', status: 'capture name', color: c.amber },
                { name: 'Ayanda Mokoena', status: 'not qualified', color: '#f87171' },
              ].map((lead, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: c.surface, borderRadius: '10px', marginBottom: '8px' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600' }}>{lead.name}</p>
                    <p style={{ fontSize: '11px', color: c.muted }}>+27 8X XXX XXXX</p>
                  </div>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${lead.color}22`, color: lead.color, fontWeight: '600' }}>{lead.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section style={{ padding: '120px 40px', background: c.surface }} id="pricing">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <p style={{ color: c.lime, fontSize: '13px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>Pricing</p>
            <h2 style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: '900', letterSpacing: '-0.02em' }}>Simple, transparent pricing.</h2>
            <p style={{ color: c.muted, fontSize: '18px', marginTop: '16px' }}>Start free. Upgrade when you're ready.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {plans.map((plan, i) => (
              <div key={i} className="hover-lift" style={{
                background: plan.highlight ? 'linear-gradient(135deg, #1a2a0a, #111810)' : c.card,
                borderRadius: '24px',
                padding: '40px 32px',
                border: plan.highlight ? `2px solid ${c.lime}` : `1px solid rgba(255,255,255,0.06)`,
                position: 'relative',
              }}>
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: c.lime, color: '#050505', fontSize: '12px', fontWeight: '700', padding: '4px 20px', borderRadius: '999px', letterSpacing: '0.05em' }}>MOST POPULAR</div>
                )}
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>{plan.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '32px' }}>
                  <span style={{ fontSize: '48px', fontWeight: '900', color: plan.highlight ? c.lime : c.text, letterSpacing: '-0.02em' }}>{plan.price}</span>
                  <span style={{ color: c.muted, fontSize: '16px' }}>{plan.period}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: c.lime, fontSize: '14px' }}>✓</span>
                      <span style={{ color: c.muted, fontSize: '14px' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link to="/register" style={{
                  display: 'block', textAlign: 'center', padding: '14px',
                  background: plan.highlight ? c.lime : 'rgba(255,255,255,0.06)',
                  color: plan.highlight ? '#050505' : c.text,
                  borderRadius: '12px', fontWeight: '700', fontSize: '15px',
                  textDecoration: 'none', transition: 'all 0.2s ease',
                }}>
                  {plan.price === 'Custom' ? 'Contact Us' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ padding: '120px 40px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', fontSize: '64px', marginBottom: '32px', animation: 'float 4s ease-in-out infinite' }}>🏠</div>
          <h2 style={{ fontSize: 'clamp(36px, 4vw, 60px)', fontWeight: '900', letterSpacing: '-0.02em', marginBottom: '24px' }}>
            Ready to automate<br />your rental leads?
          </h2>
          <p style={{ color: c.muted, fontSize: '18px', lineHeight: '1.6', marginBottom: '48px' }}>
            Join rental agencies across South Africa using Easy Branding AI to qualify leads automatically and close more deals.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-primary" style={{ padding: '20px 48px', background: c.lime, color: '#050505', borderRadius: '14px', fontWeight: '700', fontSize: '18px', textDecoration: 'none' }}>
              Start Free Trial
            </Link>
            <a href="https://wa.me/27846549578?text=Hi, I'd like to learn more about Easy Branding AI" target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '20px 48px', background: 'rgba(255,255,255,0.05)', color: c.text, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '14px', fontWeight: '600', fontSize: '18px', textDecoration: 'none' }}>
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ padding: '40px', borderTop: `1px solid rgba(255,255,255,0.05)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ fontWeight: '800', fontSize: '20px', color: c.lime }}>Easy Branding AI</div>
        <p style={{ color: c.muted, fontSize: '13px' }}>© 2026 Easy Branding AI. Built for South African rental agencies.</p>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link to="/login"    style={{ color: c.muted, fontSize: '13px', textDecoration: 'none' }}>Sign In</Link>
          <Link to="/register" style={{ color: c.lime,  fontSize: '13px', textDecoration: 'none' }}>Get Started</Link>
        </div>
      </footer>

      {/* ── Demo Modal ────────────────────────────────────────── */}
      {demoOpen && (
        <div onClick={() => setDemoOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: c.card, borderRadius: '24px', padding: '40px', maxWidth: '420px', width: '100%', border: `1px solid ${c.border}`, textAlign: 'center' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>See it in action</h3>
            <p style={{ color: c.muted, marginBottom: '32px' }}>Send a WhatsApp message to our demo number and experience the qualification flow live.</p>
            <a href="https://wa.me/14155238886?text=Hi" target="_blank" rel="noreferrer" style={{ display: 'block', padding: '16px', background: '#25d366', color: '#fff', borderRadius: '12px', fontWeight: '700', fontSize: '16px', textDecoration: 'none', marginBottom: '12px' }}>
              📱 Open WhatsApp Demo
            </a>
            <button onClick={() => setDemoOpen(false)} style={{ background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontSize: '14px' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}