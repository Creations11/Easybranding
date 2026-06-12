// src/pages/Home.jsx
// Easy Branding AI — CIO v2 + Developer improvements
// CIO: value prop, trust strip, screenshots, POPIA, social proof, mobile nav
// Dev: animated mockups, live demo as primary CTA, real proof numbers
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const t = {
  bg:      '#06080A',
  surface: '#0D110C',
  card:    '#121710',
  lime:    '#B8F040',
  earth:   '#C4873A',
  moss:    '#4A6741',
  sage:    '#7A9E6E',
  cyan:    '#22d3ee',
  emerald: '#34d399',
  amber:   '#fbbf24',
  red:     '#f87171',
  text:    '#EEF0E8',
  muted:   '#8A9080',
  border:  'rgba(184,240,64,0.12)',
  dim:     'rgba(255,255,255,0.06)',
};

// ── Animated WhatsApp conversation ────────────────────────────
function LiveDemo() {
  const messages = [
    { dir: 'in',  text: 'Hi', delay: 0 },
    { dir: 'out', text: 'Welcome to Alexandra Rentals 🏠\n\nReply with your full name to get started.', delay: 800 },
    { dir: 'in',  text: 'Sipho Dube', delay: 2000 },
    { dir: 'out', text: 'What type of property are you looking for?\n\nRoom · Backroom · Apartment · House', delay: 3000 },
    { dir: 'in',  text: 'Backroom', delay: 4200 },
    { dir: 'out', text: 'Monthly budget? (e.g. 2500)', delay: 5000 },
    { dir: 'in',  text: 'R2500', delay: 6000 },
    { dir: 'out', text: '✅ Great news, Sipho!\n\nYou qualify for our programme. 🏠\n\nAn agent will contact you within 24 hours.', delay: 7200, qualify: true },
  ];

  const [visible, setVisible] = useState(0);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const timers = messages.map((m, i) =>
      setTimeout(() => setVisible(i + 1), m.delay + 400)
    );
    const reset = setTimeout(() => { setVisible(0); setKey(k => k + 1); }, 12000);
    return () => { timers.forEach(clearTimeout); clearTimeout(reset); };
  }, [key]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(1), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ background: '#111', borderRadius: '24px', overflow: 'hidden', width: '100%', maxWidth: '300px', boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 40px 80px rgba(0,0,0,0.7)', margin: '0 auto' }}>
      <div style={{ background: '#075e54', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `linear-gradient(135deg, ${t.lime}, ${t.moss})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🏠</div>
        <div>
          <p style={{ color: '#fff', fontWeight: '600', fontSize: '13px', margin: 0 }}>Alexandra Rentals</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', margin: 0 }}>● online</p>
        </div>
      </div>
      <div style={{ background: '#0d1117', padding: '16px 12px', minHeight: '320px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.slice(0, visible).map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.dir === 'in' ? 'flex-end' : 'flex-start', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ maxWidth: '82%', padding: '8px 12px', borderRadius: msg.dir === 'in' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: msg.qualify ? 'rgba(184,240,64,0.15)' : msg.dir === 'in' ? '#005c4b' : '#1f2937', border: msg.qualify ? `1px solid ${t.lime}44` : 'none', fontSize: '12px', lineHeight: '1.5', color: msg.qualify ? t.lime : '#fff', whiteSpace: 'pre-wrap', fontWeight: msg.qualify ? '600' : '400' }}>{msg.text}</div>
          </div>
        ))}
        {visible > 0 && visible < messages.length && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#1f2937', borderRadius: '4px 16px 16px 16px', padding: '10px 14px', display: 'flex', gap: '4px', alignItems: 'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: t.muted, animation: `bounce 1s ${i * 0.2}s infinite` }} />)}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes bounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-4px); } }
      `}</style>
    </div>
  );
}

