// src/components/CommandReference.jsx
// Public-facing showcase of the WhatsApp Command Centre.
//
// FIX APPLIED (26 June 2026):
// Previous version listed /END as the only way to exit a takeover,
// separate from MENU and 0 (shown only as general main-menu
// commands). Per the actual fix made to whatsappCommandService.js
// today (confirmed working via live test), END, /END, MENU, and 0
// are ALL equivalent ways to end an active takeover — there's no
// slash requirement. Grouped commands by function and added a note
// directly under the Takeover group clarifying this, so a prospect
// reading this doesn't get a narrower picture than what the product
// actually does.
export default function CommandReference() {
  const groups = [
    {
      label: 'Leads',
      color: '#B8F040',
      commands: [
        { cmd: 'LEADS', desc: "View today's leads" },
        { cmd: 'LEADS ALL', desc: 'View all active leads' },
        { cmd: 'LEAD [N]', desc: 'View lead details' },
      ],
    },
    {
      label: 'Takeover',
      color: '#22d3ee',
      note: 'END, /END, MENU, or 0 all end an active takeover — use whichever feels natural.',
      commands: [
        { cmd: 'TAKEOVER [N]', desc: "Take over a lead's chat" },
        { cmd: 'TAKEOVER [Name]', desc: 'Search and take over by name' },
        { cmd: 'ACTIVE', desc: 'See active takeovers' },
        { cmd: 'ENDTAKEOVER [N]', desc: 'End a specific takeover' },
        { cmd: '/NOTE [text]', desc: 'Add a note to the lead' },
        { cmd: '/QUALIFY', desc: 'Mark lead as qualified' },
        { cmd: '/DISMISS', desc: 'Mark lead as not qualified' },
        { cmd: '/STATUS', desc: 'See takeover status' },
      ],
    },
    {
      label: 'Appointments',
      color: '#fbbf24',
      commands: [
        { cmd: 'APT', desc: "Today's appointments" },
        { cmd: 'APT ALL', desc: 'Upcoming appointments' },
        { cmd: 'CONFIRM [N]', desc: 'Confirm appointment' },
        { cmd: 'CANCEL [N]', desc: 'Cancel appointment' },
        { cmd: 'REMIND [N]', desc: 'Send reminder' },
      ],
    },
    {
      label: 'Payments & Invoicing',
      color: '#34d399',
      commands: [
        { cmd: 'PAY [Name] [Amount]', desc: 'Send a payment link' },
        { cmd: 'INVOICE [Name] [Amount] [Desc]', desc: 'Create an invoice' },
        { cmd: 'INVOICES', desc: 'Manage invoices' },
      ],
    },
    {
      label: 'Business & Team',
      color: '#f87171',
      commands: [
        { cmd: 'STATS', desc: 'Business performance' },
        { cmd: 'AGENTS', desc: 'Team activity' },
        { cmd: '/pac on', desc: 'Enable PAC membership mode' },
        { cmd: '/pac off', desc: 'Disable PAC mode' },
      ],
    },
    {
      label: 'Navigation',
      color: '#8A9080',
      commands: [
        { cmd: 'MENU', desc: 'Show the main menu' },
        { cmd: '0', desc: 'Return to the main menu' },
      ],
    },
  ];

  const c = {
    card: '#121710',
    text: '#EEF0E8',
    muted: '#8A9080',
    borderDim: 'rgba(255,255,255,0.06)',
  };

  return (
    <div
      style={{
        background: c.card,
        border: `1px solid ${c.borderDim}`,
        borderRadius: '16px',
        padding: '28px',
      }}
    >
      <h3
        style={{
          fontSize: '18px',
          fontWeight: '700',
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: c.text,
        }}
      >
        💬 WhatsApp Command Reference
      </h3>
      <p style={{ color: c.muted, fontSize: '13px', marginBottom: '24px' }}>
        Everything below is a real WABOS command — typed straight into your business WhatsApp number, no app or login required.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {groups.map((group, gi) => (
          <div key={gi}>
            <p
              style={{
                color: group.color,
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              {group.label}
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '6px',
              }}
            >
              {group.commands.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: group.color, fontFamily: 'monospace', fontWeight: '600', flexShrink: 0 }}>
                    {item.cmd}
                  </span>
                  <span style={{ color: c.muted, textAlign: 'right' }}>{item.desc}</span>
                </div>
              ))}
            </div>
            {group.note && (
              <p style={{ color: c.muted, fontSize: '12px', fontStyle: 'italic', marginTop: '8px', paddingLeft: '4px' }}>
                {group.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}