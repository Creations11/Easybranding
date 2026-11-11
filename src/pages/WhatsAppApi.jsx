// src/pages/WhatsAppApi.jsx
//
// The WhatsApp API with Coexistence: the page a search for "WhatsApp API on my
// existing number" should land on, and where the Coexistence ads point
// (Ayanda, 2026-11-09 to 11-11). The home page sells WABOS and never names it.
//
// What it may claim is what Meta itself says to the business when it connects
// ("You can keep using your WhatsApp Business app along with the Business
// Platform", "share up to 6 months of chat history") and what the API repo's
// docs/META-PLATFORM-REFERENCE.md verified. Not "nothing changes": some app
// features do, and the page says so.
//
// No price here. A price lives only in the API's config/products.js, and
// GET /api/products does not serve this package (it is off the ladder), so
// the page sends people to WhatsApp for it.
import { useState } from 'react';
import { Link } from 'react-router-dom';

const c = {
  bg: '#06080A', surface: '#0D110C', card: '#121710',
  lime: '#B8F040', text: '#EEF0E8', muted: '#8A9080',
  border: 'rgba(184,240,64,0.12)', borderDim: 'rgba(255,255,255,0.06)',
};

const WHATSAPP = 'https://wa.me/27653318266?text=' + encodeURIComponent('Hi, I want the WhatsApp API on my number');

const KEEP = [
  ['Your number', 'The one your customers already have saved. Nothing to announce, nothing to reprint.'],
  ['Your WhatsApp Business app', 'It stays on your phone. You keep replying by hand whenever you want to.'],
  ['Your recent chats', 'Up to 6 months of chat history can come across when you connect.'],
];

const ADD = [
  ['Answers at any hour', 'Automatic replies to the questions you get every day: prices, hours, where you are, how to book.'],
  ['Follow-ups and reminders', 'A message to the customer who asked yesterday and went quiet, sent for you.'],
  ['Alerts to you', 'When someone needs a person, you are told on your own WhatsApp.'],
  ['Rules, not guesswork', 'The replies are ones you approve. There is no AI making things up to your customers.'],
];

const STEPS = [
  ['Tell us about your business', 'WhatsApp us. A few questions about what you do and what customers ask you most.'],
  ['Connect your number', 'You sign in with your own Facebook account and confirm on your phone. It takes about ten minutes, and we stay on the line with you.'],
  ['Your replies go live', 'We set up the automatic replies you approved. You carry on in the app as before.'],
];

const FAQS = [
  ['Do I need a new number?',
    'No. The API is added to the number you already use in the WhatsApp Business app. This is what Meta calls Coexistence.'],
  ['Will I lose my chats or my app?',
    'No. You keep using the WhatsApp Business app, and up to 6 months of your chat history can be shared with the platform when you connect. Group chat history is not shared.'],
  ['Does anything change in the app?',
    'Yes, a few things. For example, disappearing and view-once messages are turned off in one-to-one chats, and groups and broadcast lists are not handled by the API. We go through the full list with you before you connect, so there are no surprises.'],
  ['Is this an AI chatbot?',
    'No. It is a rule-based setup: menus, answers to common questions and a handover to you. Every reply is one you have approved.'],
  ['What does WhatsApp charge?',
    'Messages you send yourself from the app stay free. Messages the API sends are billed by Meta at its own rates. We explain what that means for your volume before you start.'],
  ['Can I stop?',
    'Yes. You disconnect in the WhatsApp Business app, under Settings, Account, Business Platform, and your number carries on in the app alone.'],
  ['Who connects it?',
    'You do, with your own Facebook account, so the WhatsApp account stays yours. Easy Branding AI is a verified Meta Tech Provider, and we guide you through each screen.'],
];

const H2 = ({ children }) => (
  <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 700, margin: '56px 0 20px' }}>{children}</h2>
);

