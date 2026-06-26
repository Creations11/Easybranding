// src/pages/Help.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

const c = {
  bg: '#06080A', surface: '#0D110C', card: '#121710',
  lime: '#B8F040', earth: '#C4873A', moss: '#4A6741',
  cyan: '#22d3ee', emerald: '#34d399', amber: '#fbbf24',
  text: '#EEF0E8', muted: '#8A9080',
  border: 'rgba(184,240,64,0.12)', borderDim: 'rgba(255,255,255,0.06)',
};

export default function Help() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: 'How do I get started with WABOS?',
      a: 'Click "Get Started" or message us on WhatsApp. We\'ll set your business up and have you live in 15 minutes.',
    },
    {
      q: 'What is PAC Mode?',
      a: 'PAC Mode toggles between membership registration and standard lead qualification. Use /pac on or /pac off from your WhatsApp.',
    },
    {
      q: 'How do I add team members?',
      a: 'Admins generate invite links from the dashboard. Share the link with team members. Approve their registration.',
    },
    {
      q: 'What happens if I don\'t respond to a lead?',
      a: 'The bot handles qualification. If a lead needs human intervention, you\'ll get an alert. You can take over anytime — directly from your own WhatsApp, no dashboard required.',
    },
    {
      q: 'How do I get support?',
      a: 'Email support@easybranding.co.za or WhatsApp +27 65 331 8266. Founder answers personally.',
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: c.bg,
      color: c.text,
      fontFamily: "'Outfit', sans-serif",
      padding: '100px 24px 60px',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link to="/" style={{ color: c.lime, textDecoration: 'none', fontSize: '14px' }}>← Back to Home</Link>

        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 'clamp(32px, 5vw, 48px)',
          fontWeight: '900',
          marginTop: '20px',
          marginBottom: '8px',
        }}>
          Help Center
        </h1>
        <p style={{ color: c.muted, fontSize: '18px', marginBottom: '40px' }}>
          Answers to common questions about WABOS
        </p>

        {/* Quick Links */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '40px',
        }}>
          {[
            { icon: '🚀', label: 'Getting Started', to: '/documentation' },
            { icon: '📚', label: 'Documentation', to: '/documentation' },
            { icon: '💬', label: 'Commands', to: '/documentation?section=commands' },
            { icon: '📞', label: 'Contact Support', to: '/contact' },
          ].map(item => (
            <Link key={item.label} to={item.to} style={{
              background: c.card,
              border: `1px solid ${c.borderDim}`,
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              textDecoration: 'none',
              color: c.text,
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* FAQ */}
        <h2 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: '24px',
          fontWeight: '700',
          marginBottom: '20px',
        }}>
          Frequently Asked Questions
        </h2>

        {faqs.map((item, i) => (
          <div key={i} style={{
            borderBottom: `1px solid ${c.borderDim}`,
            padding: '16px 0',
          }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                background: 'none',
                border: 'none',
                color: c.text,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '16px',
                fontWeight: '600',
                textAlign: 'left',
                gap: '16px',
              }}
            >
              {item.q}
              <span style={{
                color: c.lime,
                fontSize: '22px',
                flexShrink: 0,
                transition: 'transform 0.2s',
                transform: openFaq === i ? 'rotate(45deg)' : 'none',
              }}>
                +
              </span>
            </button>
            {openFaq === i && (
              <p style={{
                color: c.muted,
                fontSize: '15px',
                lineHeight: '1.7',
                paddingBottom: '12px',
              }}>
                {item.a}
              </p>
            )}
          </div>
        ))}

        {/* Contact */}
        <div style={{
          marginTop: '48px',
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>📱</p>
          <h3 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: '20px',
            fontWeight: '700',
            marginBottom: '8px',
          }}>
            Still need help?
          </h3>
          <p style={{ color: c.muted, fontSize: '15px', marginBottom: '20px' }}>
            Message us on WhatsApp — we answer personally.
          </p>
          <a
            href="https://wa.me/27653318266?text=Hi%20I%20need%20help%20with%20WABOS"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: c.lime,
              color: '#050505',
              borderRadius: '10px',
              fontWeight: '700',
              textDecoration: 'none',
            }}
          >
            💬 WhatsApp Support
          </a>
        </div>
      </div>
    </div>
  );
}