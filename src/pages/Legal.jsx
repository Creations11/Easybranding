// src/pages/Legal.jsx
// All legal pages as named exports — Terms, Privacy, Refund, Contact
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async'; // ← Only ONE import (removed the duplicate)

const t = {
  bg: '#06080A', surface: '#0D110C', card: '#121710',
  lime: '#B8F040', text: '#EEF0E8', muted: '#8A9080',
  dim: 'rgba(255,255,255,0.06)', border: 'rgba(184,240,64,0.12)',
};

// ⚠️ IMPORTANT: Replace this with your actual image URL
// For GitHub Pages: https://YOUR-USERNAME.github.io/REPO-NAME/og-share.jpg
// For custom domain: https://easybranding.co.za/og-share.jpg
// Using placeholder for now - replace with your actual image URL
const BASE_IMAGE_URL = 'https://placehold.co/1200x630/06080A/B8F040?text=Easy+Branding+AI';

// ── Get current URL for canonical and og:url ──────────────────
const getCurrentUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.href;
  }
  return 'https://easybranding.co.za';
};

const getCurrentPath = () => {
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  return '/';
};

function LegalLayout({ title, subtitle, children, pageDescription }) {
  const fullTitle = `${title} | WABOS by Easy Branding AI`;
  const description = pageDescription || subtitle;
  const currentUrl = getCurrentUrl();
  
  return (
    <div style={{ fontFamily:"'Outfit', sans-serif", background:t.bg, color:t.text, minHeight:'100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Fraunces:wght@700;900&display=swap" rel="stylesheet"/>
      
      {/* ===== OPEN GRAPH / SEO META TAGS ===== */}
      <Helmet>
        {/* Basic Meta */}
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={currentUrl} />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Easy Branding AI" />
        
        {/* ⚠️ CRITICAL: Explicit og:image tag - This fixes the warning! */}
        <meta property="og:image" content={BASE_IMAGE_URL} />
        <meta property="og:image:secure_url" content={BASE_IMAGE_URL} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={BASE_IMAGE_URL} />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": fullTitle,
            "description": description,
            "url": currentUrl,
            "publisher": {
              "@type": "Organization",
              "name": "Easy Branding AI (Pty) Ltd",
              "url": "https://easybranding.co.za",
              "logo": "https://easybranding.co.za/og-share.jpg"
            }
          })}
        </script>
      </Helmet>
      
      {/* ── Navigation ──────────────────────────────────────── */}
      <nav style={{ 
        background:'rgba(6,8,10,0.92)', 
        backdropFilter:'blur(20px)', 
        borderBottom:`1px solid ${t.border}`, 
        padding:'0 24px', 
        height:'64px', 
        display:'flex', 
        alignItems:'center', 
        justifyContent:'space-between', 
        position:'sticky', 
        top:0, 
        zIndex:100 
      }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:'8px', textDecoration:'none' }}>
          <span style={{ fontSize:'20px' }}>🌿</span>
          <span style={{ fontSize:'15px', fontWeight:'700', color:t.text }}>
            Easy Branding <span style={{ color:t.lime }}>AI</span>
          </span>
        </Link>
        <Link to="/" style={{ color:t.muted, textDecoration:'none', fontSize:'14px' }}>
          ← Back to home
        </Link>
      </nav>
      
      {/* ── Content ──────────────────────────────────────────── */}
      <div style={{ maxWidth:'800px', margin:'0 auto', padding:'60px 24px' }}>
        <p style={{ 
          color:t.lime, 
          fontSize:'12px', 
          fontWeight:'700', 
          letterSpacing:'0.1em', 
          textTransform:'uppercase', 
          marginBottom:'16px' 
        }}>
          Legal
        </p>
        <h1 style={{ 
          fontFamily:"'Fraunces', serif", 
          fontSize:'clamp(32px, 5vw, 52px)', 
          fontWeight:'900', 
          marginBottom:'8px' 
        }}>
          {title}
        </h1>
        <p style={{ color:t.muted, fontSize:'14px', marginBottom:'48px' }}>
          {subtitle}
        </p>
        {children}
      </div>
      
      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{ borderTop:`1px solid ${t.dim}`, padding:'32px 24px', textAlign:'center' }}>
        <p style={{ color:t.muted, fontSize:'13px', marginBottom:'12px' }}>
          © 2026 Easy Branding AI (Pty) Ltd · Reg No. 2026/453740/07 · Registered in South Africa · POPIA Compliant
        </p>
        <div style={{ display:'flex', gap:'20px', justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/terms" style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>
            Terms of Use
          </Link>
          <Link to="/privacy" style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>
            Privacy Policy
          </Link>
          <Link to="/refund-policy" style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>
            Refund Policy
          </Link>
          <Link to="/contact" style={{ color:t.muted, fontSize:'13px', textDecoration:'none' }}>
            Contact
          </Link>
          <Link to="/" style={{ color:t.lime, fontSize:'13px', textDecoration:'none', fontWeight:'600' }}>
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, body }) {
  return (
    <div style={{ 
      marginBottom:'40px', 
      paddingBottom:'40px', 
      borderBottom:`1px solid ${t.dim}` 
    }}>
      <h2 style={{ 
        fontSize:'18px', 
        fontWeight:'700', 
        color:t.lime, 
        marginBottom:'12px' 
      }}>
        {title}
      </h2>
      <p style={{ 
        color:t.muted, 
        fontSize:'15px', 
        lineHeight:1.8, 
        whiteSpace:'pre-wrap' 
      }}>
        {body}
      </p>
    </div>
  );
}

