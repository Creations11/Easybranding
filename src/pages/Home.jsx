// src/pages/Home.jsx
// ─────────────────────────────────────────────────────────────
// Easy Branding AI — Landing Page
// Theme: Machines working with organic matter
// Energy: South African hustle, warm, alive, growth
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// ── Design tokens ─────────────────────────────────────────────
const t = {
  bg:       '#080A06',
  surface:  '#0E110B',
  card:     '#141810',
  lime:     '#B8F040',
  limeDeep: '#8BC22E',
  earth:    '#C4873A',
  moss:     '#4A6741',
  sage:     '#7A9E6E',
  sand:     '#D4B896',
  text:     '#EEF0E8',
  muted:    '#8A9080',
  border:   'rgba(184,240,64,0.12)',
  glow:     'rgba(184,240,64,0.06)',
};

// ── Organic grain overlay ─────────────────────────────────────
const GrainSVG = () => (
  <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.03, pointerEvents: 'none', zIndex: 0 }}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)"/>
  </svg>
);

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
    { dir: 'in',  text: 'Hi',                delay: 0 },
    { dir: 'out', text: 'Sawubona 👋\n\nWelcome to Alexandra Rentals.\n\nReply with your full name to start your property search.', delay: 700 },
    { dir: 'in',  text: 'Thabo Nkosi',        delay: 1600 },
    { dir: 'out', text: 'What type of property are you looking for?\n(Room, Backroom, Apartment)', delay: 2300 },
    { dir: 'in',  text: 'Backroom',            delay: 3200 },
    { dir: 'out', text: 'What is your monthly budget? 💰', delay: 3900 },
    { dir: 'in',  text: 'R2500',               delay: 4700 },
    { dir: 'out', text: '✅ Great news, Thabo!\n\nWe have properties in your range.\n\nOur team will call you within 24 hours. 🏠', delay: 5400 },
  ];

  const [visible, setVisible] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (visible >= messages.length) return;
    const delay = visible === 0 ? 800 : messages[visible].delay - messages[visible - 1].delay;
    const timer = setTimeout(() => setVisible(v => v + 1), delay);
    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visible]);

  return (
    <div style={{
      background: '#1a1a1a',
      borderRadius: '28px',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '340px',
      boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 40px 80px rgba(0,0,0,0.7), 0 0 80px rgba(184,240,64,0.08)`,
    }}>
      {/* Status bar */}
      <div style={{ background: '#111', padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>9:41</span>
        <span style={{ color: '#fff', fontSize: '12px' }}>●●●</span>
      </div>
      {/* WhatsApp header */}
      <div style={{ background: '#075e54', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${t.lime}, ${t.moss})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🏠</div>
        <div>
          <p style={{ color: '#fff', fontWeight: '600', fontSize: '14px', margin: 0 }}>Alexandra Rentals</p>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', margin: 0 }}>● online</p>
        </div>
      </div>
      {/* Chat */}
      <div style={{ background: '#0b141a', backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(184,240,64,0.03) 0%, transparent 60%)', padding: '16px 12px', height: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.slice(0, visible).map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.dir === 'out' ? 'flex-end' : 'flex-start', maxWidth: '82%', animation: 'popIn 0.25s ease' }}>
            <div style={{
              padding: '9px 13px',
              borderRadius: msg.dir === 'out' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.dir === 'out' ? '#005c4b' : '#202c33',
              color: '#e9edef', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap',
            }}>{msg.text}</div>
            <p style={{ fontSize: '10px', color: '#8a9a88', margin: '3px 4px 0', textAlign: msg.dir === 'out' ? 'right' : 'left' }}>
              {msg.dir === 'out' ? '✓✓' : ''}
            </p>
          </div>
        ))}
        {visible > 0 && visible < messages.length && (
          <div style={{ alignSelf: 'flex-start' }}>
            <div style={{ padding: '10px 14px', background: '#202c33', borderRadius: '16px', display: 'flex', gap: '4px', alignItems: 'center' }}>
              {[0,1,2].map(i => <span key={i} style={{ width: '6px', height: '6px', background: '#8a8a8a', borderRadius: '50%', display: 'inline-block', animation: `bounce 1.2s infinite ${i*180}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ── Organic shape divider ─────────────────────────────────────
function OrganicDivider({ flip = false }) {
  return (
    <svg viewBox="0 0 1440 60" style={{ display: 'block', transform: flip ? 'scaleY(-1)' : 'none' }} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" height="60" width="100%">
      <path d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z" fill={t.surface} opacity="0.8"/>
    </svg>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Home() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: '🤖', title: 'Always On', desc: '24/7 automated conversations. Your business qualifies leads while you sleep, eat, and live.' },
    { icon: '🌱', title: 'Grows With You', desc: 'Start with one agency. Scale to ten. Each client gets their own number and custom workflow.' },
    { icon: '💬', title: 'Human When It Counts', desc: 'Agents jump in anytime, send messages, schedule viewings — then hand back to the bot.' },
    { icon: '📊', title: 'Full Visibility', desc: 'Live dashboard. Every lead, every conversation, every qualification — in one place.' },
    { icon: '⚡', title: 'Instant Response', desc: 'Renters get a reply in seconds. No waiting. No missed leads. No lost business.' },
    { icon: '🏘️', title: 'Built for SA', desc: 'Designed for the South African rental market. From Alexandra to Sandton.' },
  ];

  const steps = [
    { n: '01', icon: '📱', title: 'Renter says Hi', desc: 'They message your WhatsApp. The bot responds in seconds.' },
    { n: '02', icon: '🌿', title: 'Machine qualifies', desc: 'Four smart questions. Budget, property type, area, move-in date.' },
    { n: '03', icon: '✅', title: 'Lead captured', desc: 'Qualified leads saved automatically with full conversation history.' },
    { n: '04', icon: '🤝', title: 'Your team closes', desc: 'Agent sees the lead, makes contact, closes the deal.' },
  ];

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: "'Outfit', sans-serif", overflowX: 'hidden', position: 'relative' }}>
      <GrainSVG />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:ital,wght@0,400;0,700;0,900;1,400;1,700&display=swap" rel="stylesheet" />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(184,240,64,0.25); color: ${t.text}; }
        html { scroll-behavior: smooth; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.92) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
        @keyframes float { 0%,100% { transform: translateY(0px) rotate(-1deg); } 50% { transform: translateY(-14px) rotate(1deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.95); } }
        @keyframes grow { from { width: 0; } to { width: 100%; } }
        .fade-up { animation: fadeUp 0.8s ease both; }
        .fade-up-1 { animation-delay: 0.1s; }
        .fade-up-2 { animation-delay: 0.25s; }
        .fade-up-3 { animation-delay: 0.4s; }
        .fade-up-4 { animation-delay: 0.55s; }
        .card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .card-hover:hover { transform: translateY(-6px); box-shadow: 0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(184,240,64,0.2); border-color: rgba(184,240,64,0.25) !important; }
        .btn-lime { transition: all 0.2s ease; }
        .btn-lime:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(184,240,64,0.35); background: #C8FF50 !important; }
        .btn-ghost { transition: all 0.2s ease; }
        .btn-ghost:hover { background: rgba(184,240,64,0.08) !important; border-color: rgba(184,240,64,0.3) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${t.bg}; }
        ::-webkit-scrollbar-thumb { background: ${t.moss}; border-radius: 2px; }
      `}</style>

      {/* ── NAV ───────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px',
        background: scrolled ? 'rgba(8,10,6,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${t.border}` : '1px solid transparent',
        transition: 'all 0.3s ease',
        height: '72px', display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: `linear-gradient(135deg, ${t.lime}, ${t.moss})`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🌿</div>
            <span style={{ fontSize: '20px', fontWeight: '700', color: t.text, letterSpacing: '-0.02em' }}>Easy Branding <span style={{ color: t.lime }}>AI</span></span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link to="/login" className="btn-ghost" style={{ padding: '10px 20px', background: 'transparent', border: `1px solid rgba(255,255,255,0.12)`, color: t.muted, borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Sign In</Link>
            <Link to="/register" className="btn-lime" style={{ padding: '10px 22px', background: t.lime, color: '#080A06', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 40px 60px', position: 'relative', overflow: 'hidden' }}>
        {/* Organic background blobs */}
        <div style={{ position: 'absolute', top: '15%', right: '5%', width: '500px', height: '500px', background: `radial-gradient(ellipse, rgba(74,103,65,0.15) 0%, transparent 65%)`, pointerEvents: 'none', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '0%', width: '400px', height: '400px', background: `radial-gradient(ellipse, rgba(184,240,64,0.05) 0%, transparent 65%)`, pointerEvents: 'none', borderRadius: '50%' }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            {/* Live badge */}
            <div className="fade-up fade-up-1" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `rgba(74,103,65,0.2)`, border: `1px solid rgba(74,103,65,0.4)`, borderRadius: '999px', padding: '6px 16px', marginBottom: '36px' }}>
              <span style={{ width: '7px', height: '7px', background: t.lime, borderRadius: '50%', animation: 'pulse 2s infinite', display: 'inline-block' }} />
              <span style={{ color: t.sage, fontSize: '13px', fontWeight: '500' }}>Live in South Africa</span>
            </div>

            {/* Headline */}
            <h1 className="fade-up fade-up-2" style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(48px, 5.5vw, 80px)', fontWeight: '900', lineHeight: '1.0', marginBottom: '28px', letterSpacing: '-0.02em' }}>
              Built for the<br />
              <span style={{ fontStyle: 'italic', color: t.lime }}>hustle.</span><br />
              Runs while<br />you <span style={{ color: t.earth }}>sleep.</span>
            </h1>

            <p className="fade-up fade-up-3" style={{ fontSize: '18px', color: t.muted, lineHeight: '1.7', marginBottom: '44px', maxWidth: '440px', fontWeight: '400' }}>
              Easy Branding AI automates your WhatsApp conversations — so qualified leads land in your dashboard while you focus on closing deals.
            </p>

            <div className="fade-up fade-up-4" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn-lime" style={{ padding: '16px 36px', background: t.lime, color: '#080A06', borderRadius: '12px', fontWeight: '700', fontSize: '16px', textDecoration: 'none', display: 'inline-block' }}>
                Start Free Trial →
              </Link>
              <button onClick={() => setDemoOpen(true)} className="btn-ghost" style={{ padding: '16px 28px', background: 'transparent', color: t.text, border: `1px solid rgba(255,255,255,0.12)`, borderRadius: '12px', fontWeight: '500', fontSize: '16px', cursor: 'pointer' }}>
                See it live
              </button>
            </div>

            {/* Stats */}
            <div className="fade-up fade-up-4" style={{ marginTop: '56px', display: 'flex', gap: '40px', paddingTop: '40px', borderTop: `1px solid ${t.border}` }}>
              {[
                { v: <Counter end={24} suffix="hrs" />, l: 'Always on' },
                { v: <Counter end={100} suffix="%" />,  l: 'Automated' },
                { v: <Counter end={4} suffix=" questions" />,  l: 'To qualify a lead' },
              ].map((s, i) => (
                <div key={i}>
                  <p style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: '700', color: t.lime, marginBottom: '4px' }}>{s.v}</p>
                  <p style={{ fontSize: '13px', color: t.muted }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp demo */}
          <div style={{ display: 'flex', justifyContent: 'center', animation: 'float 7s ease-in-out infinite', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: '-20px', background: `radial-gradient(ellipse, rgba(184,240,64,0.06) 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />
            <WhatsAppDemo />
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────── */}
      <div style={{ background: t.surface, padding: '20px 40px', borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[...Array(5)].map((_, i) => <span key={i} style={{ color: t.earth, fontSize: '16px' }}>★</span>)}
          </div>
          <p style={{ color: t.muted, fontSize: '14px' }}>Helping rental agencies across South Africa automate their WhatsApp pipeline</p>
        </div>
      </div>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section style={{ padding: '120px 40px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <p style={{ color: t.sage, fontSize: '12px', fontWeight: '600', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '16px' }}>How it works</p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(36px, 4vw, 60px)', fontWeight: '900', letterSpacing: '-0.02em', lineHeight: '1.1' }}>
              From message to<br /><span style={{ fontStyle: 'italic', color: t.lime }}>qualified lead</span> in minutes.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px' }}>
            {steps.map((step, i) => (
              <div key={i} className="card-hover" style={{
                background: t.card, padding: '40px 28px',
                borderRadius: i === 0 ? '20px 0 0 20px' : i === 3 ? '0 20px 20px 0' : '0',
                border: `1px solid rgba(255,255,255,0.05)`,
                position: 'relative',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{step.icon}</div>
                <p style={{ fontFamily: 'monospace', fontSize: '11px', color: t.lime, marginBottom: '12px', opacity: 0.6 }}>{step.n}</p>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', letterSpacing: '-0.01em' }}>{step.title}</h3>
                <p style={{ color: t.muted, fontSize: '14px', lineHeight: '1.6' }}>{step.desc}</p>
                {i < 3 && (
                  <div style={{ position: 'absolute', right: '-14px', top: '50%', transform: 'translateY(-50%)', width: '28px', height: '28px', background: t.lime, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: t.bg, fontWeight: '800', zIndex: 1 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section style={{ padding: '100px 40px', background: t.surface, position: 'relative' }}>
        <OrganicDivider flip />
        <div style={{ maxWidth: '1280px', margin: '0 auto', paddingTop: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <p style={{ color: t.sage, fontSize: '12px', fontWeight: '600', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '16px' }}>Platform features</p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: '900', letterSpacing: '-0.02em' }}>
              Everything your agency needs.<br /><span style={{ color: t.earth, fontStyle: 'italic' }}>Nothing it doesn't.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {features.map((f, i) => (
              <div key={i} className="card-hover" style={{ background: t.card, padding: '32px', borderRadius: '20px', border: `1px solid rgba(255,255,255,0.05)` }}>
                <div style={{ width: '48px', height: '48px', background: `rgba(184,240,64,0.08)`, border: `1px solid ${t.border}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '20px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ color: t.muted, fontSize: '14px', lineHeight: '1.65' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <OrganicDivider />
      </section>

      {/* ── DASHBOARD PREVIEW ─────────────────────────────────── */}
      <section style={{ padding: '120px 40px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '80px', alignItems: 'center' }}>
            <div>
              <p style={{ color: t.sage, fontSize: '12px', fontWeight: '600', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '16px' }}>Operations dashboard</p>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px, 3.5vw, 52px)', fontWeight: '900', letterSpacing: '-0.02em', marginBottom: '20px', lineHeight: '1.1' }}>
                See everything.<br /><span style={{ color: t.lime, fontStyle: 'italic' }}>Miss nothing.</span>
              </h2>
              <p style={{ color: t.muted, fontSize: '16px', lineHeight: '1.7', marginBottom: '36px' }}>
                Live lead feed, conversation history, agent controls, viewing schedules — your entire rental pipeline in one organic dashboard.
              </p>
              {['Live WhatsApp conversation view', 'Qualify, assign, and schedule in one click', 'Team management with role-based access', 'Stale lead alerts so nothing slips through'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ width: '22px', height: '22px', background: `rgba(184,240,64,0.12)`, border: `1px solid ${t.border}`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: t.lime, fontSize: '12px' }}>✓</span>
                  </div>
                  <span style={{ color: t.muted, fontSize: '15px' }}>{item}</span>
                </div>
              ))}
            </div>

            {/* Dashboard mockup */}
            <div style={{ background: t.card, borderRadius: '24px', padding: '20px', border: `1px solid rgba(255,255,255,0.06)`, boxShadow: `0 40px 80px rgba(0,0,0,0.5), 0 0 80px rgba(184,240,64,0.04)` }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                {['#ff5f57','#ffbd2e','#28c840'].map(bg => <div key={bg} style={{ width: '10px', height: '10px', borderRadius: '50%', background: bg }} />)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {[{ l: 'Total Leads', v: '47', c: t.text }, { l: 'Qualified', v: '31', c: t.lime }, { l: 'Today', v: '8', c: t.earth }].map(s => (
                  <div key={s.l} style={{ background: t.surface, borderRadius: '10px', padding: '12px' }}>
                    <p style={{ color: t.muted, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{s.l}</p>
                    <p style={{ color: s.c, fontSize: '22px', fontWeight: '800', fontFamily: "'Fraunces', serif" }}>{s.v}</p>
                  </div>
                ))}
              </div>
              {[
                { name: 'Thabo Nkosi',    status: 'qualified',   c: t.lime },
                { name: 'Sipho Dube',     status: 'qualified',   c: t.lime },
                { name: 'Naledi Khumalo', status: 'in progress', c: t.earth },
                { name: 'Zanele Mokoena', status: 'not qualified', c: '#f87171' },
              ].map((lead, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: t.surface, borderRadius: '8px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${t.moss}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                      {lead.name.charAt(0)}
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: '500' }}>{lead.name}</p>
                  </div>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: `${lead.c}18`, color: lead.c, fontWeight: '600' }}>{lead.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────── */}
      <section style={{ padding: '120px 40px', background: t.surface }} id="pricing">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <p style={{ color: t.sage, fontSize: '12px', fontWeight: '600', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '16px' }}>Pricing</p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: '900', letterSpacing: '-0.02em' }}>
              Start free.<br /><span style={{ color: t.lime, fontStyle: 'italic' }}>Scale when you're ready.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { name: 'Starter', price: 'R950', period: '/mo', highlight: false, features: ['1 WhatsApp number', 'Automated qualification', 'Lead dashboard', 'Up to 3 agents', 'Email support'] },
              { name: 'Growth',  price: 'R2,450', period: '/mo', highlight: true,  features: ['2 WhatsApp numbers', 'Custom workflow messages', 'Full agent workspace', 'Viewing scheduling', 'Priority support', 'Up to 10 agents'] },
              { name: 'Enterprise', price: 'Custom', period: '', highlight: false, features: ['Unlimited numbers', 'Custom qualification rules', 'Dedicated onboarding', 'SLA guarantee', 'API access', 'Unlimited agents'] },
            ].map((plan, i) => (
              <div key={i} className="card-hover" style={{
                background: plan.highlight ? `linear-gradient(160deg, #1A2B0A, #111A08)` : t.card,
                borderRadius: '24px', padding: '36px 28px',
                border: plan.highlight ? `2px solid rgba(184,240,64,0.35)` : `1px solid rgba(255,255,255,0.06)`,
                position: 'relative',
              }}>
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: t.lime, color: t.bg, fontSize: '11px', fontWeight: '800', padding: '4px 18px', borderRadius: '999px', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>MOST POPULAR</div>
                )}
                <p style={{ color: t.muted, fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>{plan.name}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '28px' }}>
                  <span style={{ fontFamily: "'Fraunces', serif", fontSize: '52px', fontWeight: '900', color: plan.highlight ? t.lime : t.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ color: t.muted, fontSize: '15px' }}>{plan.period}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: t.lime, fontSize: '13px', flexShrink: 0 }}>✓</span>
                      <span style={{ color: t.muted, fontSize: '14px' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link to="/register" className={plan.highlight ? 'btn-lime' : 'btn-ghost'} style={{
                  display: 'block', textAlign: 'center', padding: '14px',
                  background: plan.highlight ? t.lime : 'rgba(255,255,255,0.05)',
                  color: plan.highlight ? t.bg : t.text,
                  borderRadius: '12px', fontWeight: '700', fontSize: '15px',
                  textDecoration: 'none', border: plan.highlight ? 'none' : `1px solid rgba(255,255,255,0.1)`,
                  transition: 'all 0.2s ease',
                }}>
                  {plan.price === 'Custom' ? 'Talk to us' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section style={{ padding: '140px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, rgba(74,103,65,0.12) 0%, transparent 65%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ fontSize: '64px', marginBottom: '32px', display: 'inline-block', animation: 'float 5s ease-in-out infinite' }}>🌿</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(40px, 5vw, 68px)', fontWeight: '900', letterSpacing: '-0.02em', marginBottom: '24px', lineHeight: '1.05' }}>
            Ready to let your<br /><span style={{ color: t.lime, fontStyle: 'italic' }}>business breathe?</span>
          </h2>
          <p style={{ color: t.muted, fontSize: '18px', lineHeight: '1.7', marginBottom: '48px' }}>
            Join rental agencies across South Africa who've automated their WhatsApp pipeline and reclaimed their time.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-lime" style={{ padding: '18px 44px', background: t.lime, color: t.bg, borderRadius: '14px', fontWeight: '700', fontSize: '17px', textDecoration: 'none' }}>
              Start Free Trial →
            </Link>
            <a href={`https://wa.me/27846549578?text=Hi, I'd like to learn more about Easy Branding AI`} target="_blank" rel="noreferrer" className="btn-ghost" style={{ padding: '18px 36px', background: 'transparent', color: t.text, border: `1px solid rgba(255,255,255,0.12)`, borderRadius: '14px', fontWeight: '500', fontSize: '17px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              📱 WhatsApp us
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer style={{ padding: '32px 40px', borderTop: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🌿</span>
            <span style={{ fontWeight: '700', color: t.lime }}>Easy Branding AI</span>
          </div>
          <p style={{ color: t.muted, fontSize: '13px' }}>© 2026 Easy Branding AI · Built for South Africa</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link to="/login"    style={{ color: t.muted, fontSize: '13px', textDecoration: 'none' }}>Sign In</Link>
            <Link to="/register" style={{ color: t.lime,  fontSize: '13px', textDecoration: 'none' }}>Get Started</Link>
            <a href="#pricing"   style={{ color: t.muted, fontSize: '13px', textDecoration: 'none' }}>Pricing</a>
          </div>
        </div>
      </footer>

      {/* ── Demo Modal ─────────────────────────────────────────── */}
      {demoOpen && (
        <div onClick={() => setDemoOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: t.card, borderRadius: '24px', padding: '40px', maxWidth: '400px', width: '100%', border: `1px solid ${t.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: '800', marginBottom: '12px' }}>Try it live</h3>
            <p style={{ color: t.muted, marginBottom: '28px', lineHeight: '1.6' }}>Send a WhatsApp to our demo number and experience the full qualification flow in real time.</p>
            <a href="https://wa.me/14155238886?text=Hi" target="_blank" rel="noreferrer" style={{ display: 'block', padding: '15px', background: '#25d366', color: '#fff', borderRadius: '12px', fontWeight: '700', fontSize: '15px', textDecoration: 'none', marginBottom: '12px' }}>
              Open WhatsApp Demo →
            </a>
            <button onClick={() => setDemoOpen(false)} style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', fontSize: '14px' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}