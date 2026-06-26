// src/pages/Home.jsx
// WABOS — WhatsApp Business Operating System
// Company: Easy Branding AI (Pty) Ltd

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
    { dir: 'out', text: 'Welcome to Glow Hair Studio 💇\n\nReply with your full name to book your appointment.', delay: 800 },
    { dir: 'in',  text: 'Sipho Dube', delay: 2000 },
    { dir: 'out', text: 'What service would you like? ✨\n\nHaircut · Colour · Braids · Treatment', delay: 3000 },
    { dir: 'in',  text: 'Haircut', delay: 4200 },
    { dir: 'out', text: 'When would you like to come in? (e.g. Saturday morning)', delay: 5000 },
    { dir: 'in',  text: 'Saturday 10am', delay: 6000 },
    { dir: 'out', text: '✅ Booking received, Sipho! 💇\n\nWe\'ll confirm your slot within 2 hours. Can\'t wait to see you! ✨', delay: 7200, qualify: true },
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
    <div id="live-demo-container" style={{ background: '#111', borderRadius: '24px', overflow: 'hidden', width: '100%', maxWidth: '300px', boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 40px 80px rgba(0,0,0,0.7)', margin: '0 auto' }}>
      <div style={{ background: '#075e54', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `linear-gradient(135deg, ${t.lime}, ${t.moss})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🏠</div>
        <div>
          <p style={{ color: '#fff', fontWeight: '600', fontSize: '13px', margin: 0 }}>Glow Hair Studio</p>
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

// ── Dashboard mockup ─────────────────────────────────────────
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
      <div style={{ background: '#141810', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {['#f87171','#fbbf24','#34d399'].map((c,i) => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '4px 12px', marginLeft: '8px' }}>
          <p style={{ color: '#8A9080', fontSize: '11px', margin: 0 }}>wabos.com/leads</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.04)', margin: '16px' }}>
        {[{l:'Leads',v:'47',c:'#EEF0E8'},{l:'Qualified',v:'31',c:'#B8F040'},{l:'Today',v:'8',c:'#fbbf24'},{l:'Rate',v:'66%',c:'#34d399'}].map((s,i) => (
          <div key={i} style={{ background: '#121710', padding: '12px', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: '900', color: s.c, margin: 0 }}>{s.v}</p>
            <p style={{ color: '#8A9080', fontSize: '10px', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</p>
          </div>
        ))}
      </div>
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

// ── AI Summary Card ──────────────────────────────────────────
function AISummaryCard() {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:`${t.red}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>🧠</div>
        <div>
          <p style={{ fontWeight:'700', fontSize:'15px' }}>AI Lead Intelligence</p>
          <p style={{ color:t.muted, fontSize:'12px' }}>What WABOS sends you after a lead messages</p>
        </div>
      </div>
      <div style={{ background:'#121710', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'20px', display:'flex', flexDirection:'column', gap:'10px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ color:t.muted, fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Lead Score</span>
          <span style={{ background:`${t.lime}18`, color:t.lime, fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'999px' }}>HOT</span>
        </div>
        <p style={{ fontFamily:"'Fraunces', serif", fontSize:'42px', fontWeight:'900', color:t.lime, lineHeight:1 }}>9/10</p>
        <p style={{ color:t.text, fontSize:'14px', fontWeight:'600' }}>Sipho Dube</p>
        <p style={{ color:t.muted, fontSize:'13px', lineHeight:'1.6' }}>Ready to buy. Budget R2,500 confirmed for driving lessons in Sandton. Wants to start next week.</p>
        <div style={{ height:'1px', background:'rgba(255,255,255,0.06)' }} />
        <p style={{ color:t.lime, fontSize:'13px', fontWeight:'700' }}>📞 Recommended: Call within 1 hour</p>
        <p style={{ color:'#4A6741', fontSize:'10px', fontStyle:'italic', textAlign:'center', marginTop:'4px' }}>Generated by WABOS AI · 30 seconds after message received</p>
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
          <span style={{ fontSize:'15px', fontWeight:'700', color:t.text }}>Easy<span style={{ color:t.lime }}>Branding</span></span>
          <span style={{ fontSize:'11px', color:t.lime, fontWeight:'600', background:`${t.lime}15`, padding:'2px 8px', borderRadius:'4px' }}>AI</span>
        </Link>
        <div className="nav-desktop" style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <Link to="/login" style={{ color:t.muted, textDecoration:'none', fontSize:'14px', padding:'8px 16px' }}>Sign In</Link>
          <Link to="/register" className="btn-lime" style={{ padding:'8px 20px', fontSize:'14px' }}>Get Started</Link>
        </div>
        <div className="nav-mobile" style={{ display:'none', gap:'6px', alignItems:'center' }}>
          <Link to="/login" style={{ color:t.muted, textDecoration:'none', fontSize:'13px', padding:'6px 10px' }}>Sign In</Link>
          <Link to="/register" className="btn-lime" style={{ padding:'7px 14px', fontSize:'13px' }}>Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ paddingTop:'100px', minHeight:'100vh', display:'flex', alignItems:'center', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'40px 24px', width:'100%' }}>
          <div className="hero-layout" style={{ display:'grid', gridTemplateColumns:'1fr 420px', gap:'60px', alignItems:'center' }}>
            
            {/* LEFT COLUMN */}
            <div>
              {/* ── WABOS EXPLANATION – BIG PROMINENT PILL ────── */}
              <div style={{ 
                display:'inline-flex', 
                alignItems:'center', 
                gap:'10px', 
                background:`${t.lime}15`, 
                border:`1px solid ${t.lime}30`, 
                borderRadius:'999px', 
                padding:'10px 20px', 
                marginBottom:'20px',
                boxShadow: `0 0 30px ${t.lime}15`,
              }}>
                <span style={{ 
                  width:'8px', 
                  height:'8px', 
                  borderRadius:'50%', 
                  background:t.lime, 
                  boxShadow:`0 0 12px ${t.lime}`, 
                  flexShrink:0,
                  animation: 'pulse 2s infinite'
                }}></span>
                <span style={{ 
                  color:t.lime, 
                  fontSize:'clamp(13px, 1.5vw, 16px)', 
                  fontWeight:'700', 
                  letterSpacing:'0.04em',
                  textTransform: 'uppercase'
                }}>
                  WABOS — WhatsApp Business Operating System
                </span>
              </div>

              <h1 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(36px, 5.5vw, 64px)', fontWeight:'900', lineHeight:1.05, marginBottom:'16px' }}>
                You lost leads last night.<br/>
                <span style={{ color:t.muted, fontWeight:'400' }}>They messaged. You were asleep.</span>
              </h1>

              {/* ── WABOS EXPLANATION – SECONDARY TEXT ────────── */}
              <p style={{ 
                fontSize:'clamp(14px, 1.8vw, 20px)', 
                color:t.text, 
                lineHeight:1.5, 
                marginBottom:'16px',
                fontWeight:'600',
                fontFamily: "'Fraunces', serif",
                fontStyle: 'italic'
              }}>
                The <span style={{ color:t.lime, fontWeight:'700' }}>WhatsApp Business Operating System</span> that never sleeps.
              </p>

              <p style={{ fontSize:'clamp(16px, 2vw, 20px)', color:t.text, lineHeight:1.6, marginBottom:'12px', fontWeight:'500' }}>
                <span style={{ color:t.lime, fontWeight:'700' }}>WABOS</span> would have replied to all of them in under 3 seconds.
              </p>

              <p style={{ fontSize:'15px', color:t.muted, lineHeight:1.7, marginBottom:'28px', maxWidth:'460px' }}>
                Qualified the hot ones. Scored them with AI. Booked the appointment. Collected the payment. All before you opened your eyes.
              </p>

              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'24px' }}>
                {['Lead capture.','AI scoring.','Human takeover.','Appointments.','Payments.','Invoicing.'].map((item, i) => (
                  <span key={i} style={{ background:`${t.lime}12`, border:`1px solid ${t.lime}22`, color:t.lime, fontSize:'13px', fontWeight:'600', padding:'5px 14px', borderRadius:'999px' }}>{item}</span>
                ))}
              </div>

              <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'32px' }}>
                <Link to="/register" className="btn-lime" style={{ fontSize:'16px', padding:'15px 32px' }}>Start free — 30 days</Link>
                <a href="https://wa.me/27653318266?text=Hi" target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize:'16px', padding:'15px 28px' }}>
                  <span>💬</span> Try WABOS live
                </a>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 0' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:`linear-gradient(135deg, ${t.lime}, ${t.moss})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0, fontWeight:'700', color:'#06080A' }}>EB</div>
                <div>
                  <p style={{ color:t.text, fontSize:'13px', fontWeight:'600', margin:0 }}>Built by Ayanda · Easy Branding AI · South Africa</p>
                  <p style={{ color:t.muted, fontSize:'11px', margin:'2px 0 0' }}>POPIA-compliant · CIPC registered · Bootstrapped</p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="hide-mob">
              <div style={{ textAlign:'center', marginBottom:'12px' }}>
                <span style={{ background:`${t.lime}18`, color:t.lime, fontSize:'11px', fontWeight:'700', padding:'5px 14px', borderRadius:'999px', letterSpacing:'0.06em' }}>👇 WATCH WABOS IN ACTION</span>
              </div>
              <LiveDemo />
              <div style={{ textAlign:'center', marginTop:'12px' }}>
                <p style={{ color:t.muted, fontSize:'13px' }}>Send <strong style={{ color:t.lime }}>"Hi"</strong> to <strong style={{ color:t.text }}>+27 65 331 8266</strong> to try WABOS yourself</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────── */}
      <section style={{ padding:'24px', background:t.surface, borderTop:`1px solid ${t.dim}`, borderBottom:`1px solid ${t.dim}`, position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto', display:'flex', justifyContent:'center', flexWrap:'wrap', gap:'32px', alignItems:'center' }}>
          {[
            { icon:'🇿🇦', text:'Built in South Africa' },
            { icon:'🔒', text:'POPIA Compliant' },
            { icon:'☁️', text:'Secure Cloud Hosting' },
            { icon:'💬', text:'WhatsApp Business API' },
            { icon:'🤖', text:'WABOS AI Powered' },
            { icon:'📱', text:'WABOS — WhatsApp OS' },
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
              { pain:'"We miss leads that come in over weekends and after hours."', fix:'WABOS qualifies 24/7 — no missed leads, ever.', icon:'😴' },
              { pain:'"My team spends all day answering the same WhatsApp questions."', fix:'Automated qualification frees your team to close deals.', icon:'📱' },
              { pain:'"I have no idea which leads are worth calling first."', fix:'WABOS AI scores every lead 1-10 with a recommended action.', icon:'🤷' },
            ].map((item, i) => (
              <div key={i} style={{ background:t.card, border:`1px solid ${t.dim}`, borderRadius:'16px', padding:'28px', display:'flex', flexDirection:'column', gap:'16px' }}>
                <span style={{ fontSize:'32px' }}>{item.icon}</span>
                <p style={{ color:t.muted, fontSize:'15px', lineHeight:1.6, fontStyle:'italic' }}>"{item.pain}"</p>
                <div style={{ height:'1px', background:`${t.lime}22` }} />
                <p style={{ color:t.lime, fontSize:'14px', fontWeight:'600', lineHeight:1.5 }}>→ {item.fix}</p>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'1px', background:t.dim, borderRadius:'16px', overflow:'hidden', border:`1px solid ${t.dim}` }}>
            {[
              { v:'2 min', l:'Avg lead qualify time', c:t.lime },
              { v:'24/7',  l:'WABOS never sleeps',   c:t.cyan },
              { v:'0',     l:'Missed leads',          c:t.emerald },
              { v:'R999',  l:'Professional per month', c:t.amber },
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
              <br /><span style={{ color:t.lime, fontStyle:'italic' }}>Try WABOS right now.</span>
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

      {/* ── PRODUCT SHOWCASE ──────────────────────────────────── */}
      <section style={{ padding:'80px 24px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px' }}>The product</p>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px, 4vw, 48px)', fontWeight:'900', marginBottom:'12px' }}>See exactly what WABOS does.</h2>
          <p style={{ color:t.muted, fontSize:'17px', marginBottom:'48px', maxWidth:'520px' }}>Live animated previews of the actual platform.</p>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'24px' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:`${t.lime}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>💬</div>
                <div>
                  <p style={{ fontWeight:'700', fontSize:'15px' }}>WhatsApp Qualification</p>
                  <p style={{ color:t.muted, fontSize:'12px' }}>Your customers' experience with WABOS</p>
                </div>
              </div>
              <LiveDemo />
            </div>

            <AISummaryCard />

            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:`${t.amber}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>📊</div>
                <div>
                  <p style={{ fontWeight:'700', fontSize:'15px' }}>WABOS Dashboard</p>
                  <p style={{ color:t.muted, fontSize:'12px' }}>Your team's command centre</p>
                </div>
              </div>
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT WABOS DOES ───────────────────────────────────── */}
      <section style={{ padding:'80px 24px', background:t.surface, position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px' }}>What WABOS does</p>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px, 4vw, 48px)', fontWeight:'900', marginBottom:'12px' }}>Everything in one place.</h2>
          <p style={{ color:t.muted, fontSize:'17px', marginBottom:'48px', maxWidth:'520px' }}>WhatsApp is the interface. WABOS is the engine running your entire business behind it.</p>

          <div className="three-col" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px' }}>
            {[
              { icon:'📥', color:t.lime, title:'Lead Qualification', desc:'Customers message your WhatsApp. WABOS AI qualifies them, scores them 1-10, and routes them to your team. 24/7 automated.', features:['24/7 automated','AI scoring 1-10','Live dashboard','Human takeover'] },
              { icon:'👤', color:t.cyan, title:'Human Takeover', desc:'Agents take over any conversation from their personal WhatsApp. Seamless handoff — customer never notices.', features:['One-command takeover','Agent WhatsApp','Full history','Role-based access'] },
              { icon:'💳', color:t.amber, title:'Payments & Invoicing', desc:'Collect payments via Paystack links sent through WhatsApp. Create and send invoices instantly with WABOS.', features:['Paystack integration','Payment links','Invoices via WhatsApp','Full tracking'] },
            ].map((p, i) => (
              <div key={i} className="fcard" style={{ borderTop:`3px solid ${p.color}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
                  <span style={{ fontSize:'22px' }}>{p.icon}</span>
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

      {/* ── COMMAND CENTRE ────────────────────────────────────── */}
      <section style={{ padding:'80px 24px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px' }}>Command Centre</p>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px, 4vw, 48px)', fontWeight:'900', marginBottom:'48px' }}>Control your business from WhatsApp.</h2>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'12px' }}>
            {[
              { cmd:'LEADS', desc:'View today\'s leads' },
              { cmd:'TAKEOVER', desc:'Take over a lead\'s chat' },
              { cmd:'APT', desc:'View appointments' },
              { cmd:'PAY', desc:'Send payment link' },
              { cmd:'INVOICE', desc:'Create invoice' },
              { cmd:'STATS', desc:'Business performance' },
              { cmd:'AGENTS', desc:'Team activity' },
              { cmd:'/pac on/off', desc:'PAC mode toggle' },
            ].map((item, i) => (
              <div key={i} style={{ background:t.card, border:`1px solid ${t.dim}`, borderRadius:'12px', padding:'16px', display:'flex', flexDirection:'column', gap:'4px' }}>
                <p style={{ color:t.lime, fontSize:'18px', fontWeight:'800', fontFamily: 'monospace' }}>{item.cmd}</p>
                <p style={{ color:t.muted, fontSize:'12px' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ padding:'80px 24px', background:t.surface, position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'800px', margin:'0 auto', textAlign:'center' }}>
          <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'40px' }}>How it works</p>
          <div style={{ background:t.card, border:`1px solid ${t.lime}22`, borderRadius:'24px', padding:'48px 40px', position:'relative' }}>
            <p style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(18px, 3vw, 26px)', fontWeight:'700', lineHeight:1.5, marginBottom:'28px', color:t.text }}>
              A customer messages your business at midnight. The bot replies instantly, qualifies them, and books them. You wake up to a lead that's ready — you didn't lift a finger.
            </p>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:`linear-gradient(135deg, ${t.lime}, ${t.moss})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🌿</div>
              <div style={{ textAlign:'left' }}>
                <p style={{ fontWeight:'700', fontSize:'14px' }}>Works while you sleep</p>
                <p style={{ color:t.muted, fontSize:'12px' }}>24/7 · every message · never missed</p>
              </div>
              <div style={{ marginLeft:'auto', display:'flex', gap:'8px' }}>
                <span style={{ background:`${t.lime}18`, color:t.lime, fontSize:'12px', padding:'4px 10px', borderRadius:'999px', fontWeight:'700' }}>24/7</span>
                <span style={{ background:`${t.cyan}18`, color:t.cyan, fontSize:'12px', padding:'4px 10px', borderRadius:'999px', fontWeight:'700' }}>0 missed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ─────────────────────────────────────── */}
      <section style={{ padding:'80px 24px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px' }}>Who it's for</p>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px, 4vw, 48px)', fontWeight:'900', marginBottom:'12px' }}>Any business drowning in WhatsApp messages.</h2>
          <p style={{ color:t.muted, fontSize:'17px', marginBottom:'48px', maxWidth:'520px' }}>If customers message you on WhatsApp and your team can't keep up — WABOS was built for you.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'12px' }}>
            {[
              { icon:'💇', industry:'Salons & Barbershops',  use:'Book appointments 24/7' },
              { icon:'🚦', industry:'Driving Schools',        use:'Book lessons automatically' },
              { icon:'🚗', industry:'Car Dealerships',       use:'Qualify vehicle buyers' },
              { icon:'🏥', industry:'Medical Practices',     use:'Patient appointment booking' },
              { icon:'⚖️', industry:'Law Firms',             use:'Client intake & screening' },
              { icon:'🎓', industry:'Education',             use:'Student admissions' },
              { icon:'💼', industry:'Recruitment',           use:'Pre-screen candidates' },
              { icon:'🏠', industry:'Property & Rentals',     use:'Qualify buyers & tenants' },
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

      {/* ── SETUP ────────────────────────────────────────────── */}
      <section style={{ padding:'80px 24px', background:t.surface, position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'800px', margin:'0 auto' }}>
          <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px' }}>Setup</p>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px, 4vw, 48px)', fontWeight:'900', marginBottom:'48px' }}>Live in 15 minutes.</h2>
          {[
            { n:'01', title:'Connect your WhatsApp number', desc:'Register your existing business number or get a new one. We connect it to WABOS in minutes — your customers message the same number they already know.' },
            { n:'02', title:'Configure your workflow', desc:'Choose your industry and we pre-load the right questions and rules. Or customise everything in 5 minutes.' },
            { n:'03', title:'Go live', desc:'Your customers message your WhatsApp number as normal. The AI qualifies them, scores them, and routes them to your team — automatically.' },
          ].map((step, i) => (
            <div key={i} style={{ display:'flex', gap:'28px', padding:'32px 0', borderBottom: i < 2 ? `1px solid ${t.dim}` : 'none' }}>
              <div style={{ fontFamily:"'Fraunces', serif", fontSize:'52px', fontWeight:'900', color:`${t.lime}20`, lineHeight:1, flexShrink:0, width:'70px' }}>{step.n}</div>
              <div style={{ paddingTop:'8px' }}>
                <h3 style={{ fontSize:'20px', fontWeight:'700', marginBottom:'8px' }}>{step.title}</h3>
                <p style={{ color:t.muted, fontSize:'15px', lineHeight:1.65 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOUNDER NOTE ──────────────────────────────────────── */}
      <section style={{ padding:'80px 24px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'700px', margin:'0 auto' }}>
          <div style={{ background:`linear-gradient(135deg, ${t.lime}08, ${t.moss}06)`, border:`1px solid ${t.lime}18`, borderRadius:'24px', padding:'48px 40px', textAlign:'center' }}>
            
            <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:`linear-gradient(135deg, ${t.lime}, ${t.moss})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', margin:'0 auto 20px', fontWeight:'800', color:'#06080A' }}>EB</div>
            
            <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(22px, 3vw, 32px)', fontWeight:'900', marginBottom:'16px', lineHeight:1.3 }}>
              I built WABOS because I watched a friend lose <span style={{ color:t.lime }}>R12,000</span> in a month.
            </h2>
            
            <p style={{ color:t.muted, fontSize:'15px', lineHeight:1.7, marginBottom:'20px', maxWidth:'540px', marginLeft:'auto', marginRight:'auto' }}>
              Bookings messaged his salon after hours. No one replied. They went somewhere else. I built <strong style={{ color:t.lime }}>WABOS — the WhatsApp Business Operating System</strong> so no South African business owner has to lose money because they need to sleep.
            </p>
            
            <p style={{ color:t.muted, fontSize:'15px', lineHeight:1.7, marginBottom:'28px', maxWidth:'540px', marginLeft:'auto', marginRight:'auto' }}>
              Easy Branding AI is bootstrapped, profitable, and POPIA-compliant. I answer support messages myself. Try WABOS free for 30 days. If it doesn't pay for itself in qualified leads, I'll help you cancel personally.
            </p>
            
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
              <span style={{ color:t.text, fontSize:'14px', fontWeight:'600' }}>— Ayanda</span>
              <span style={{ color:t.muted, fontSize:'13px' }}>Founder, Easy Branding AI</span>
            </div>

            <div style={{ marginTop:'24px', padding:'12px 20px', background:'rgba(255,255,255,0.03)', borderRadius:'12px', display:'inline-block' }}>
              <p style={{ color:t.muted, fontSize:'12px', margin:0 }}>
                📱 Message me directly: <a href="https://wa.me/27653318266" style={{ color:t.lime, textDecoration:'none', fontWeight:'600' }}>WhatsApp Ayanda</a>
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section style={{ padding:'80px 24px', background:t.surface, position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px' }}>Pricing</p>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px, 4vw, 48px)', fontWeight:'900', marginBottom:'12px' }}>Less than one commission. Every month.</h2>
          <p style={{ color:t.muted, fontSize:'17px', marginBottom:'8px' }}>First 30 days free. No setup fees. Cancel anytime.</p>

          <div style={{ background:`${t.lime}06`, border:`1px solid ${t.lime}15`, borderRadius:'14px', padding:'20px 24px', marginBottom:'32px', display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
            <span style={{ fontSize:'28px', flexShrink:0 }}>💡</span>
            <div>
              <p style={{ color:t.text, fontSize:'15px', fontWeight:'600', marginBottom:'4px' }}>
                One qualified lead typically generates R1,500 – R15,000 for WABOS clients.
              </p>
              <p style={{ color:t.muted, fontSize:'14px', margin:0 }}>
                WABOS costs <strong style={{ color:t.lime }}>R999/month</strong>. You need one extra lead every 30 days to come out ahead. <strong style={{ color:t.text }}>Most clients get that in the first 48 hours.</strong>
              </p>
            </div>
          </div>

          <div className="three-col" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px' }}>
            {[
              { name:'Professional', price:'R999', period:'/month', color:t.sage, highlight:false, badge:false, features:['1 WhatsApp number','Up to 5 agents','Lead qualification','AI scoring','Live dashboard','Email support'] },
              { name:'Business', price:'R2,499', period:'/month', color:t.lime, highlight:true, badge:'Most Popular', features:['2 WhatsApp numbers','Unlimited agents','Everything in Professional','Payments & invoicing','Priority support','AI disqualification'] },
              { name:'Enterprise', price:'Custom', period:'', color:t.cyan, highlight:false, badge:false, features:['Unlimited numbers','Everything in Business','White-label available','Dedicated support','Custom features'] },
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
            { q:'What is WABOS?', a:'WABOS stands for WhatsApp Business Operating System. It\'s a platform that turns your WhatsApp into a complete business management tool — handling leads, appointments, payments, and invoicing, all through WhatsApp.' },
            { q:'Do my customers need to download anything?', a:'No. They message your existing WhatsApp number exactly as they do today. Nothing changes on their side.' },
            { q:'Can I keep my existing WhatsApp number?', a:'Yes. We connect your existing business number to WABOS. Your customers message the same number they already know.' },
            { q:'Does the bot replace my team?', a:'No. The bot handles repetitive qualification questions — freeing your team to focus on closing deals. Team members can take over any conversation instantly from their personal WhatsApp.' },
            { q:'What industries does it work for?', a:'Any business receiving WhatsApp enquiries. Salons, driving schools, car dealerships, medical practices, law firms, schools, recruitment, property — if customers message you on WhatsApp, we can automate it.' },
            { q:'Is my customer data safe and POPIA compliant?', a:'Yes. Each client is fully isolated on our platform. Your leads, conversations and data are never shared with other businesses. We handle all data in compliance with POPIA.' },
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
            <p style={{ color:t.muted, fontSize:'16px', marginBottom:'8px', lineHeight:1.6 }}>First 30 days free. No credit card required. Live in 15 minutes.</p>
            
            <p style={{ color:t.sage, fontSize:'14px', marginBottom:'32px', fontStyle:'italic' }}>
              If WABOS doesn't deliver a qualified lead in your first 48 hours — message me personally. I'll help you figure out why.
            </p>

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
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:'8px', textDecoration:'none' }}>
            <span style={{ fontSize:'18px' }}>🌿</span>
            <span style={{ fontSize:'14px', fontWeight:'700', color:t.text }}>Easy<span style={{ color:t.lime }}>Branding</span></span>
            <span style={{ fontSize:'10px', color:t.lime, fontWeight:'600', background:`${t.lime}15`, padding:'1px 6px', borderRadius:'3px' }}>AI</span>
          </Link>
          <p style={{ color:t.muted, fontSize:'13px' }}>© 2026 Easy Branding AI (Pty) Ltd · POPIA Compliant</p>
          <div style={{ display:'flex', gap:'20px', flexWrap:'wrap' }}>
            <Link to="/contact" style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>Contact</Link>
            <Link to="/terms" style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>Terms</Link>
            <Link to="/privacy" style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>Privacy</Link>
            <Link to="/login" style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>Sign In</Link>
            <Link to="/register" style={{ color:t.lime, fontSize:'13px', textDecoration:'none', fontWeight:'600' }}>Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}