// ── TERMS OF USE ─────────────────────────────────────────────
export function TermsOfUse() {
  return (
    <LegalLayout 
      title="Terms of Use" 
      subtitle="Last updated: 11 June 2026"
      pageDescription="Terms of Use for Easy Branding AI — the WhatsApp lead qualification automation platform for South African rental agencies."
    >
      <Section 
        title="1. Acceptance of Terms" 
        body={`By accessing or using Easy Branding AI ("the Platform"), operated by Easy Branding AI (Pty) Ltd (Registration No. 2026/453740/07), you agree to be bound by these Terms of Use. If you do not agree, you may not use the Platform.

These terms constitute a binding legal agreement between you ("Client" or "User") and Easy Branding AI (Pty) Ltd ("we", "us", "our"), a company registered in South Africa.`}
      />
      
      <Section 
        title="2. Description of Service" 
        body={`Easy Branding AI provides a WhatsApp business automation platform that enables businesses to automate customer enquiries, qualify leads, manage sales pipelines, and collect payments via WhatsApp. The Platform includes:

• WhatsApp chatbot automation and AI-powered lead scoring
• A live management dashboard
• Outbound prospecting tools
• Document management via WhatsApp
• Payment collection via Paystack
• Team management tools`}
      />
      
      <Section 
        title="3. Account Registration" 
        body={`To use the Platform you must register for an account and provide accurate, complete information. You are responsible for:

• Maintaining the confidentiality of your login credentials
• All activity that occurs under your account
• Ensuring your team members comply with these terms

We reserve the right to suspend or terminate accounts that provide false information or violate these terms.`}
      />
      
      <Section 
        title="4. Subscription Plans and Billing" 
        body={`The Platform is offered on a monthly subscription basis:

• Starter: R950/month
• Growth: R2,450/month
• Enterprise: Custom pricing

All plans include a 30-day free trial. After the trial, your selected plan will be billed monthly via Paystack. We reserve the right to change pricing with 30 days written notice.`}
      />
      
      <Section 
        title="5. Refund and Cancellation" 
        body={`You may cancel your subscription at any time by providing 30 days written notice to ayanda@easybranding.co.za. No refunds are issued for partial months already paid. Full details are in our Refund Policy.`}
      />
      
      <Section 
        title="6. WhatsApp and Third-Party Services" 
        body={`The Platform integrates with WhatsApp Business API (via Twilio), subject to Meta's terms of service. You agree to only message customers who have opted in to receive communications and to comply with WhatsApp's messaging policies. We are not liable for disruptions caused by WhatsApp, Twilio, Paystack, or other third-party services.`}
      />
      
      <Section 
        title="7. Data and Privacy" 
        body={`We comply with the Protection of Personal Information Act (POPIA). Your customer data is stored securely, never sold or shared with third parties, and is isolated per client. Full details are in our Privacy Policy.`}
      />
      
      <Section 
        title="8. Acceptable Use" 
        body={`You may not use the Platform to send spam, harass customers, collect data without consent, violate South African law, or resell the Platform without written permission. Violations may result in immediate account suspension.`}
      />
      
      <Section 
        title="9. Intellectual Property" 
        body={`All intellectual property in the Platform belongs to Easy Branding AI (Pty) Ltd. You are granted a limited licence to use the Platform during your subscription. Your customer data remains your property at all times.`}
      />
      
      <Section 
        title="10. Limitation of Liability" 
        body={`To the maximum extent permitted by South African law, Easy Branding AI (Pty) Ltd shall not be liable for indirect or consequential damages. Our total liability shall not exceed the amount you paid us in the 3 months preceding the claim.`}
      />
      
      <Section 
        title="11. Governing Law" 
        body={`These terms are governed by the laws of the Republic of South Africa. Disputes will first be addressed through direct communication, failing which through South African courts.`}
      />
      
      <Section 
        title="12. Contact Us" 
        body={`Easy Branding AI (Pty) Ltd
Email: ayanda@easybranding.co.za
WhatsApp: +27 84 654 9578
Website: easybranding.co.za
South Africa`}
      />
    </LegalLayout>
  );
}