const Cta = ({ children }) => (
  <a href={WHATSAPP} target="_blank" rel="noreferrer" style={{
    display: 'inline-block', padding: '14px 32px', background: c.lime, color: '#050505',
    borderRadius: '10px', fontWeight: 700, fontSize: '16px', textDecoration: 'none',
  }}>{children}</a>
);

export default function WhatsAppApi() {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, fontFamily: "'Outfit', sans-serif", padding: '100px 24px 60px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <Link to="/" style={{ color: c.lime, textDecoration: 'none', fontSize: '14px' }}>← Easy Branding AI</Link>

        <p style={{ color: c.lime, fontSize: '13px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '28px' }}>
          WhatsApp API with Coexistence
        </p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(34px, 6vw, 58px)', fontWeight: 900, lineHeight: 1.05, margin: '12px 0 18px' }}>
          Keep your number. Keep your app. Add the WhatsApp API.
        </h1>
        <p style={{ color: c.muted, fontSize: '19px', lineHeight: 1.6, maxWidth: '680px', marginBottom: '28px' }}>
          Moving to the WhatsApp API used to mean taking your number out of the WhatsApp Business app. Now the API runs on the
          same number, beside the app. Customers get an answer at any hour, and you still reply from your phone.
        </p>
        <Cta>WhatsApp us to get started</Cta>
        <p style={{ color: c.muted, fontSize: '14px', marginTop: '12px' }}>065 331 8266. Verified Meta Tech Provider, based in South Africa.</p>

        <H2>What you keep</H2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
          {KEEP.map(([t, d]) => (
            <div key={t} style={{ background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '14px', padding: '22px' }}>
              <p style={{ fontWeight: 700, fontSize: '17px', marginBottom: '6px' }}>{t}</p>
              <p style={{ color: c.muted, fontSize: '15px', lineHeight: 1.6 }}>{d}</p>
            </div>
          ))}
        </div>

        <H2>What the API adds</H2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
          {ADD.map(([t, d]) => (
            <div key={t} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '22px' }}>
              <p style={{ fontWeight: 700, fontSize: '17px', marginBottom: '6px', color: c.lime }}>{t}</p>
              <p style={{ color: c.muted, fontSize: '15px', lineHeight: 1.6 }}>{d}</p>
            </div>
          ))}
        </div>

        <H2>How it works</H2>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '14px' }}>
          {STEPS.map(([t, d], i) => (
            <li key={t} style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', background: c.card, border: `1px solid ${c.borderDim}`, borderRadius: '14px', padding: '20px 22px' }}>
              <span style={{ flex: '0 0 40px', height: '40px', borderRadius: '50%', background: c.lime, color: '#050505', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
              <span>
                <span style={{ display: 'block', fontWeight: 700, fontSize: '17px', marginBottom: '4px' }}>{t}</span>
                <span style={{ color: c.muted, fontSize: '15px', lineHeight: 1.6 }}>{d}</span>
              </span>
            </li>
          ))}
        </ol>

        <H2>Questions people ask</H2>
        {FAQS.map(([q, a], i) => (
          <div key={q} style={{ borderBottom: `1px solid ${c.borderDim}`, padding: '8px 0' }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px',
                padding: '14px 0', background: 'none', border: 'none', color: c.text, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '16px', fontWeight: 600, textAlign: 'left',
              }}
            >
              {q}
              <span style={{ color: c.lime, fontSize: '22px', flexShrink: 0, transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
            </button>
            {/* In the page either way, so a search engine reads the answers; only shown when opened. */}
            <p hidden={open !== i} style={{ color: c.muted, fontSize: '15px', lineHeight: 1.7, paddingBottom: '14px' }}>{a}</p>
          </div>
        ))}

        <div style={{ marginTop: '56px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '36px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 700, marginBottom: '10px' }}>Want it on your number?</h2>
          <p style={{ color: c.muted, fontSize: '16px', marginBottom: '22px' }}>Send us a WhatsApp. We will ask what your business does and take it from there.</p>
          <Cta>WhatsApp 065 331 8266</Cta>
        </div>
      </div>
    </div>
  );
}
