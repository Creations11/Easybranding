// src/pages/Home.jsx
// WABOS by Easy Branding AI
// "Put the phone down. The business is handled."
// Category: The Operating System for Chat-Based Businesses

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const t = {
  void:      '#14231C',
  voidDeep:  '#0D1712',
  bone:      '#EDE6D6',
  boneDim:   '#DDD4BF',
  signal:    '#C24E2C',
  signalDim: '#9A3D20',
  ink:       '#0D1712',
  fade:      '#8B9B8F',
};

// ── The quiet phone (hero visual) ──────────────────────────
function QuietPhone() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(show);
  }, []);

  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: '220px',
        height: '440px',
        background: t.voidDeep,
        borderRadius: '32px',
        border: `6px solid ${t.voidDeep}`,
        position: 'relative',
        boxShadow: '0 40px 80px -20px rgba(13,23,18,0.6)',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, #1A2B22 0%, ${t.void} 100%)`,
        }} />
        <div style={{
          position: 'absolute',
          bottom: '28px',
          left: 0,
          right: 0,
          textAlign: 'center',
          color: t.fade,
          fontSize: '12px',
          letterSpacing: '0.04em',
        }}>
          untouched since 07:14
        </div>
        {visible && (
          <div style={{
            position: 'absolute',
            top: '56px',
            left: '14px',
            right: '14px',
            background: t.bone,
            borderRadius: '12px',
            padding: '14px 16px',
            animation: 'notifPulse 6s ease-in-out infinite',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: t.voidDeep, marginBottom: '3px' }}>
              New booking confirmed
            </div>
            <div style={{ fontSize: '12px', color: t.ink, opacity: 0.7 }}>
              Sipho — Tuesday, 2pm — R450 paid
            </div>
          </div>
        )}
      </div>
      <div style={{
        position: 'absolute',
        bottom: '-36px',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: '13px',
        color: t.boneDim,
        fontStyle: 'italic',
        fontFamily: "'Fraunces', serif",
      }}>
        the phone stays down. the business doesn't stop.
      </div>
      <style>{`
        @keyframes notifPulse {
          0%, 55% { opacity: 0; transform: translateY(-6px); }
          62%, 85% { opacity: 1; transform: translateY(0); }
          95%, 100% { opacity: 0; transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

// ── FAQ Component ───────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState(null);
  const items = [
    {
      q: 'What is WABOS?',
      a: 'WABOS stands for Without A Back Office. It\'s the Operating System for Chat-Based Businesses — a platform that runs your entire business where your customers already talk to you. Leads, bookings, payments, invoices, and customer conversations all happen in one place, without a dashboard.'
    },
    {
      q: 'Do my customers need to download anything?',
      a: 'No. They message your existing number exactly as they do today. Nothing changes on their side.'
    },
    {
      q: 'Can I keep my existing number?',
      a: 'Yes. We connect your existing business number to WABOS. Your customers message the same number they already know.'
    },
    {
      q: 'Does WABOS replace my team?',
      a: 'No. WABOS handles repetitive work — qualifying leads, booking jobs, sending invoices. Your team steps in for the moments that matter. You\'re always one message away from taking over any conversation yourself.'
    },
    {
      q: 'What industries does it work for?',
      a: 'Any business that runs through conversation. Plumbers, electricians, builders, mechanics, cleaners, salon owners, driving schools, consultants — if customers message you and you do the work with your hands, WABOS was built for you.'
    },
    {
      q: 'Is my customer data safe?',
      a: 'Yes. Each business is fully isolated on our platform. Your conversations, leads, and data are never shared with other businesses. We handle all data in compliance with POPIA.'
    },
  ];

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <p className="section-label section-label-signal" style={{ marginBottom: '40px' }}>
        Common questions
      </p>
      {items.map((item, i) => (
        <div key={i} style={{ borderBottom: '1px solid rgba(13,23,18,0.12)' }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 0',
              background: 'none',
              border: 'none',
              color: t.voidDeep,
              cursor: 'pointer',
              fontFamily: "'Archivo', sans-serif",
              fontSize: '16px',
              fontWeight: 600,
              textAlign: 'left',
              gap: '16px',
            }}
          >
            {item.q}
            <span style={{
              color: t.signal,
              fontSize: '22px',
              flexShrink: 0,
              transition: 'transform 0.2s',
              display: 'block',
              transform: open === i ? 'rotate(45deg)' : 'none',
            }}>
              +
            </span>
          </button>
          {open === i && (
            <p style={{ color: t.ink, opacity: 0.65, fontSize: '15px', lineHeight: 1.7, paddingBottom: '20px' }}>
              {item.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Home page ───────────────────────────────────────────────
export default function Home() {
  return (
    <div style={{
      fontFamily: "'Archivo', sans-serif",
      background: t.bone,
      color: t.ink,
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .wrap { max-width: 1140px; margin: 0 auto; padding: 0 32px; }
        .wrap-narrow { max-width: 780px; margin: 0 auto; padding: 0 32px; }
        .section { padding: 100px 0; }
        .btn {
          background: ${t.signal};
          color: ${t.bone};
          border: none;
          padding: 17px 32px;
          border-radius: 4px;
          font-family: 'Archivo', sans-serif;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-dark {
          background: ${t.voidDeep};
          color: ${t.bone};
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .section-label {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 32px;
        }
        .section-label-signal { color: ${t.signalDim}; }
        .section-label-fade { color: ${t.fade}; }
        .moment-block {
          padding: 40px 0;
          border-top: 1px solid rgba(13,23,18,0.12);
        }
        .moment-block:last-of-type { border-bottom: 1px solid rgba(13,23,18,0.12); }
        .moment-time {
          font-family: "'Fraunces', serif";
          font-style: italic;
          font-size: 17px;
          color: ${t.signalDim};
          margin-bottom: 8px;
        }
        .moment-text {
          font-size: 20px;
          color: ${t.voidDeep};
          line-height: 1.5;
        }
        .pricing-line {
          font-family: "'Fraunces', serif";
          font-weight: 400;
          font-size: clamp(22px, 3.5vw, 28px);
          line-height: 1.4;
          color: ${t.voidDeep};
          letter-spacing: -0.01em;
        }
        .exit-headline {
          font-family: "'Fraunces', serif";
          font-weight: 700;
          font-size: clamp(28px, 5vw, 46px);
          color: ${t.bone};
          letter-spacing: -0.02em;
          margin-bottom: 20px;
        }
        @media (max-width: 860px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .phone-stage { order: -1; margin-bottom: 24px; }
          .section { padding: 72px 0; }
        }
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <div className="wrap">
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '28px 0',
          borderBottom: '1px solid rgba(13,23,18,0.1)',
        }}>
          <div>
            <div style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 800,
              fontSize: '22px',
              letterSpacing: '-0.01em',
            }}>
              WABOS
            </div>
            <div style={{
              color: t.fade,
              fontFamily: "'Archivo', sans-serif",
              fontWeight: 500,
              fontSize: '13px',
              letterSpacing: '0.02em',
              marginTop: '2px',
            }}>
              by Easy Branding AI
            </div>
          </div>
          <a
            href="https://wa.me/27653318266?text=Hi"
            target="_blank"
            rel="noreferrer"
            className="btn-dark"
          >
            Meet WABOS
          </a>
        </nav>
      </div>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <div className="wrap">
        <section className="hero-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1.15fr 0.85fr',
          gap: '64px',
          alignItems: 'center',
          padding: '96px 0 120px',
          position: 'relative',
          backgroundImage: 'url(/images/hero-dashboard.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 45%',
          backgroundRepeat: 'no-repeat',
          borderRadius: '24px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(13,23,18,0.6)',
            borderRadius: '24px',
            zIndex: 0,
          }} />
          <div style={{ position: 'relative', zIndex: 1, padding: '0 32px' }}>
            <h1 style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 700,
              fontSize: 'clamp(42px, 5.5vw, 64px)',
              lineHeight: 1.04,
              letterSpacing: '-0.02em',
              color: t.bone,
              marginBottom: '24px',
            }}>
              The back office is <em style={{ fontStyle: 'italic', fontWeight: 500, color: t.signal }}>dead</em>.
            </h1>
            <p style={{
              fontSize: '19px',
              color: t.boneDim,
              maxWidth: '480px',
              marginBottom: '48px',
            }}>
              Every conversation becomes work completed. Every message moves the business forward. No dashboard. No admin. No back office.
            </p>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <a
                href="https://wa.me/27653318266?text=Hi"
                target="_blank"
                rel="noreferrer"
                className="btn"
              >
                Watch it happen
              </a>
            </div>
          </div>
          <div className="phone-stage" style={{ position: 'relative', zIndex: 1 }}>
            <QuietPhone />
          </div>
        </section>
      </div>

      {/* ── ACT 1: THIS IS YOUR DAY ──────────────────────────── */}
      <section className="section">
        <div className="wrap-narrow">
          <p className="section-label section-label-signal">
            Right now, somewhere in South Africa
          </p>

          <div style={{ marginBottom: '48px' }}>
            <p style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 400,
              fontSize: 'clamp(22px, 3.5vw, 28px)',
              lineHeight: 1.5,
              color: t.voidDeep,
              letterSpacing: '-0.01em',
              marginBottom: '16px',
            }}>
              A customer thinks you're ignoring them.
            </p>
            <p style={{ fontSize: '18px', color: t.ink, opacity: 0.6, lineHeight: 1.6 }}>
              You're not. You're under a sink. You're on a ladder. You're in traffic between jobs. Your hands are busy. Your phone is in the van.
            </p>
          </div>

          <div style={{ marginBottom: '48px' }}>
            <p style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 400,
              fontSize: 'clamp(22px, 3.5vw, 28px)',
              lineHeight: 1.5,
              color: t.voidDeep,
              letterSpacing: '-0.01em',
              marginBottom: '16px',
            }}>
              By the time you reply, they've called someone else.
            </p>
            <p style={{ fontSize: '18px', color: t.ink, opacity: 0.6, lineHeight: 1.6 }}>
              Not because your work is worse. Not because your price is higher. Because they messaged four people, and someone else replied first.
            </p>
          </div>

          <div>
            <p style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 400,
              fontSize: 'clamp(22px, 3.5vw, 28px)',
              lineHeight: 1.5,
              color: t.voidDeep,
              letterSpacing: '-0.01em',
              marginBottom: '16px',
            }}>
              Tonight, you'll do admin instead of resting.
            </p>
            <p style={{ fontSize: '18px', color: t.ink, opacity: 0.6, lineHeight: 1.6 }}>
              Invoices. Follow-ups. Quotes you promised to send. Messages you missed while working. The work paid. The admin doesn't. But the admin still takes two hours.
            </p>
          </div>
        </div>
      </section>

      {/* ── ACT 2: HOW WE GOT HERE ───────────────────────────── */}
      <section className="section" style={{ background: t.boneDim }}>
        <div className="wrap-narrow">
          <p className="section-label section-label-signal">
            How we got here
          </p>
          <p style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 400,
            fontSize: 'clamp(22px, 3.5vw, 28px)',
            lineHeight: 1.5,
            color: t.voidDeep,
            letterSpacing: '-0.01em',
          }}>
            Somewhere along the way, we were told that running a business means logging into things. Dashboards. CRMs. Invoicing tools. Scheduling apps. Each one built for a different problem. Each one demanding your attention. Each one stealing time from the work that actually pays.
          </p>
        </div>
      </section>

      {/* ── ACT 3: THE WRONG ANSWER ──────────────────────────── */}
      <section className="section">
        <div className="wrap-narrow">
          <p className="section-label section-label-signal">
            The industry's answer
          </p>
          <p style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 400,
            fontSize: 'clamp(22px, 3.5vw, 28px)',
            lineHeight: 1.5,
            color: t.voidDeep,
            letterSpacing: '-0.01em',
            marginBottom: '24px',
          }}>
            More software. Another app. Another dashboard. Another thing to check. Another notification. Another password. Another monthly subscription for something that was supposed to save you time.
          </p>
          <p style={{ fontSize: '18px', color: t.ink, opacity: 0.6, lineHeight: 1.6 }}>
            The industry thinks the answer to too much software is better software. We think the answer is no software at all.
          </p>
        </div>
      </section>

      {/* ── ACT 4: WHAT WE BELIEVE ───────────────────────────── */}
      <section className="section" style={{ background: t.void }}>
        <div className="wrap-narrow">
          <p className="section-label section-label-fade">
            What we believe
          </p>
          <p style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 400,
            fontSize: 'clamp(24px, 4vw, 32px)',
            lineHeight: 1.4,
            color: t.bone,
            letterSpacing: '-0.01em',
            marginBottom: '32px',
          }}>
            Software should adapt to the business owner. Not the other way around.
          </p>
          <p style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 400,
            fontSize: 'clamp(22px, 3.5vw, 28px)',
            lineHeight: 1.5,
            color: t.bone,
            opacity: 0.7,
            letterSpacing: '-0.01em',
          }}>
            The dashboard should not exist. The back office should be invisible. The only thing a business owner should have to do is the work — and everything else should happen without them.
          </p>
        </div>
      </section>

      {/* ── ACT 5: PROOF ─────────────────────────────────────── */}
      <section className="section">
        <div className="wrap-narrow">
          <p className="section-label section-label-signal">
            What this looks like
          </p>

          <div className="moment-block">
            <div className="moment-time">
              11:20am. You're on a job.
            </div>
            <p className="moment-text">
              A lead messages. Gets quoted. Books. Pays.<br /><strong>The phone stays in the van.</strong>
            </p>
          </div>

          <div className="moment-block">
            <div className="moment-time">
              4:10pm. A customer is upset.
            </div>
            <p className="moment-text">
              The system knows. It hands you the conversation.<br /><strong>This one's yours.</strong>
            </p>
          </div>

          <p style={{
            textAlign: 'center',
            fontFamily: "'Fraunces', serif",
            fontStyle: 'italic',
            fontSize: '20px',
            color: t.fade,
            marginTop: '40px',
          }}>
            Everything else? Handled without you.
          </p>
        </div>
      </section>

      {/* ── ACT 6: THE REVEAL ────────────────────────────────── */}
      <section className="section" style={{ background: t.voidDeep, textAlign: 'center' }}>
        <div className="wrap-narrow">
          <p className="section-label section-label-fade">
            This is not the future
          </p>
          <h2 style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 700,
            fontSize: 'clamp(32px, 5vw, 48px)',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            color: t.bone,
            marginBottom: '16px',
          }}>
            We already built it.
          </h2>
          <p style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 400,
            fontSize: 'clamp(20px, 3vw, 24px)',
            color: t.signal,
            fontStyle: 'italic',
            marginBottom: '32px',
          }}>
            We killed it.
          </p>
          <p style={{
            fontSize: '18px',
            color: t.fade,
            marginBottom: '40px',
            maxWidth: '520px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            It's called WABOS. The Operating System for Chat-Based Businesses. It runs where your customers already talk to you. Every conversation becomes work completed. Every message moves the business forward. Without you touching a screen. Without a dashboard. Without a back office.
          </p>
          <a
            href="https://wa.me/27653318266?text=Hi"
            target="_blank"
            rel="noreferrer"
            className="btn"
          >
            Watch it happen
          </a>
        </div>
      </section>

      {/* ── ACT 7: THE OBJECTION ─────────────────────────────── */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="wrap-narrow">
          <p style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 700,
            fontSize: 'clamp(22px, 3.5vw, 28px)',
            color: t.voidDeep,
            letterSpacing: '-0.01em',
          }}>
            "What if something goes wrong?"
          </p>
          <p style={{
            fontSize: '17px',
            color: t.ink,
            opacity: 0.65,
            marginTop: '16px',
            maxWidth: '520px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            When it matters — a big job, an upset customer, a VIP — you're one message away from stepping in yourself. Always.
          </p>
        </div>
      </section>

      {/* ── ACT 8: THE COST ──────────────────────────────────── */}
      <section className="section" style={{ background: t.boneDim, textAlign: 'center' }}>
        <div className="wrap-narrow">
          <p className="pricing-line">
            R999/month.<br />
            Less than one missed job.<br />
            Less than one late-night admin session.<br />
            Less than the cost of wondering.
          </p>
          <a
            href="https://wa.me/27653318266?text=Hi"
            target="_blank"
            rel="noreferrer"
            className="btn"
            style={{ marginTop: '40px' }}
          >
            Start today. Cancel anytime.
          </a>
        </div>
      </section>

      {/* ── ACT 9: THE EXIT ──────────────────────────────────── */}
      <section className="section" style={{ background: t.voidDeep, textAlign: 'center' }}>
        <div className="wrap-narrow">
          <h2 className="exit-headline">
            Put the phone down.<br />The business is <em style={{ fontStyle: 'italic', color: t.signal, fontWeight: 500 }}>handled</em>.
          </h2>
          <p style={{ color: t.fade, fontSize: '17px', marginBottom: '40px' }}>
            Reply "Hi" on WhatsApp. See it for yourself — live, right now.
          </p>
          <a
            href="https://wa.me/27653318266?text=Hi"
            target="_blank"
            rel="noreferrer"
            className="btn"
          >
            Message WABOS
          </a>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="section">
        <div className="wrap">
          <FAQ />
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ padding: '48px 0', textAlign: 'center', color: t.fade, fontSize: '13px' }}>
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '16px' }}>🌿</span>
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: '18px' }}>WABOS</span>
            <span>by Easy Branding AI</span>
          </div>
          <p style={{ marginBottom: '8px', color: t.ink, opacity: 0.6, fontStyle: 'italic' }}>
            Building the Operating System for Chat-Based Businesses.
          </p>
          <p style={{ marginBottom: '8px', color: t.ink, opacity: 0.5 }}>
            Designed in South Africa. Built for businesses everywhere.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '16px' }}>
            <Link to="/terms" style={{ color: t.fade, fontSize: '13px', textDecoration: 'none' }}>Terms</Link>
            <Link to="/privacy" style={{ color: t.fade, fontSize: '13px', textDecoration: 'none' }}>Privacy</Link>
            <Link to="/contact" style={{ color: t.fade, fontSize: '13px', textDecoration: 'none' }}>Contact</Link>
            <Link to="/login" style={{ color: t.fade, fontSize: '13px', textDecoration: 'none' }}>Sign In</Link>
            <Link to="/register" style={{ color: t.signal, fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>Get Started</Link>
          </div>
          <p style={{ marginTop: '20px', color: t.fade, opacity: 0.6 }}>
            Easy Branding AI (Pty) Ltd · Reg 2026/453740/07 · easybranding.co.za
          </p>
        </div>
      </footer>
    </div>
  );
}