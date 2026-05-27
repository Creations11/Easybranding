// src/App.jsx
import { useState, useRef, useEffect } from 'react';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: "I am Lendly.\nA living intelligence, grown to help African businesses operate with clarity and grace.\nHow may I serve you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let reply = "I hear you. I'm here with you.";
      if (userMsg.toLowerCase().includes("price") || userMsg.toLowerCase().includes("cost")) {
        reply = "Our Growth plan begins at R2,450 per month. Would you like me to show you what becomes possible?";
      }
      setMessages(prev => [...prev, { type: 'bot', text: reply }]);
    }, 950);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden relative">
      {/* Living background */}
      <div className="fixed inset-0 bg-[radial-gradient(at_40%_25%,rgba(163,255,79,0.09)_0%,transparent_70%)] pointer-events-none"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/95 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-3xl bg-gradient-to-br from-lime-300 to-emerald-400 flex items-center justify-center text-2xl font-bold text-black shadow-2xl">EB</div>
            <span className="text-3xl font-display font-bold tracking-[-1.8px]">Easy Branding AI</span>
          </div>
          <button 
            onClick={() => setIsChatOpen(true)}
            className="px-10 py-4 bg-white text-black rounded-3xl font-medium hover:bg-lime-400 transition-all active:scale-95 flex items-center gap-3"
          >
            Speak with Lendly <span className="text-xl">🌿</span>
          </button>
        </div>
      </nav>

      {/* Hero - More Direct Business Description */}
      <section className="pt-52 pb-36 px-6 text-center relative">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-7xl md:text-[5.8rem] font-display font-bold leading-none tracking-[-4px] mb-10">
            Intelligence<br />that feels<br />
            <span className="bg-gradient-to-r from-lime-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">naturally alive</span>
          </h1>
          <p className="text-2xl text-gray-400 max-w-3xl mx-auto mb-16 leading-relaxed">
            We help African businesses automate customer support, WhatsApp communication, lead generation, and daily operations using intelligent AI systems.
          </p>
          <button 
            onClick={() => setIsChatOpen(true)}
            className="px-16 py-7 bg-white text-xl text-black rounded-3xl font-medium hover:bg-lime-400 transition-all active:scale-95"
          >
            Begin a Conversation with Lendly
          </button>
        </div>
      </section>

      {/* Services */}
      <section className="py-28 px-6 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-display font-bold text-center mb-20">What We Deliver</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "📱", title: "WhatsApp Automation", desc: "Full business automation directly inside WhatsApp — leads, support, payments & tracking." },
              { icon: "🧠", title: "Lendly AI Assistant", desc: "Your intelligent co-pilot for operations, customer service, and decision making." },
              { icon: "📊", title: "Smart Dashboards", desc: "Real-time visibility into your business performance and opportunities." }
            ].map((item, i) => (
              <div key={i} className="bg-[#111111] p-12 rounded-3xl hover:-translate-y-4 transition-all duration-700 border border-white/5 hover:border-lime-400/30 group">
                <div className="text-7xl mb-10 group-hover:scale-110 transition duration-700">{item.icon}</div>
                <h3 className="text-3xl font-display font-bold mb-4">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-3xl font-display mb-3">Easy Branding AI</p>
          <p className="text-lime-400 text-lg">Organic Intelligence • Grown for African Businesses</p>
          <p className="text-gray-500 mt-10">© 2026 • All rights reserved</p>
        </div>
      </footer>

      {/* Floating Orb */}
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-10 right-10 w-20 h-20 bg-gradient-to-br from-lime-400 to-emerald-400 rounded-full flex items-center justify-center text-4xl shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 z-50 ring-4 ring-lime-400/30"
      >
        🌿
      </button>

      {/* Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#111111] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between bg-[#1A1A18]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-300 to-teal-400 flex items-center justify-center text-3xl">🌿</div>
                <div>
                  <div className="font-display text-xl font-semibold">Lendly</div>
                  <div className="text-xs text-lime-400">Living Intelligence</div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-4xl text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="h-[460px] p-8 overflow-y-auto bg-[#0A0A0A] space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-3xl px-7 py-5 ${msg.type === 'user' ? 'bg-lime-400 text-black' : 'bg-[#1F1F1F]'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex">
                  <div className="bg-[#1F1F1F] rounded-3xl px-7 py-5 flex gap-2">
                    <div className="w-2 h-2 bg-lime-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-lime-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-lime-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-6 border-t border-white/10 bg-[#111111]">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Speak your thoughts..." 
                  className="flex-1 bg-[#1F1F1F] border border-white/10 rounded-3xl px-7 py-6 focus:outline-none focus:border-lime-400 text-lg"
                />
                <button onClick={sendMessage} className="px-12 bg-lime-400 hover:bg-lime-300 text-black rounded-3xl font-medium transition">Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;