// ── PRIVACY POLICY ────────────────────────────────────────────
export function PrivacyPolicy() {
  return (
    <LegalLayout 
      title="Privacy Policy" 
      subtitle="Last updated: 3 July 2026"
      pageDescription="How Easy Branding AI (Pty) Ltd collects, uses, stores, and protects personal information in compliance with POPIA."
    >
      <Section 
        title="1. Introduction" 
        body={`Easy Branding AI (Pty) Ltd is committed to protecting your personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA).

This Privacy Policy explains how we collect, use, store, and protect personal information when you use our Platform.`}
      />
      
      <Section 
        title="2. Information We Collect" 
        body={`We collect:

• Business information: business name, registration details, industry type
• Contact details: name, email address, phone number, WhatsApp number
• Account credentials: username and encrypted password
• Customer data: lead information collected via WhatsApp on behalf of our clients
• Usage data: platform activity, login times, features used
• Payment information: processed securely via Paystack — we do not store card details`}
      />
      
      <Section 
        title="3. How We Use Your Information" 
        body={`We use collected information to:

• Provide and operate the Platform
• Process subscription payments
• Send account notifications and service updates
• Provide customer support
• Improve the Platform
• Comply with legal obligations

We do not sell, rent, or share your personal information with third parties for marketing purposes.`}
      />
      
      <Section 
        title="4. Customer Data (Your Clients' Data)" 
        body={`When you use our Platform, your customers' data is collected on your behalf. You are the Responsible Party under POPIA. We act as the Operator processing data on your behalf. Each client's data is fully isolated — no cross-client data sharing occurs.

You are responsible for obtaining consent from your customers to process their data via WhatsApp automation.

How an end customer can request deletion: If you are a customer who messaged a business using our Platform and want your data deleted, you may either (a) message that business directly on WhatsApp and request deletion, or (b) contact Easy Branding AI directly at ayanda@easybranding.co.za with the phone number you messaged from and the name of the business you contacted. We will verify the request and delete your data within 30 days, in compliance with POPIA.`}
      />
      
      <Section 
        title="5. Data Storage and Security" 
        body={`Your data is stored on MongoDB Atlas, Render, and Cloudinary — all encrypted. We implement SSL/TLS encryption, role-based access control, and conduct regular security reviews.

We will notify you within 72 hours of becoming aware of any data breach affecting your information.`}
      />
      
      <Section 
        title="6. Data Retention" 
        body={`• Active accounts: retained for the duration of your subscription
• Cancelled accounts: deleted 30 days after cancellation
• Payment records: 5 years as required by South African tax law

As a client, you may request deletion of your account data at any time by contacting ayanda@easybranding.co.za. For end-customer (lead) data deletion requests, see Section 4 above.`}
      />
      
      <Section 
        title="7. Third-Party Services" 
        body={`We use: Twilio (WhatsApp), Anthropic (AI), Google Gemini (content), Paystack (payments), SendGrid (email), Cloudinary (documents). We only share the minimum data necessary for each service to function.`}
      />
      
      <Section 
        title="8. Your Rights Under POPIA" 
        body={`You have the right to access, correct, delete, and object to the processing of your personal information. Contact us at ayanda@easybranding.co.za. We will respond within 30 days.

You may also lodge a complaint with the Information Regulator of South Africa at inforegulator.org.za.`}
      />
      
      <Section 
        title="9. Contact Us" 
        body={`Easy Branding AI (Pty) Ltd
Information Officer: Ayanda Sogula
Email: ayanda@easybranding.co.za
WhatsApp: +27 84 654 9578
Website: easybranding.co.za`}
      />
    </LegalLayout>
  );
}

