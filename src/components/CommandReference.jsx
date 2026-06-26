// src/components/CommandReference.jsx
export default function CommandReference() {
  const commands = [
    { cmd: 'LEADS', desc: 'View today\'s leads' },
    { cmd: 'LEADS ALL', desc: 'View all active leads' },
    { cmd: 'LEAD [N]', desc: 'View lead details' },
    { cmd: 'TAKEOVER [N]', desc: 'Take over a lead\'s chat' },
    { cmd: 'TAKEOVER [Name]', desc: 'Search and take over by name' },
    { cmd: 'ACTIVE', desc: 'See active takeovers' },
    { cmd: 'ENDTAKEOVER [N]', desc: 'End a takeover' },
    { cmd: '/END', desc: 'End your current takeover' },
    { cmd: '/NOTE [text]', desc: 'Add note to lead' },
    { cmd: '/QUALIFY', desc: 'Mark lead as qualified' },
    { cmd: '/DISMISS', desc: 'Mark lead as not qualified' },
    { cmd: '/STATUS', desc: 'See conversation history' },
    { cmd: 'APT', desc: 'Today\'s appointments' },
    { cmd: 'APT ALL', desc: 'Upcoming appointments' },
    { cmd: 'CONFIRM [N]', desc: 'Confirm appointment' },
    { cmd: 'CANCEL [N]', desc: 'Cancel appointment' },
    { cmd: 'REMIND [N]', desc: 'Send reminder' },
    { cmd: 'PAY [Name] [Amount]', desc: 'Send payment link' },
    { cmd: 'INVOICE [Name] [Amount] [Desc]', desc: 'Create invoice' },
    { cmd: 'INVOICES', desc: 'Manage invoices' },
    { cmd: 'STATS', desc: 'Business performance' },
    { cmd: 'AGENTS', desc: 'Team activity' },
    { cmd: '/pac on', desc: 'Enable PAC mode' },
    { cmd: '/pac off', desc: 'Disable PAC mode' },
    { cmd: 'MENU', desc: 'Show main menu' },
    { cmd: '0', desc: 'Return to main menu' },
  ];

  const c = {
    card: '#121710', lime: '#B8F040', muted: '#8A9080',
    text: '#EEF0E8', borderDim: 'rgba(255,255,255,0.06)',
  };

  return (
    <div style={{
      background: c.card,
      border: `1px solid ${c.borderDim}`,
      borderRadius: '16px',
      padding: '24px',
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '700',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        💬 WhatsApp Command Reference
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '6px',
      }}>
        {commands.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '8px',
              background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
              fontSize: '13px',
            }}
          >
            <span style={{ color: c.lime, fontFamily: 'monospace', fontWeight: '600' }}>
              {item.cmd}
            </span>
            <span style={{ color: c.muted }}>{item.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}