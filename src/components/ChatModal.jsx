import { useState, useRef, useEffect } from 'react';
import api from '../api';

const colors = { lime: '#a3e635', emerald: '#34d399', text: '#f5f5f0', muted: '#a1a1aa', card: '#121210' };

export default function ChatModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hello! I am Lendly 🌿 — your WhatsApp automation assistant.\n\nHow can I help your business today?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      await api.post('/leads/send', { phone: '+27846549578', message: userMessage });
      setMessages(prev => [...prev, { role: 'assistant', content: '✅ Message sent successfully via WhatsApp!' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Failed to send message. Is the backend running?' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '90%', maxWidth: '480px', background: colors.card, borderRadius: '24px', overflow: 'hidden', border: `1px solid ${colors.lime}30` }}>
        <div style={{ padding: '20px', background: '#0A0A08', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid rgba(163,230,53,0.2)` }}>
          <div>
            <strong>Lendly Assistant</strong>
            <div style={{ fontSize: '13px', color: colors.muted }}>WhatsApp Automation</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.muted, fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ height: '420px', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', background: msg.role === 'user' ? colors.lime : '#1C1C19', color: msg.role === 'user' ? '#050505' : colors.text, padding: '14px 18px', borderRadius: '18px' }}>
              {msg.content}
            </div>
          ))}
          {loading && <div style={{ alignSelf: 'flex-start' }}><div style={{ padding: '12px 18px', background: '#1C1C19', borderRadius: '18px' }}>Typing...</div></div>}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '16px', borderTop: `1px solid rgba(163,230,53,0.2)`, display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type message to send via WhatsApp..."
            style={{ flex: 1, padding: '14px 18px', borderRadius: '999px', background: '#1C1C19', border: '1px solid rgba(163,230,53,0.3)', color: colors.text }}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ padding: '0 28px', background: colors.lime, color: '#050505', border: 'none', borderRadius: '999px', fontWeight: '700', cursor: 'pointer' }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}