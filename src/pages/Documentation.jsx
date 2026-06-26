// src/pages/Documentation.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

const c = {
  bg: '#06080A', surface: '#0D110C', card: '#121710',
  lime: '#B8F040', earth: '#C4873A', moss: '#4A6741',
  cyan: '#22d3ee', emerald: '#34d399', amber: '#fbbf24',
  text: '#EEF0E8', muted: '#8A9080',
  border: 'rgba(184,240,64,0.12)', borderDim: 'rgba(255,255,255,0.06)',
};

export default function Documentation() {
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', icon: '🚀', label: 'Getting Started' },
    { id: 'commands', icon: '💬', label: 'WhatsApp Commands' },
    { id: 'leads', icon: '📋', label: 'Lead Management' },
    { id: 'takeover', icon: '👤', label: 'Human Takeover' },
    { id: 'appointments', icon: '📅', label: 'Appointments' },
    { id: 'payments', icon: '💳', label: 'Payments & Invoicing' },
    { id: 'team', icon: '👥', label: 'Team Management' },
    { id: 'agents', icon: '🛠️', label: 'Agent Guide' },
    { id: 'admin', icon: '⚙️', label: 'Admin Guide' },
    { id: 'faq', icon: '❓', label: 'FAQ' },
  ];

  const content = {
    'getting-started': {
      title: 'Getting Started with WABOS',
      content: [
        {
          heading: 'What is WABOS?',
          body: 'WABOS (WhatsApp Business Operating System) is a platform that turns your WhatsApp into a complete business management tool. It handles leads, appointments, payments, and invoicing — all through WhatsApp.',
        },
        {
          heading: 'How It Works',
          body: '1. Customers message your business WhatsApp number\n2. The bot qualifies them with AI\n3. You get notified instantly\n4. Your team takes over when needed\n5. Everything is tracked automatically',
        },
        {
          heading: 'Setup Time',
          body: 'Most businesses are live within 15 minutes. We handle the technical setup — you just configure your questions and messages.',
        },
        {
          heading: 'What You Need',
          body: '• A business WhatsApp number\n• A device with WhatsApp\n• 15 minutes of your time\n• Your team\'s WhatsApp numbers (optional)',
        },
      ],
    },
    'commands': {
      title: 'WhatsApp Command Reference',
      content: [
        {
          heading: 'Owner Commands',
          body: 'All commands are sent to your business WhatsApp number.',
        },
        {
          heading: '📋 Lead Management',
          body: 'LEADS — View today\'s leads\nLEADS ALL — View all active leads\nLEAD [N] — View lead details\nCLOSE [N] — Close a lead\nCALL [N] — Get lead\'s phone number\nASSIGN [N] [Agent] — Assign lead to team',
        },
        {
          heading: '👤 Takeover',
          body: 'TAKEOVER [N] — Take over lead by number\nTAKEOVER [Name] — Search and take over by name\nACTIVE — See active takeovers\nENDTAKEOVER [N] — End a takeover\n/END — End current takeover',
        },
        {
          heading: '📅 Appointments',
          body: 'APT — Today\'s appointments\nAPT ALL — Upcoming appointments\nCONFIRM [N] — Confirm appointment\nCANCEL [N] — Cancel appointment\nREMIND [N] — Send reminder',
        },
        {
          heading: '💳 Payments & Invoices',
          body: 'PAY [Name] [Amount] — Send payment link\nINVOICE [Name] [Amount] [Desc] — Create invoice\nINVOICES — Manage invoices',
        },
        {
          heading: '📊 Analytics',
          body: 'STATS — Business performance\nAGENTS — Team activity\n/pac on/off — Toggle PAC mode',
        },
        {
          heading: 'Takeover Sub-Commands',
          body: '/NOTE [text] — Add note to lead\n/QUALIFY — Mark lead as qualified\n/DISMISS — Mark lead as not qualified\n/STATUS — See conversation history\n/END — End takeover',
        },
      ],
    },
    'leads': {
      title: 'Lead Management',
      content: [
        {
          heading: 'How Leads Are Captured',
          body: 'When a customer messages your business WhatsApp, the bot automatically starts the qualification flow. It asks questions based on your industry template and stores all responses.',
        },
        {
          heading: 'Lead Statuses',
          body: '🔄 Awaiting Menu — New lead, waiting to start\n📝 Capture Name — Bot asking for name\n💬 Capture Questions — Bot asking qualification questions\n✅ Qualified — Lead passed all criteria\n❌ Not Qualified — Lead failed criteria\n👤 Taken Over — Human is handling chat\n📌 Closed — Lead is closed',
        },
        {
          heading: 'AI Lead Scoring',
          body: 'Every lead gets an AI score from 1-10:\n🔴 8-10: Hot Lead — Call immediately\n🟡 6-7: Warm Lead — Call today\n🟢 1-5: Cold Lead — Call when possible',
        },
        {
          heading: 'Lead Actions',
          body: 'From the dashboard you can:\n• View full conversation history\n• Take over the chat\n• Schedule viewings\n• Close the lead\n• Assign to team members',
        },
      ],
    },
    'takeover': {
      title: 'Human Takeover System',
      content: [
        {
          heading: 'What is Takeover?',
          body: 'Takeover lets you step into any conversation and send manual messages to the lead. Your messages appear from the business WhatsApp — the customer never knows the bot stopped.',
        },
        {
          heading: 'How to Take Over',
          body: '1. View leads with LEADS\n2. Note the lead number\n3. Send TAKEOVER [N]\n4. You\'re now chatting directly\n5. Type your message — it goes to the lead\n6. Use /END to end takeover',
        },
        {
          heading: 'During Takeover',
          body: '• Type any message → goes directly to lead\n• /NOTE [text] → add note to lead\n• /QUALIFY → mark as qualified\n• /DISMISS → mark as not qualified\n• /STATUS → see conversation history\n• /END → end takeover',
        },
        {
          heading: 'Multiple Takeovers',
          body: 'You can have multiple active takeovers. All messages appear in your WhatsApp chat with the business number — tap the message from each lead to reply.',
        },
      ],
    },
    'appointments': {
      title: 'Appointment Management',
      content: [
        {
          heading: 'Viewing Appointments',
          body: 'APT — Shows today\'s appointments with times\nAPT ALL — Shows all upcoming appointments',
        },
        {
          heading: 'Managing Appointments',
          body: 'CONFIRM [N] — Confirms appointment & notifies customer\nCANCEL [N] — Cancels appointment & notifies customer\nREMIND [N] — Sends reminder to customer',
        },
        {
          heading: 'Scheduling Appointments',
          body: 'From the agent dashboard:\n1. Open the qualified lead\n2. Click "Schedule Viewing"\n3. Select date and time\n4. Customer gets notified via WhatsApp',
        },
      ],
    },
    'payments': {
      title: 'Payments & Invoicing',
      content: [
        {
          heading: 'Sending Payment Links',
          body: 'PAY [Customer Name or Phone] [Amount]\nExample: PAY Sipho 500\n\nCustomer receives a secure Paystack payment link via WhatsApp instantly.',
        },
        {
          heading: 'Creating Invoices',
          body: 'INVOICE [Name or Phone] [Amount] [Description]\nExample: INVOICE Sipho 500 Haircut\n\nInvoice is created and sent to customer via WhatsApp.',
        },
        {
          heading: 'Managing Invoices',
          body: 'INVOICES — View recent invoices\nINVOICES VIEW — See invoice details\nINVOICES CREATE — Create new invoice',
        },
        {
          heading: 'Payment Fees',
          body: 'You can configure who pays the Paystack fees:\n• Business absorbs — customer pays exact amount\n• Pass to customer — customer covers all fees',
        },
      ],
    },
    'team': {
      title: 'Team Management',
      content: [
        {
          heading: 'Adding Team Members',
          body: 'Admins can generate invite links for each tenant.\n1. Go to Admin Dashboard → Clients\n2. Click "🔗 Invite" next to the tenant\n3. Share the link with team members\n4. They register and request access\n5. Admin approves → they get access',
        },
        {
          heading: 'Roles & Permissions',
          body: '👑 Owner — Full access, all commands\n👤 Admin — Manage team, assign leads, full visibility\n👥 Agent — Only assigned leads, focus on their work\n📌 Borrower — Limited access (pending approval)',
        },
        {
          heading: 'Assigning Leads',
          body: 'ASSIGN [N] [Agent Name]\nExample: ASSIGN 3 Nhlanhla\n\nThe lead is assigned to that agent.',
        },
      ],
    },
    'agents': {
      title: 'Agent Guide',
      content: [
        {
          heading: 'Agent Dashboard',
          body: 'Agents log in to https://easybranding.co.za/agent\n\nTabs:\n• LEADS — Your assigned leads\n• VIEWINGS — Upcoming viewings\n• QUEUE — Active takeovers\n• ALERTS — Notifications',
        },
        {
          heading: 'Agent WhatsApp Commands',
          body: 'LEADS / MYLEADS — View your assigned leads\nTAKEOVER [N] — Take over lead (only if assigned)\nCLOSE [N] — Close assigned lead\n/NOTE [text] — Add note\n/STATUS — See conversation history\n/END — End takeover',
        },
        {
          heading: 'Claiming Leads',
          body: 'If no leads are assigned:\n1. Click "Claim an unassigned lead"\n2. Select a qualified lead\n3. It becomes yours to manage',
        },
      ],
    },
    'admin': {
      title: 'Admin Guide',
      content: [
        {
          heading: 'Admin Dashboard',
          body: 'Admins log in to https://easybranding.co.za/admin\n\nTabs:\n• Overview — Recent activity\n• Active — Live conversations\n• Qualified — Qualified leads\n• Rejected — Rejected leads\n• Funnel — Pipeline visualization\n• Viewings — Appointment schedules\n• Messages — All messages\n• Alerts — High priority issues\n• Clients — Manage tenants\n• Users — Manage team',
        },
        {
          heading: 'Client Management',
          body: 'Admin can:\n• Add clients\n• Edit client settings\n• Suspend/Activate clients\n• Generate invite links\n• View client usage stats',
        },
        {
          heading: 'User Management',
          body: 'Admin can:\n• Approve new users\n• Assign roles\n• View all team members',
        },
      ],
    },
    'faq': {
      title: 'Frequently Asked Questions',
      content: [
        {
          heading: 'Do my customers need to download anything?',
          body: 'No. They message your existing WhatsApp number exactly as they do today. Nothing changes on their side.',
        },
        {
          heading: 'Can I keep my existing WhatsApp number?',
          body: 'Yes. We connect your existing business number to WABOS. Your customers message the same number they already know.',
        },
        {
          heading: 'Does the bot replace my team?',
          body: 'No. The bot handles repetitive qualification questions — freeing your team to focus on closing deals. Team members can take over any conversation instantly from their personal WhatsApp.',
        },
        {
          heading: 'What industries does it work for?',
          body: 'Any business receiving WhatsApp enquiries. Salons, driving schools, car dealerships, medical practices, law firms, schools, recruitment, property — if customers message you on WhatsApp, we can automate it.',
        },
        {
          heading: 'Is my customer data safe and POPIA compliant?',
          body: 'Yes. Each client is fully isolated on our platform. Your leads, conversations and data are never shared with other businesses. We handle all data in compliance with POPIA.',
        },
        {
          heading: 'How long does setup take?',
          body: 'Most businesses are live within 15 minutes. We handle the technical setup. You configure your questions and messages in our simple WhatsApp interface.',
        },
        {
          heading: 'What is PAC Mode?',
          body: 'PAC Mode (PAC Member Services) is a toggle that changes the bot flow from standard lead qualification to membership registration. This lets you handle both membership enquiries and product/service enquiries from the same number.',
        },
        {
          heading: 'How much does it cost?',
          body: 'Professional: R999/month — 1 WhatsApp number, 5 agents\nBusiness: R2,499/month — 2 WhatsApp numbers, unlimited agents\nEnterprise: Custom — unlimited numbers, white-label, dedicated support',
        },
        {
          heading: 'Can I cancel anytime?',
          body: 'Yes. No contracts. No setup fees. First 30 days free. Cancel anytime.',
        },
      ],
    },
  };

  const filteredSections = sections.filter(s =>
    s.label.toLowerCase().includes(search.toLowerCase())
  );

  const currentContent = content[section] || content['getting-started'];

  return (
    <div style={{
      minHeight: '100vh',
      background: c.bg,
      color: c.text,
      fontFamily: "'Outfit', sans-serif",
      padding: '100px 24px 60px',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <Link to="/" style={{ color: c.lime, textDecoration: 'none', fontSize: '14px' }}>← Back to Home</Link>
          <h1 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: '900',
            marginTop: '16px',
            marginBottom: '8px',
          }}>
            Documentation
          </h1>
          <p style={{ color: c.muted, fontSize: '18px' }}>
            Everything you need to know about WABOS
          </p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '32px' }}>
          <input
            type="text"
            placeholder="Search documentation..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '14px 20px',
              borderRadius: '12px',
              background: c.card,
              border: `1px solid ${c.border}`,
              color: c.text,
              fontSize: '15px',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px' }}>
          {/* Sidebar */}
          <div style={{
            background: c.card,
            border: `1px solid ${c.borderDim}`,
            borderRadius: '16px',
            padding: '16px',
            height: 'fit-content',
            maxHeight: '70vh',
            overflowY: 'auto',
          }}>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  background: section === s.id ? `${c.lime}18` : 'transparent',
                  color: section === s.id ? c.lime : c.muted,
                  fontSize: '14px',
                  fontWeight: section === s.id ? '600' : '400',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  marginBottom: '2px',
                }}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{
            background: c.card,
            border: `1px solid ${c.borderDim}`,
            borderRadius: '16px',
            padding: '32px',
          }}>
            <h2 style={{
              fontFamily: "'Fraunces', serif",
              fontSize: '28px',
              fontWeight: '900',
              color: c.lime,
              marginBottom: '24px',
            }}>
              {currentContent.title}
            </h2>

            {currentContent.content.map((item, i) => (
              <div key={i} style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  marginBottom: '8px',
                  color: c.text,
                }}>
                  {item.heading}
                </h3>
                <p style={{
                  color: c.muted,
                  fontSize: '15px',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-wrap',
                }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}