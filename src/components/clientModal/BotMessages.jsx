import { Textarea } from '../ui/Field';
import { SectionTitle, Label, Hint } from './ui';

export default function BotMessages({ botMsgs, setMsg }) {
  return (
    <>
      {/* Bot Messages — the greeting/qualified/rejected copy the bot
          actually sends (tenant.customMessages). Leave blank to use
          the industry template defaults. */}
      <SectionTitle>Bot Messages</SectionTitle>
      <Hint>
        What the bot says at each stage. Blank = the built-in template for this industry. You can use <code className="text-ink">{'{{name}}'}</code> and <code className="text-ink">{'{{brand}}'}</code>.
      </Hint>
      <Label htmlFor="bot-welcome">Welcome / Greeting (first message a customer gets)</Label>
      <Textarea id="bot-welcome" value={botMsgs.welcome} onChange={e => setMsg('welcome', e.target.value)} rows={5} placeholder="👋 Welcome to {{brand}}! …" className="mb-3.5 min-h-[90px] bg-white/4" />
      <Label htmlFor="bot-qualified">Qualified (after all questions answered)</Label>
      <Textarea id="bot-qualified" value={botMsgs.qualified} onChange={e => setMsg('qualified', e.target.value)} rows={3} placeholder="Perfect, thanks {{name}}! ✅ …" className="mb-3.5 min-h-[60px] bg-white/4" />
      <Label htmlFor="bot-rejected">Rejected / Not a fit (optional)</Label>
      <Textarea id="bot-rejected" value={botMsgs.rejected} onChange={e => setMsg('rejected', e.target.value)} rows={2} placeholder="No problem at all! …" className="mb-3.5 min-h-[48px] bg-white/4" />
    </>
  );
}