// ── REFUND POLICY ─────────────────────────────────────────────
export function RefundPolicy() {
  return (
    <LegalLayout 
      title="Refund & Cancellation Policy" 
      subtitle="Last updated: 11 June 2026"
      pageDescription="Refund and cancellation policy for Easy Branding AI subscriptions — 30-day free trial, monthly billing, cancellation terms."
    >
      <Section 
        title="1. Free Trial" 
        body={`All Easy Branding AI plans include a 30-day free trial.

• No credit card required to start
• No charge during the trial period
• Cancel at any time during the trial with no obligation
• First payment processed on day 31 if you choose to continue`}
      />
      
      <Section 
        title="2. Subscription Billing" 
        body={`After the free trial, subscriptions are billed monthly in advance:

• Starter: R950/month
• Growth: R2,450/month
• Enterprise: Custom pricing agreed in writing

Payments are processed via Paystack. You will receive an invoice by email after each payment.`}
      />
      
      <Section 
        title="3. Cancellation Policy" 
        body={`You may cancel at any time by sending a written request to ayanda@easybranding.co.za with your business name and registered email address.

Cancellation takes effect at the end of your current billing period. We require 30 days written notice. You retain full access until the end of the paid period.`}
      />
      
      <Section 
        title="4. Refund Policy" 
        body={`No refunds are issued for:

• Partial months already paid
• Unused features
• Change of mind after payment
• Failure to use the Platform after setup

Refunds will be considered for:

• Duplicate payments charged in error
• Technical Platform failure unresolved within 72 hours
• Incorrect billing amounts

Contact ayanda@easybranding.co.za within 7 days of a disputed charge. Approved refunds processed within 5-10 business days.`}
      />
      
      <Section 
        title="5. Platform Failure" 
        body={`If the Platform experiences downtime exceeding 72 consecutive hours due to our infrastructure, you may request a pro-rata credit. Downtime caused by third-party services (WhatsApp, Twilio, Paystack) is not eligible for credit.`}
      />
      
      <Section 
        title="6. Data After Cancellation" 
        body={`After cancellation, your data is retained for 30 days. You may request a data export within those 30 days. After 30 days, all data is permanently deleted.`}
      />
      
      <Section 
        title="7. Contact Us" 
        body={`Easy Branding AI (Pty) Ltd
Email: ayanda@easybranding.co.za
WhatsApp: +27 84 654 9578
Website: easybranding.co.za

We aim to respond to all queries within 1 business day.`}
      />
    </LegalLayout>
  );
}

// ── CONTACT PAGE ──────────────────────────────────────────────
export function ContactPage() {
  return (
    <LegalLayout 
      title="Contact Us" 
      subtitle="We respond within 1 business day"
      pageDescription="Contact Easy Branding AI — WhatsApp lead qualification automation for South African rental agencies. Email, WhatsApp, and business information."
    >
      <div style={{ 
        display:'grid', 
        gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', 
        gap:'16px', 
        marginBottom:'48px' 
      }}>
        {[
          { icon:'📧', label:'Email', value:'ayanda@easybranding.co.za', href:'mailto:ayanda@easybranding.co.za' },
          { icon:'💬', label:'WhatsApp (Personal)', value:'+27 84 654 9578', href:'https://wa.me/27846549578' },
          { icon:'🤖', label:'Business WhatsApp', value:'+27 65 331 8266', href:'https://wa.me/27653318266?text=Hi' },
          { icon:'🌐', label:'Website', value:'easybranding.co.za', href:'https://easybranding.co.za' },
        ].map((item, i) => (
          <a 
            key={i} 
            href={item.href} 
            target="_blank" 
            rel="noreferrer" 
            style={{ 
              textDecoration:'none', 
              background:t.card, 
              border:`1px solid ${t.dim}`, 
              borderRadius:'14px', 
              padding:'24px', 
              display:'flex', 
              gap:'16px', 
              alignItems:'center', 
              transition:'border-color 0.2s' 
            }}
          >
            <span style={{ fontSize:'32px', flexShrink:0 }}>{item.icon}</span>
            <div>
              <p style={{ color:t.muted, fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'4px' }}>
                {item.label}
              </p>
              <p style={{ color:t.lime, fontSize:'15px', fontWeight:'600' }}>
                {item.value}
              </p>
            </div>
          </a>
        ))}
      </div>

      <div style={{ 
        background:t.card, 
        border:`1px solid ${t.dim}`, 
        borderRadius:'16px', 
        padding:'32px' 
      }}>
        <h2 style={{ 
          fontFamily:"'Fraunces', serif", 
          fontSize:'24px', 
          fontWeight:'900', 
          marginBottom:'16px' 
        }}>
          Easy Branding AI (Pty) Ltd
        </h2>
        <p style={{ color:t.muted, fontSize:'15px', lineHeight:1.8 }}>
          Registered in South Africa<br/>
          POPIA Compliant<br/>
          WhatsApp Business API — Meta Approved<br/>
          Powered by Anthropic Claude AI
        </p>
      </div>

      <div style={{ 
        marginTop:'32px', 
        background:'rgba(184,240,64,0.06)', 
        border:'1px solid rgba(184,240,64,0.2)', 
        borderRadius:'14px', 
        padding:'24px' 
      }}>
        <p style={{ color:t.lime, fontWeight:'700', fontSize:'15px', marginBottom:'8px' }}>
          Response times
        </p>
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