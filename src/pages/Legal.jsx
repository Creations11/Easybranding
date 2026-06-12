// src/pages/Legal.jsx
// All legal pages as named exports — Terms, Privacy, Refund, Contact
import { Link } from 'react-router-dom';

const t = {
  bg: '#06080A', surface: '#0D110C', card: '#121710',
  lime: '#B8F040', text: '#EEF0E8', muted: '#8A9080',
  dim: 'rgba(255,255,255,0.06)', border: 'rgba(184,240,64,0.12)',
};

function LegalLayout({ title, subtitle, children }) {
  return (
    <div style={{ fontFamily:"'Outfit', sans-serif", background:t.bg, color:t.text, minHeight:'100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Fraunces:wght@700;900&display=swap" rel="stylesheet"/>
      <nav style={{ background:'rgba(6,8,10,0.92)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${t.border}`, padding:'0 24px', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:'8px', textDecoration:'none' }}>
          <span style={{ fontSize:'20px' }}>🌿</span>
          <span style={{ fontSize:'15px', fontWeight:'700', color:t.text }}>Easy Branding <span style={{ color:t.lime }}>AI</span></span>
        </Link>
        <Link to="/" style={{ color:t.muted, textDecoration:'none', fontSize:'14px' }}>← Back to home</Link>
      </nav>
      <div style={{ maxWidth:'800px', margin:'0 auto', padding:'60px 24px' }}>
        <p style={{ color:t.lime, fontSize:'12px', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'16px' }}>Legal</p>
        <h1 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(32px, 5vw, 52px)', fontWeight:'900', marginBottom:'8px' }}>{title}</h1>
        <p style={{ color:t.muted, fontSize:'14px', marginBottom:'48px' }}>{subtitle}</p>
        {children}
      </div>
      <footer style={{ borderTop:`1px solid ${t.dim}`, padding:'32px 24px', textAlign:'center' }}>
        <p style={{ color:t.muted, fontSize:'13px', marginBottom:'12px' }}>© 2026 Easy Branding AI (Pty) Ltd · Registered in South Africa · POPIA Compliant</p>
        <div style={{ display:'flex', gap:'20px', justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/terms"    style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>Terms of Use</Link>
          <Link to="/privacy"  style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>Privacy Policy</Link>
          <Link to="/refund-policy" style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>Refund Policy</Link>
          <Link to="/contact"  style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>Contact</Link>
          <Link to="/"         style={{ color:t.lime,  fontSize:'13px', textDecoration:'none', fontWeight:'600' }}>Home</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, body }) {
  return (
    <div style={{ marginBottom:'40px', paddingBottom:'40px', borderBottom:`1px solid ${t.dim}` }}>
      <h2 style={{ fontSize:'18px', fontWeight:'700', color:t.lime, marginBottom:'12px' }}>{title}</h2>
      <p style={{ color:t.muted, fontSize:'15px', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{body}</p>
    </div>
  );
}

// ── TERMS OF USE ─────────────────────────────────────────────
export function TermsOfUse() {
  return (
    <LegalLayout title="Terms of Use" subtitle="Last updated: 11 June 2026">
      <Section title="1. Acceptance of Terms" body={`By accessing or using Easy Branding AI ("the Platform"), operated by Easy Branding AI (Pty) Ltd, you agree to be bound by these Terms of Use. If you do not agree, you may not use the Platform.\n\nThese terms constitute a binding legal agreement between you ("Client" or "User") and Easy Branding AI (Pty) Ltd ("we", "us", "our"), a company registered in South Africa.`}/>
      <Section title="2. Description of Service" body={`Easy Branding AI provides a WhatsApp business automation platform that enables businesses to automate customer enquiries, qualify leads, manage sales pipelines, and collect payments via WhatsApp. The Platform includes:\n\n• WhatsApp chatbot automation and AI-powered lead scoring\n• A live management dashboard\n• Outbound prospecting tools\n• Document management via WhatsApp\n• Payment collection via Paystack\n• Team management tools`}/>
      <Section title="3. Account Registration" body={`To use the Platform you must register for an account and provide accurate, complete information. You are responsible for:\n\n• Maintaining the confidentiality of your login credentials\n• All activity that occurs under your account\n• Ensuring your team members comply with these terms\n\nWe reserve the right to suspend or terminate accounts that provide false information or violate these terms.`}/>
      <Section title="4. Subscription Plans and Billing" body={`The Platform is offered on a monthly subscription basis:\n\n• Starter: R950/month\n• Growth: R2,450/month\n• Enterprise: Custom pricing\n\nAll plans include a 30-day free trial. After the trial, your selected plan will be billed monthly via Paystack. We reserve the right to change pricing with 30 days written notice.`}/>
      <Section title="5. Refund and Cancellation" body={`You may cancel your subscription at any time by providing 30 days written notice to ayanda@easybranding.co.za. No refunds are issued for partial months already paid. Full details are in our Refund Policy.`}/>
      <Section title="6. WhatsApp and Third-Party Services" body={`The Platform integrates with WhatsApp Business API (via Twilio), subject to Meta's terms of service. You agree to only message customers who have opted in to receive communications and to comply with WhatsApp's messaging policies. We are not liable for disruptions caused by WhatsApp, Twilio, Paystack, or other third-party services.`}/>
      <Section title="7. Data and Privacy" body={`We comply with the Protection of Personal Information Act (POPIA). Your customer data is stored securely, never sold or shared with third parties, and is isolated per client. Full details are in our Privacy Policy.`}/>
      <Section title="8. Acceptable Use" body={`You may not use the Platform to send spam, harass customers, collect data without consent, violate South African law, or resell the Platform without written permission. Violations may result in immediate account suspension.`}/>
      <Section title="9. Intellectual Property" body={`All intellectual property in the Platform belongs to Easy Branding AI (Pty) Ltd. You are granted a limited licence to use the Platform during your subscription. Your customer data remains your property at all times.`}/>
      <Section title="10. Limitation of Liability" body={`To the maximum extent permitted by South African law, Easy Branding AI (Pty) Ltd shall not be liable for indirect or consequential damages. Our total liability shall not exceed the amount you paid us in the 3 months preceding the claim.`}/>
      <Section title="11. Governing Law" body={`These terms are governed by the laws of the Republic of South Africa. Disputes will first be addressed through direct communication, failing which through South African courts.`}/>
      <Section title="12. Contact Us" body={`Easy Branding AI (Pty) Ltd\nEmail: ayanda@easybranding.co.za\nWhatsApp: +27 84 654 9578\nWebsite: easybranding.co.za\nSouth Africa`}/>
    </LegalLayout>
  );
}

// ── PRIVACY POLICY ────────────────────────────────────────────
export function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" subtitle="Last updated: 11 June 2026">
      <Section title="1. Introduction" body={`Easy Branding AI (Pty) Ltd is committed to protecting your personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA).\n\nThis Privacy Policy explains how we collect, use, store, and protect personal information when you use our Platform.`}/>
      <Section title="2. Information We Collect" body={`We collect:\n\n• Business information: business name, registration details, industry type\n• Contact details: name, email address, phone number, WhatsApp number\n• Account credentials: username and encrypted password\n• Customer data: lead information collected via WhatsApp on behalf of our clients\n• Usage data: platform activity, login times, features used\n• Payment information: processed securely via Paystack — we do not store card details`}/>
      <Section title="3. How We Use Your Information" body={`We use collected information to:\n\n• Provide and operate the Platform\n• Process subscription payments\n• Send account notifications and service updates\n• Provide customer support\n• Improve the Platform\n• Comply with legal obligations\n\nWe do not sell, rent, or share your personal information with third parties for marketing purposes.`}/>
      <Section title="4. Customer Data (Your Clients' Data)" body={`When you use our Platform, your customers' data is collected on your behalf. You are the Responsible Party under POPIA. We act as the Operator processing data on your behalf. Each client's data is fully isolated — no cross-client data sharing occurs.\n\nYou are responsible for obtaining consent from your customers to process their data via WhatsApp automation.`}/>
      <Section title="5. Data Storage and Security" body={`Your data is stored on MongoDB Atlas, Render, and Cloudinary — all encrypted. We implement SSL/TLS encryption, role-based access control, and conduct regular security reviews.\n\nWe will notify you within 72 hours of becoming aware of any data breach affecting your information.`}/>
      <Section title="6. Data Retention" body={`• Active accounts: retained for the duration of your subscription\n• Cancelled accounts: deleted 30 days after cancellation\n• Payment records: 5 years as required by South African tax law\n\nYou may request deletion at any time by contacting ayanda@easybranding.co.za.`}/>
      <Section title="7. Third-Party Services" body={`We use: Twilio (WhatsApp), Anthropic (AI), Google Gemini (content), Paystack (payments), SendGrid (email), Cloudinary (documents). We only share the minimum data necessary for each service to function.`}/>
      <Section title="8. Your Rights Under POPIA" body={`You have the right to access, correct, delete, and object to the processing of your personal information. Contact us at ayanda@easybranding.co.za. We will respond within 30 days.\n\nYou may also lodge a complaint with the Information Regulator of South Africa at inforegulator.org.za.`}/>
      <Section title="9. Contact Us" body={`Easy Branding AI (Pty) Ltd\nInformation Officer: Ayanda Sogula\nEmail: ayanda@easybranding.co.za\nWhatsApp: +27 84 654 9578\nWebsite: easybranding.co.za`}/>
    </LegalLayout>
  );
}

// ── REFUND POLICY ─────────────────────────────────────────────
export function RefundPolicy() {
  return (
    <LegalLayout title="Refund & Cancellation Policy" subtitle="Last updated: 11 June 2026">
      <Section title="1. Free Trial" body={`All Easy Branding AI plans include a 30-day free trial.\n\n• No credit card required to start\n• No charge during the trial period\n• Cancel at any time during the trial with no obligation\n• First payment processed on day 31 if you choose to continue`}/>
      <Section title="2. Subscription Billing" body={`After the free trial, subscriptions are billed monthly in advance:\n\n• Starter: R950/month\n• Growth: R2,450/month\n• Enterprise: Custom pricing agreed in writing\n\nPayments are processed via Paystack. You will receive an invoice by email after each payment.`}/>
      <Section title="3. Cancellation Policy" body={`You may cancel at any time by sending a written request to ayanda@easybranding.co.za with your business name and registered email address.\n\nCancellation takes effect at the end of your current billing period. We require 30 days written notice. You retain full access until the end of the paid period.`}/>
      <Section title="4. Refund Policy" body={`No refunds are issued for:\n\n• Partial months already paid\n• Unused features\n• Change of mind after payment\n• Failure to use the Platform after setup\n\nRefunds will be considered for:\n\n• Duplicate payments charged in error\n• Technical Platform failure unresolved within 72 hours\n• Incorrect billing amounts\n\nContact ayanda@easybranding.co.za within 7 days of a disputed charge. Approved refunds processed within 5-10 business days.`}/>
      <Section title="5. Platform Failure" body={`If the Platform experiences downtime exceeding 72 consecutive hours due to our infrastructure, you may request a pro-rata credit. Downtime caused by third-party services (WhatsApp, Twilio, Paystack) is not eligible for credit.`}/>
      <Section title="6. Data After Cancellation" body={`After cancellation, your data is retained for 30 days. You may request a data export within those 30 days. After 30 days, all data is permanently deleted.`}/>
      <Section title="7. Contact Us" body={`Easy Branding AI (Pty) Ltd\nEmail: ayanda@easybranding.co.za\nWhatsApp: +27 84 654 9578\nWebsite: easybranding.co.za\n\nWe aim to respond to all queries within 1 business day.`}/>

      {/* Summary box */}
      <div style={{ background:'rgba(184,240,64,0.06)', border:'1px solid rgba(184,240,64,0.2)', borderRadius:'16px', padding:'28px' }}>
        <h3 style={{ fontFamily:"'Fraunces', serif", fontSize:'20px', fontWeight:'900', marginBottom:'16px', color:t.lime }}>Summary</h3>
        {[
          ['Free trial', '30 days — no charge, cancel anytime'],
          ['Monthly billing', 'Billed in advance on same date each month'],
          ['Cancellation', '30 days written notice to ayanda@easybranding.co.za'],
          ['Refunds', 'No refunds for partial months'],
          ['Data after cancellation', 'Retained 30 days then permanently deleted'],
          ['Support', 'ayanda@easybranding.co.za · +27 84 654 9578'],
        ].map(([k, v], i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'8px', padding:'10px 0', borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <span style={{ color:t.muted, fontSize:'14px' }}>{k}</span>
            <span style={{ color:t.text, fontSize:'14px', fontWeight:'600' }}>{v}</span>
          </div>
        ))}
      </div>
    </LegalLayout>
  );
}

// ── CONTACT PAGE ──────────────────────────────────────────────
export function ContactPage() {
  return (
    <LegalLayout title="Contact Us" subtitle="We respond within 1 business day">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'16px', marginBottom:'48px' }}>
        {[
          { icon:'📧', label:'Email', value:'ayanda@easybranding.co.za', href:'mailto:ayanda@easybranding.co.za' },
          { icon:'💬', label:'WhatsApp (Personal)', value:'+27 84 654 9578', href:'https://wa.me/27846549578' },
          { icon:'🤖', label:'Business WhatsApp', value:'+27 65 331 8266', href:'https://wa.me/27653318266?text=Hi' },
          { icon:'🌐', label:'Website', value:'easybranding.co.za', href:'https://easybranding.co.za' },
        ].map((item, i) => (
          <a key={i} href={item.href} target="_blank" rel="noreferrer" style={{ textDecoration:'none', background:t.card, border:`1px solid ${t.dim}`, borderRadius:'14px', padding:'24px', display:'flex', gap:'16px', alignItems:'center', transition:'border-color 0.2s' }}>
            <span style={{ fontSize:'32px', flexShrink:0 }}>{item.icon}</span>
            <div>
              <p style={{ color:t.muted, fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'4px' }}>{item.label}</p>
              <p style={{ color:t.lime, fontSize:'15px', fontWeight:'600' }}>{item.value}</p>
            </div>
          </a>
        ))}
      </div>

      <div style={{ background:t.card, border:`1px solid ${t.dim}`, borderRadius:'16px', padding:'32px' }}>
        <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:'24px', fontWeight:'900', marginBottom:'16px' }}>Easy Branding AI (Pty) Ltd</h2>
        <p style={{ color:t.muted, fontSize:'15px', lineHeight:1.8 }}>
          Registered in South Africa<br/>
          POPIA Compliant<br/>
          WhatsApp Business API — Meta Approved<br/>
          Powered by Anthropic Claude AI
        </p>
      </div>

      <div style={{ marginTop:'32px', background:'rgba(184,240,64,0.06)', border:'1px solid rgba(184,240,64,0.2)', borderRadius:'14px', padding:'24px' }}>
        <p style={{ color:t.lime, fontWeight:'700', fontSize:'15px', marginBottom:'8px' }}>Response times</p>
        <p style={{ color:t.muted, fontSize:'14px', lineHeight:1.8 }}>
          General enquiries: within 1 business day<br/>
          Technical support: within 2 hours (business hours)<br/>
          Billing queries: within 1 business day<br/>
          Platform outages: within 2 hours any time
        </p>
      </div>
    </LegalLayout>
  );
}