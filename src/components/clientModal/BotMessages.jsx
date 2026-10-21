import { c, iStyle, labelStyle } from './styles';

export default function BotMessages({ botMsgs, setMsg }) {
  return (
    <>
      {/* Bot Messages — the greeting/qualified/rejected copy the bot
          actually sends (tenant.customMessages). Leave blank to use
          the industry template defaults. */}
      <p style={{ ...labelStyle, color: c.lime, fontWeight: '600', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.08em', marginTop: '16px', marginBottom: '12px' }}>
        Bot Messages
      </p>
      <p style={{ color: c.muted, fontSize: '12px', marginBottom: '10px' }}>
        What the bot says at each stage. Blank = the built-in template for this industry. You can use <code style={{ color: c.text }}>{'{{name}}'}</code> and <code style={{ color: c.text }}>{'{{brand}}'}</code>.
      </p>
      <label style={labelStyle}>Welcome / Greeting (first message a customer gets)</label>
      <textarea value={botMsgs.welcome} onChange={e => setMsg('welcome', e.target.value)} rows={5} placeholder="👋 Welcome to {{brand}}! …" style={{ ...iStyle, resize: 'vertical', minHeight: '90px' }} />
      <label style={labelStyle}>Qualified (after all questions answered)</label>
      <textarea value={botMsgs.qualified} onChange={e => setMsg('qualified', e.target.value)} rows={3} placeholder="Perfect, thanks {{name}}! ✅ …" style={{ ...iStyle, resize: 'vertical', minHeight: '60px' }} />
      <label style={labelStyle}>Rejected / Not a fit (optional)</label>
      <textarea value={botMsgs.rejected} onChange={e => setMsg('rejected', e.target.value)} rows={2} placeholder="No problem at all! …" style={{ ...iStyle, resize: 'vertical', minHeight: '48px' }} />
    </>
  );
}