// ── Animated dashboard mockup ─────────────────────────────────
function DashboardMockup() {
  const leads = [
    { name: 'Sipho Dube',     score: 9, label: 'Hot Lead',  budget: 'R2,500', color: '#B8F040' },
    { name: 'Nomsa Khumalo',  score: 7, label: 'Warm Lead', budget: 'R3,500', color: '#fbbf24' },
    { name: 'Thabo Mokoena',  score: 8, label: 'Hot Lead',  budget: 'R1,800', color: '#B8F040' },
  ];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % leads.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: '#0D110C', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden', width: '100%' }}>
      {/* Browser bar */}
      <div style={{ background: '#141810', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {['#f87171','#fbbf24','#34d399'].map((c,i) => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '4px 12px', marginLeft: '8px' }}>
          <p style={{ color: '#8A9080', fontSize: '11px', margin: 0 }}>easybranding.co.za/admin</p>
        </div>
      </div>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.04)', margin: '16px' }}>
        {[{l:'Leads',v:'47',c:'#EEF0E8'},{l:'Qualified',v:'31',c:'#B8F040'},{l:'Today',v:'8',c:'#fbbf24'},{l:'Rate',v:'66%',c:'#34d399'}].map((s,i) => (
          <div key={i} style={{ background: '#121710', padding: '12px', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: '900', color: s.c, margin: 0 }}>{s.v}</p>
            <p style={{ color: '#8A9080', fontSize: '10px', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</p>
          </div>
        ))}
      </div>
      {/* Lead cards */}
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {leads.map((lead, i) => (
          <div key={i} style={{ background: i === active ? 'rgba(184,240,64,0.06)' : '#121710', border: `1px solid ${i === active ? lead.color + '33' : 'rgba(255,255,255,0.06)'}`, borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.4s ease' }}>
            <div>
              <p style={{ fontWeight: '600', fontSize: '13px', margin: 0, color: '#EEF0E8' }}>{lead.name}</p>
              <p style={{ color: '#8A9080', fontSize: '11px', margin: '2px 0 0' }}>{lead.budget}/month</p>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '999px', background: `${lead.color}22`, color: lead.color, fontWeight: '700' }}>🤖 {lead.score}/10 · {lead.label}</span>
            </div>
          </div>
        ))}
        <p style={{ color: '#4A6741', fontSize: '11px', textAlign: 'center', margin: '4px 0 0', fontStyle: 'italic' }}>AI scoring every lead in real time</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: t.bg, color: t.text, minHeight: '100vh', overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        .btn-lime { background:#B8F040; color:#06080A; border:none; padding:14px 28px; border-radius:10px; font-weight:700; font-size:15px; cursor:pointer; font-family:inherit; text-decoration:none; display:inline-flex; align-items:center; gap:8px; transition:opacity 0.15s; }
        .btn-lime:hover { opacity:0.88; }
        .btn-ghost { background:transparent; color:#EEF0E8; border:1px solid rgba(255,255,255,0.12); padding:14px 28px; border-radius:10px; font-weight:500; font-size:15px; cursor:pointer; font-family:inherit; text-decoration:none; display:inline-flex; align-items:center; gap:8px; transition:border-color 0.15s; }
        .btn-ghost:hover { border-color:rgba(184,240,64,0.4); }
        .fcard { background:#121710; border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:28px; transition:border-color 0.2s, transform 0.2s; }
        .fcard:hover { border-color:rgba(184,240,64,0.2); transform:translateY(-2px); }
        @media (max-width:768px) {
          .two-col { grid-template-columns:1fr !important; }
          .three-col { grid-template-columns:1fr !important; }
          .hero-layout { grid-template-columns:1fr !important; }
          .hide-mob { display:none !important; }
          .nav-desktop { display:none !important; }
          .nav-mobile { display:flex !important; }
        }
        @media (min-width:769px) {
          .nav-mobile { display:none !important; }
        }
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(6,8,10,0.92)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${t.border}`, padding:'0 24px', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:'8px', textDecoration:'none' }}>
          <span style={{ fontSize:'20px' }}>🌿</span>
          <span style={{ fontSize:'15px', fontWeight:'700', color:t.text }}>Easy Branding <span style={{ color:t.lime }}>AI</span></span>
        </Link>
        {/* Desktop nav */}
        <div className="nav-desktop" style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <Link to="/login" style={{ color:t.muted, textDecoration:'none', fontSize:'14px', padding:'8px 16px' }}>Sign In</Link>
          <Link to="/register" className="btn-lime" style={{ padding:'8px 20px', fontSize:'14px' }}>Get Started</Link>
        </div>
        {/* Mobile nav — Sign In text + Get Started pill */}
        <div className="nav-mobile" style={{ display:'none', gap:'6px', alignItems:'center' }}>
          <Link to="/login" style={{ color:t.muted, textDecoration:'none', fontSize:'13px', padding:'6px 10px' }}>Sign In</Link>
          <Link to="/register" className="btn-lime" style={{ padding:'7px 14px', fontSize:'13px' }}>Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ paddingTop:'100px', minHeight:'100vh', display:'flex', alignItems:'center', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'40px 24px', width:'100%' }}>
          <div className="hero-layout" style={{ display:'grid', gridTemplateColumns:'1fr 420px', gap:'60px', alignItems:'center' }}>
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:`${t.lime}12`, border:`1px solid ${t.lime}22`, borderRadius:'999px', padding:'6px 14px', marginBottom:'28px' }}>
                <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:t.lime, boxShadow:`0 0 6px ${t.lime}`, flexShrink:0 }}></span>
                <span style={{ color:t.lime, fontSize:'12px', fontWeight:'600', letterSpacing:'0.08em' }}>LIVE IN SOUTH AFRICA</span>
              </div>

              <h1 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(42px, 6vw, 76px)', fontWeight:'900', lineHeight:1.0, marginBottom:'12px' }}>Easy Branding <span style={{ color:t.lime }}>AI</span></h1>
              <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(20px, 3vw, 32px)', fontWeight:'700', lineHeight:1.2, marginBottom:'24px', color:t.earth }}>The Operating System for<br/>South African Small Business.</h2>

              <p style={{ fontSize:'clamp(15px, 2vw, 18px)', color:t.muted, lineHeight:1.7, marginBottom:'20px', maxWidth:'480px' }}>
                Most businesses run on WhatsApp but manage their operations across five different tools.
              </p>
              <p style={{ fontSize:'clamp(15px, 2vw, 18px)', color:t.text, lineHeight:1.7, marginBottom:'8px', maxWidth:'480px', fontWeight:'600' }}>
                Easy Branding AI brings everything together.
              </p>

              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'24px' }}>
                {['Lead generation.','Customer support.','Bookings.','Payments.','Automation.','Reporting.'].map((item, i) => (
                  <span key={i} style={{ background:`${t.lime}12`, border:`1px solid ${t.lime}22`, color:t.lime, fontSize:'13px', fontWeight:'600', padding:'5px 14px', borderRadius:'999px' }}>{item}</span>
                ))}
              </div>

              <p style={{ fontSize:'15px', color:t.muted, lineHeight:1.7, marginBottom:'4px' }}>Powered by AI. Delivered through WhatsApp.</p>
              <p style={{ fontSize:'15px', color:t.muted, lineHeight:1.7, marginBottom:'4px' }}>Your customers stay where they are. Your business becomes automated.</p>
              <p style={{ fontSize:'15px', color:t.sage, lineHeight:1.7, marginBottom:'32px', fontStyle:'italic' }}>Built for South Africa. Designed for growth.</p>

              <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'40px' }}>
                <Link to="/register" className="btn-lime" style={{ fontSize:'16px', padding:'15px 32px' }}>Start free — 30 days</Link>
                <a href="https://wa.me/27653318266?text=Hi" target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize:'16px', padding:'15px 28px' }}>
                  <span>💬</span> Try it live now
                </a>
              </div>

              {/* Alexandra proof — CIO: social proof above fold */}
              <div style={{ background:`${t.lime}08`, border:`1px solid ${t.lime}18`, borderRadius:'14px', padding:'16px 20px' }}>
                <p style={{ color:t.muted, fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px' }}>Real result — Alexandra Rentals, Johannesburg</p>
                <p style={{ color:t.text, fontSize:'15px', lineHeight:1.5 }}>
                  <span style={{ color:t.lime, fontWeight:'700' }}>47 leads qualified</span> in their first month. <span style={{ color:t.lime, fontWeight:'700' }}>11 came in after midnight.</span> Zero were missed.
                </p>
              </div>
            </div>

            {/* Live demo */}
            <div className="hide-mob">
              <div style={{ textAlign:'center', marginBottom:'16px' }}>
                <span style={{ background:`${t.lime}18`, color:t.lime, fontSize:'11px', fontWeight:'700', padding:'5px 14px', borderRadius:'999px', letterSpacing:'0.06em' }}>LIVE DEMO — YOUR PLATFORM IN ACTION</span>
              </div>
              <LiveDemo />
              <div style={{ textAlign:'center', marginTop:'16px' }}>
                <p style={{ color:t.muted, fontSize:'13px' }}>Send <strong style={{ color:t.lime }}>"Hi"</strong> to <strong style={{ color:t.text }}>+27 65 331 8266</strong> to experience it yourself</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP — CIO recommendation ─────────────────── */}
      <section style={{ padding:'24px', background:t.surface, borderTop:`1px solid ${t.dim}`, borderBottom:`1px solid ${t.dim}`, position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', display:'flex', justifyContent:'center', flexWrap:'wrap', gap:'32px', alignItems:'center' }}>
          {[
            { icon:'🇿🇦', text:'Built in South Africa' },
            { icon:'🔒', text:'POPIA Compliant' },
            { icon:'☁️', text:'Secure Cloud Hosting' },
            { icon:'💬', text:'WhatsApp Business API' },
            { icon:'🤖', text:'Claude AI Powered' },
            { icon:'⚡', text:'24/7 Automated' },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontSize:'16px' }}>{item.icon}</span>
              <span style={{ color:t.muted, fontSize:'13px', fontWeight:'500' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────────────────────── */}
      <section style={{ padding:'80px 24px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <p style={{ color:t.muted, fontSize:'14px', fontStyle:'italic', marginBottom:'40px', textAlign:'center' }}>Five tools. One phone. No system. Sound familiar?</p>
          <div className="three-col" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px', marginBottom:'60px' }}>
            {[
              { pain:'"We miss leads that come in over weekends and after hours."', fix:'Bot qualifies 24/7 — no missed leads, ever.', icon:'😴' },
              { pain:'"My agents spend all day answering the same WhatsApp questions."', fix:'Automated qualification frees agents to close deals.', icon:'📱' },
              { pain:'"I have no idea which leads are worth calling first."', fix:'AI scores every lead 1-10 with a recommended action.', icon:'🤷' },
            ].map((item, i) => (
              <div key={i} style={{ background:t.card, border:`1px solid ${t.dim}`, borderRadius:'16px', padding:'28px', display:'flex', flexDirection:'column', gap:'16px' }}>
                <span style={{ fontSize:'32px' }}>{item.icon}</span>
                <p style={{ color:t.muted, fontSize:'15px', lineHeight:1.6, fontStyle:'italic' }}>"{item.pain}"</p>
                <div style={{ height:'1px', background:`${t.lime}22` }} />
                <p style={{ color:t.lime, fontSize:'14px', fontWeight:'600', lineHeight:1.5 }}>→ {item.fix}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'1px', background:t.dim, borderRadius:'16px', overflow:'hidden', border:`1px solid ${t.dim}` }}>
            {[
              { v:'2 min', l:'Avg lead qualify time', c:t.lime },
              { v:'24/7',  l:'Bot never sleeps',      c:t.cyan },
              { v:'0',     l:'Missed leads',           c:t.emerald },
              { v:'R950',  l:'Starter per month',      c:t.amber },
            ].map((s, i) => (
              <div key={i} style={{ background:t.card, padding:'28px 20px', textAlign:'center' }}>
                <p style={{ fontFamily:"'Fraunces', serif", fontSize:'48px', fontWeight:'900', color:s.c, lineHeight:1 }}>{s.v}</p>
                <p style={{ color:t.muted, fontSize:'12px', marginTop:'8px', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO CTA ─────────────────────────────────────── */}
      <section style={{ padding:'80px 24px', background:t.surface, position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'700px', margin:'0 auto' }}>
          <div style={{ background:`linear-gradient(135deg, ${t.lime}10, ${t.moss}08)`, border:`1px solid ${t.lime}22`, borderRadius:'24px', padding:'48px 40px', textAlign:'center' }}>
            <span style={{ fontSize:'40px', display:'block', marginBottom:'20px' }}>💬</span>
            <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px, 4vw, 42px)', fontWeight:'900', marginBottom:'16px', lineHeight:1.1 }}>
              Don't take our word for it.
              <br /><span style={{ color:t.lime, fontStyle:'italic' }}>Try it right now.</span>
            </h2>
            <p style={{ color:t.muted, fontSize:'16px', lineHeight:1.6, marginBottom:'32px' }}>
              Send <strong style={{ color:t.text }}>"Hi"</strong> to the number below. Experience exactly what your customers will experience — in under 2 minutes. No signup required.
            </p>
            <div style={{ background:t.card, border:`1px solid ${t.dim}`, borderRadius:'14px', padding:'20px', marginBottom:'24px', display:'inline-block' }}>
              <p style={{ color:t.muted, fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px' }}>WhatsApp this number now</p>
              <p style={{ fontFamily:"'Fraunces', serif", fontSize:'32px', fontWeight:'900', color:t.lime }}>+27 65 331 8266</p>
            </div>
            <br />
            <a href="https://wa.me/27653318266?text=Hi" target="_blank" rel="noreferrer" className="btn-lime" style={{ fontSize:'16px', padding:'16px 36px' }}>
              <span>💬</span> Open WhatsApp now
            </a>
          </div>
        </div>
      </section>

      {/* ── PRODUCT SHOWCASE — CIO + Dev animated mockups ─────── */}
      <section style={{ padding:'80px 24px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px' }}>The product</p>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px, 4vw, 48px)', fontWeight:'900', marginBottom:'12px' }}>See exactly what you're getting.</h2>
          <p style={{ color:t.muted, fontSize:'17px', marginBottom:'48px', maxWidth:'520px' }}>Not screenshots. Live animated previews of the actual platform.</p>

          <div className="two-col" style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'24px' }}>
            {/* WhatsApp conversation */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:`${t.lime}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>💬</div>
                <div>
                  <p style={{ fontWeight:'700', fontSize:'15px' }}>WhatsApp Qualification</p>
                  <p style={{ color:t.muted, fontSize:'12px' }}>Your customers' experience</p>
                </div>
              </div>
              <LiveDemo />
            </div>

            {/* Dashboard */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:`${t.amber}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>📊</div>
                <div>
                  <p style={{ fontWeight:'700', fontSize:'15px' }}>AI Lead Dashboard</p>
                  <p style={{ color:t.muted, fontSize:'12px' }}>Your team's command centre</p>
                </div>
              </div>
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── THREE CORE PRODUCTS ───────────────────────────────── */}
      <section style={{ padding:'80px 24px', background:t.surface, position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px' }}>The platform</p>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px, 4vw, 48px)', fontWeight:'900', marginBottom:'12px' }}>Everything in one place.</h2>
          <p style={{ color:t.muted, fontSize:'17px', marginBottom:'48px', maxWidth:'520px' }}>WhatsApp is the interface. Easy Branding AI is the engine running your entire business behind it.</p>

          <div className="three-col" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px' }}>
            {[
              { icon:'📥', color:t.lime, label:'INBOUND', title:'Qualify every lead automatically', desc:'Customers message your WhatsApp. Our AI qualifies them, scores them 1-10, and routes them to the right person — while you sleep.', features:['24/7 automated qualification','AI lead scoring + summary','Live agent dashboard','Bot ↔ agent handover','Real-time pipeline'] },
              { icon:'📤', color:t.cyan, label:'OUTBOUND', title:'Reach new customers at scale', desc:'Send approved WhatsApp templates to thousands of prospects. Track replies. Book demos. Convert — all from one dashboard.', features:['Approved template campaigns','Reply tracking + workflows','Demo / call / info menu','Google Sheets sync','Team-based prospecting'] },
              { icon:'🤖', color:t.amber, label:'INTELLIGENCE', title:'Know exactly who to call first', desc:'Every lead gets an AI score, summary, recommended action, and red flags. Your team spends time closing — not sorting.', features:['AI score 1-10 per lead','Plain English summary','Recommended next action','Red flag detection','Usage tracking + budget cap'] },
            ].map((p, i) => (
              <div key={i} className="fcard" style={{ borderTop:`3px solid ${p.color}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
                  <span style={{ fontSize:'22px' }}>{p.icon}</span>
                  <span style={{ fontSize:'11px', fontWeight:'700', letterSpacing:'0.1em', color:p.color }}>{p.label}</span>
                </div>
                <h3 style={{ fontFamily:"'Fraunces', serif", fontSize:'20px', fontWeight:'900', marginBottom:'10px', lineHeight:1.2 }}>{p.title}</h3>
                <p style={{ color:t.muted, fontSize:'14px', lineHeight:1.6, marginBottom:'20px' }}>{p.desc}</p>
                <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'8px' }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px' }}>
                      <span style={{ color:p.color, fontSize:'10px', flexShrink:0 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MORE FEATURES ─────────────────────────────────────── */}
      <section style={{ padding:'80px 24px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px' }}>Also included</p>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px, 4vw, 48px)', fontWeight:'900', marginBottom:'48px' }}>Everything your business needs.</h2>

          <div className="two-col" style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'16px' }}>
            {[
              { icon:'📄', color:t.emerald, title:'Document Management', desc:'Send and receive documents through WhatsApp. Agreements, quotes, IDs, contracts — all attached to the lead record automatically.', tags:['Receive PDFs via WhatsApp','Send documents to customers','Stored per lead record','Full document history'] },
              { icon:'💬', color:t.cyan, title:'Internal Team Chat', desc:'Agents and managers coordinate inside the platform. Discuss hot leads, share notes, get notified instantly on new qualified leads.', tags:['Agent → manager messaging','Lead-linked conversations','Unread notifications','New lead alerts'] },
              { icon:'📊', color:t.lime, title:'ROI Reporting', desc:'Automated 30-day performance reports showing leads qualified, hours saved, cost per lead, and conversion rates — delivered automatically.', tags:['Auto-generated monthly','Sent via WhatsApp + email','Cost per lead','Conversion funnel'] },
              { icon:'💳', color:t.amber, title:'Automated Billing & Payments', desc:'Collect payments from customers via WhatsApp. Subscription billing, deposit collection, convenience fees, and Paystack subaccounts all built in.', tags:['Paystack integration','Payment links via WhatsApp','Convenience fee config','Auto-suspend + reinstate'] },
            ].map((f, i) => (
              <div key={i} className="fcard">
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
                  <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:`${f.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>{f.icon}</div>
                  <h3 style={{ fontFamily:"'Fraunces', serif", fontSize:'20px', fontWeight:'900' }}>{f.title}</h3>
                </div>
                <p style={{ color:t.muted, fontSize:'14px', lineHeight:1.6, marginBottom:'20px' }}>{f.desc}</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {f.tags.map((tag, j) => (
                    <span key={j} style={{ fontSize:'12px', padding:'4px 10px', borderRadius:'999px', background:`${f.color}12`, color:f.color, border:`1px solid ${f.color}20` }}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST + SECURITY — CIO recommendation ─────────────── */}
      <section style={{ padding:'80px 24px', background:t.surface, position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px' }}>Trust & security</p>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px, 4vw, 48px)', fontWeight:'900', marginBottom:'12px' }}>Built for South African businesses.</h2>
          <p style={{ color:t.muted, fontSize:'17px', marginBottom:'48px', maxWidth:'520px' }}>Enterprise-grade security and compliance — without enterprise complexity.</p>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px' }}>
            {[
              { icon:'🔒', title:'POPIA Compliant', desc:'Customer data handled in full compliance with the Protection of Personal Information Act.' },
              { icon:'☁️', title:'Secure Cloud Hosting', desc:'Hosted on enterprise infrastructure with SSL encryption. 99.9% uptime SLA on Enterprise plan.' },
              { icon:'🇿🇦', title:'South African Support', desc:'Built, hosted, and supported in South Africa. SAST business hours. Real people.' },
              { icon:'💬', title:'Meta Approved', desc:'Official WhatsApp Business API with Meta-approved message templates. No grey areas.' },
              { icon:'🏦', title:'Paystack Payments', desc:'Payments powered by Paystack — South Africa\'s leading payment infrastructure.' },
              { icon:'🤖', title:'Anthropic AI', desc:'Lead intelligence powered by Claude — one of the world\'s most trusted AI systems.' },
            ].map((item, i) => (
              <div key={i} style={{ background:t.card, border:`1px solid ${t.dim}`, borderRadius:'14px', padding:'20px' }}>
                <span style={{ fontSize:'28px', display:'block', marginBottom:'12px' }}>{item.icon}</span>
                <h3 style={{ fontSize:'15px', fontWeight:'700', marginBottom:'8px' }}>{item.title}</h3>
                <p style={{ color:t.muted, fontSize:'13px', lineHeight:1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CUSTOMER SUCCESS — CIO recommendation ──────────────── */}
      <section style={{ padding:'80px 24px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'800px', margin:'0 auto', textAlign:'center' }}>
          <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'40px' }}>Customer success</p>
          <div style={{ background:t.card, border:`1px solid ${t.lime}22`, borderRadius:'24px', padding:'48px 40px', position:'relative' }}>
            <span style={{ fontSize:'48px', color:`${t.lime}44`, fontFamily:'Georgia', position:'absolute', top:'24px', left:'32px', lineHeight:1 }}>"</span>
            <p style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(18px, 3vw, 26px)', fontWeight:'700', lineHeight:1.5, marginBottom:'28px', fontStyle:'italic', color:t.text }}>
              We woke up and the leads were already there. 47 qualified leads in our first month — 11 came in after midnight. We didn't miss a single one.
            </p>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:`linear-gradient(135deg, ${t.lime}, ${t.moss})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🏠</div>
              <div style={{ textAlign:'left' }}>
                <p style={{ fontWeight:'700', fontSize:'14px' }}>Alexandra Rentals</p>
                <p style={{ color:t.muted, fontSize:'12px' }}>Johannesburg, South Africa · Rental Agency</p>
              </div>
              <div style={{ marginLeft:'auto', display:'flex', gap:'8px' }}>
                <span style={{ background:`${t.lime}18`, color:t.lime, fontSize:'12px', padding:'4px 10px', borderRadius:'999px', fontWeight:'700' }}>47 leads</span>
                <span style={{ background:`${t.cyan}18`, color:t.cyan, fontSize:'12px', padding:'4px 10px', borderRadius:'999px', fontWeight:'700' }}>0 missed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ─────────────────────────────────────── */}
      <section style={{ padding:'80px 24px', background:t.surface, position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px' }}>Who it's for</p>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px, 4vw, 48px)', fontWeight:'900', marginBottom:'12px' }}>Any business drowning in WhatsApp messages.</h2>
          <p style={{ color:t.muted, fontSize:'17px', marginBottom:'48px', maxWidth:'520px' }}>If customers message you on WhatsApp and your team can't keep up — Easy Branding AI was built for you.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'12px' }}>
            {[
              { icon:'🏠', industry:'Rental Agencies',       use:'Qualify rental applicants' },
              { icon:'🏡', industry:'Property Sales',        use:'Qualify property buyers' },
              { icon:'🎵', industry:'Music & Entertainment', use:'Manage artist enquiries' },
              { icon:'🎓', industry:'Education',             use:'Student admissions' },
              { icon:'🚗', industry:'Car Dealerships',       use:'Qualify vehicle buyers' },
              { icon:'⚖️', industry:'Law Firms',             use:'Client intake & screening' },
              { icon:'🏥', industry:'Medical Practices',     use:'Patient appointment qualifying' },
              { icon:'💼', industry:'Recruitment',           use:'Pre-screen candidates' },
            ].map((item, i) => (
              <div key={i} style={{ background:t.card, border:`1px solid ${t.dim}`, borderRadius:'12px', padding:'18px', display:'flex', gap:'12px', alignItems:'flex-start' }}>
                <span style={{ fontSize:'22px', flexShrink:0 }}>{item.icon}</span>
                <div>
                  <p style={{ fontWeight:'700', fontSize:'13px', marginBottom:'3px' }}>{item.industry}</p>
                  <p style={{ color:t.muted, fontSize:'12px' }}>{item.use}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ padding:'80px 24px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'800px', margin:'0 auto' }}>
          <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px' }}>Setup</p>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px, 4vw, 48px)', fontWeight:'900', marginBottom:'48px' }}>Live in 15 minutes.</h2>
          {[
            { n:'01', title:'Connect your WhatsApp number', desc:'Register your existing business number or get a new one. We connect it to the platform in minutes — your customers message the same number they already know.' },
            { n:'02', title:'Configure your workflow', desc:'Choose your industry and we pre-load the right questions and rules. Or customise everything in 5 minutes from your dashboard.' },
            { n:'03', title:'Go live', desc:'Your customers message your WhatsApp number as normal. The AI qualifies them, scores them, and routes them to your team — automatically.' },
            { n:'04', title:'Close deals from your dashboard', desc:'See every lead, AI score, and conversation in one place. Your team takes over when it matters. Everything else runs itself.' },
          ].map((step, i) => (
            <div key={i} style={{ display:'flex', gap:'28px', padding:'32px 0', borderBottom: i < 3 ? `1px solid ${t.dim}` : 'none' }}>
              <div style={{ fontFamily:"'Fraunces', serif", fontSize:'52px', fontWeight:'900', color:`${t.lime}20`, lineHeight:1, flexShrink:0, width:'70px' }}>{step.n}</div>
              <div style={{ paddingTop:'8px' }}>
                <h3 style={{ fontSize:'20px', fontWeight:'700', marginBottom:'8px' }}>{step.title}</h3>
                <p style={{ color:t.muted, fontSize:'15px', lineHeight:1.65 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING — CIO: refined ────────────────────────────── */}
      <section style={{ padding:'80px 24px', background:t.surface, position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px' }}>Pricing</p>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px, 4vw, 48px)', fontWeight:'900', marginBottom:'12px' }}>Less than one commission. Every month.</h2>
          <p style={{ color:t.muted, fontSize:'17px', marginBottom:'8px' }}>First 30 days free. No setup fees. Cancel anytime.</p>
          <p style={{ color:t.sage, fontSize:'14px', marginBottom:'48px', fontStyle:'italic' }}>One qualified lead typically pays for months of the platform.</p>

          <div className="three-col" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px' }}>
            {[
              { name:'Starter', price:'R950', period:'/month', color:t.sage, highlight:false, features:['1 WhatsApp number','Automated qualification','AI lead scoring','Live dashboard','Document management','Up to 3 agents','Email support'] },
              { name:'Growth', price:'R2,450', period:'/month', color:t.lime, highlight:true, badge:'Most Popular', features:['2 WhatsApp numbers','Everything in Starter','Internal team chat','ROI reporting','Payment collection','Up to 10 agents','Priority support'] },
              { name:'Enterprise', price:'Custom', period:'', color:t.cyan, highlight:false, features:['Unlimited numbers','Everything in Growth','E-signing','API access','Unlimited agents','Dedicated support + SLA'] },
            ].map((plan, i) => (
              <div key={i} style={{ background:plan.highlight ? '#1A2E10' : t.card, border:`1px solid ${plan.highlight ? plan.color + '55' : t.dim}`, borderRadius:'16px', padding:'32px', position:'relative', boxShadow:plan.highlight ? `0 0 40px ${plan.color}14` : 'none' }}>
                {plan.badge && <div style={{ position:'absolute', top:'-13px', left:'50%', transform:'translateX(-50%)', background:t.lime, color:'#06080A', fontSize:'11px', fontWeight:'800', padding:'4px 16px', borderRadius:'999px', whiteSpace:'nowrap' }}>{plan.badge}</div>}
                <p style={{ color:plan.color, fontSize:'12px', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'16px' }}>{plan.name}</p>
                <div style={{ marginBottom:'24px' }}>
                  <span style={{ fontFamily:"'Fraunces', serif", fontSize:'48px', fontWeight:'900' }}>{plan.price}</span>
                  <span style={{ color:t.muted, fontSize:'16px' }}>{plan.period}</span>
                </div>
                <div style={{ height:'1px', background:t.dim, marginBottom:'24px' }} />
                <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'10px', marginBottom:'28px' }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display:'flex', alignItems:'center', gap:'10px', fontSize:'14px' }}>
                      <span style={{ color:plan.color, flexShrink:0 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" style={{ display:'block', textAlign:'center', padding:'13px', background:plan.highlight ? t.lime : `${plan.color}18`, color:plan.highlight ? '#06080A' : plan.color, borderRadius:'10px', fontWeight:'700', fontSize:'14px', textDecoration:'none', border:`1px solid ${plan.highlight ? 'transparent' : plan.color + '30'}` }}>
                  {plan.price === 'Custom' ? 'Contact us' : 'Start free trial'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section style={{ padding:'80px 24px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'680px', margin:'0 auto' }}>
          <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px' }}>FAQ</p>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px, 4vw, 42px)', fontWeight:'900', marginBottom:'40px' }}>Common questions.</h2>
          {[
            { q:'Do my customers need to download anything?', a:'No. They message your existing WhatsApp number exactly as they do today. Nothing changes on their side.' },
            { q:'Can I keep my existing WhatsApp number?', a:'Yes. We connect your existing business number to the platform. Your customers message the same number they already know.' },
            { q:'Does the bot replace my agents?', a:'No. The bot handles the repetitive qualification questions — freeing your agents to focus on closing deals. Agents can take over any conversation instantly from the dashboard.' },
            { q:'What industries does it work for?', a:'Any business receiving high volumes of WhatsApp enquiries. Rental agencies, property sales, car dealerships, law firms, medical practices, schools, recruitment — if customers message you on WhatsApp, we can automate it.' },
            { q:'Is my customer data safe and POPIA compliant?', a:'Yes. Each client is fully isolated on our platform. Your leads, conversations and data are never shared with other businesses. We handle all data in compliance with POPIA.' },
            { q:'How long does setup take?', a:'Most businesses are live within 15 minutes. We handle the technical setup. You configure your questions and messages in our simple dashboard.' },
          ].map((item, i) => (
            <div key={i} style={{ borderBottom:`1px solid ${t.dim}` }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 0', background:'none', border:'none', color:t.text, cursor:'pointer', fontFamily:'inherit', fontSize:'16px', fontWeight:'600', textAlign:'left', gap:'16px' }}>
                {item.q}
                <span style={{ color:t.lime, fontSize:'22px', flexShrink:0, transition:'transform 0.2s', display:'block', transform:openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </button>
              {openFaq === i && <p style={{ color:t.muted, fontSize:'15px', lineHeight:1.7, paddingBottom:'20px' }}>{item.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section style={{ padding:'80px 24px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'700px', margin:'0 auto', textAlign:'center' }}>
          <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:'24px', padding:'60px 40px' }}>
            <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'20px' }}>Ready?</p>
            <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px, 5vw, 52px)', fontWeight:'900', marginBottom:'16px', lineHeight:1.1 }}>
              Your first qualified lead<br />
              <span style={{ color:t.lime, fontStyle:'italic' }}>tonight.</span>
            </h2>
            <p style={{ color:t.muted, fontSize:'16px', marginBottom:'32px', lineHeight:1.6 }}>First 30 days free. No credit card required. Live in 15 minutes.</p>
            <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
              <Link to="/register" className="btn-lime" style={{ fontSize:'16px', padding:'16px 36px' }}>Start Free Trial →</Link>
              <a href="https://wa.me/27653318266?text=Hi" target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize:'16px', padding:'16px 28px' }}>
                <span>💬</span> Try it on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ borderTop:`1px solid ${t.dim}`, padding:'40px 24px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'18px' }}>🌿</span>
            <span style={{ fontSize:'14px', fontWeight:'700' }}>Easy Branding <span style={{ color:t.lime }}>AI</span></span>
          </div>
          <p style={{ color:t.muted, fontSize:'13px' }}>© 2026 Easy Branding AI (Pty) Ltd · Reg No. 2026/453740/07 · POPIA Compliant</p>
          <div style={{ display:'flex', gap:'20px', flexWrap:'wrap' }}>
            <Link to="/contact"   style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>Contact</Link>
            <Link to="/terms"         style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>Terms of Use</Link>
            <Link to="/privacy"       style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>Privacy Policy</Link>
            <Link to="/refund-policy"  style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>Refund Policy</Link>
            <Link to="/login"         style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>Sign In</Link>
            <Link to="/register"      style={{ color:t.lime,  fontSize:'13px', textDecoration:'none', fontWeight:'600' }}>Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}