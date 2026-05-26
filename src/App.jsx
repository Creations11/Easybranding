// src/App.jsx
import { useState, useRef, useEffect } from 'react';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hello! I'm Lendly, your AI Operations Assistant for Easy Branding AI.\nHow can I help you today?" }
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
      let reply = "Thank you! I'm here to help you automate your operations and grow your business.";
      if (userMsg.toLowerCase().includes("price") || userMsg.toLowerCase().includes("cost") || userMsg.toLowerCase().includes("plan")) {
        reply = "Our Growth plan starts at R2,450/month. Would you like me to show you the full pricing?";
      }
      setMessages(prev => [...prev, { type: 'bot', text: reply }]);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-[#080808]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-400 flex items-center justify-center text-sm font-bold text-black shadow-lg">EB</div>
            <span className="text-2xl font-bold tracking-tighter">Easy Branding AI</span>
          </div>

          <button 
            onClick={() => setIsChatOpen(true)}
            className="px-8 py-3.5 bg-lime-400 text-black rounded-2xl font-medium hover:bg-lime-300 transition-all active:scale-95"
          >
            Talk to Lendly
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-28 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold leading-none tracking-tighter mb-8">
            Intelligence that feels<br />
            <span className="bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              naturally alive.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12">
            AI Operations Infrastructure for African SMEs.<br />
            Simple. Intelligent. Built for real business.
          </p>
          <button 
            onClick={() => setIsChatOpen(true)}
            className="px-12 py-5 bg-lime-400 hover:bg-lime-300 text-black rounded-2xl text-lg font-medium transition-all active:scale-95"
          >
            Start Free Trial — Talk to Lendly
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-[#0F0F0D]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Built for Real Operations</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#1A1A18] p-10 rounded-3xl hover:-translate-y-3 transition-all border border-white/5 hover:border-lime-400/30 group">
              <div className="text-lime-400 text-6xl mb-8 group-hover:scale-110 transition">📱</div>
              <h3 className="text-2xl font-bold mb-3">WhatsApp Automation</h3>
              <p className="text-gray-400">Your customers are already on WhatsApp. We bring your entire operations there.</p>
            </div>
            <div className="bg-[#1A1A18] p-10 rounded-3xl hover:-translate-y-3 transition-all border border-white/5 hover:border-lime-400/30 group">
              <div className="text-lime-400 text-6xl mb-8 group-hover:scale-110 transition">🧠</div>
              <h3 className="text-2xl font-bold mb-3">Lendly AI Assistant</h3>
              <p className="text-gray-400">Your intelligent co-pilot for daily operations and decision making.</p>
            </div>
            <div className="bg-[#1A1A18] p-10 rounded-3xl hover:-translate-y-3 transition-all border border-white/5 hover:border-lime-400/30 group">
              <div className="text-lime-400 text-6xl mb-8 group-hover:scale-110 transition">📊</div>
              <h3 className="text-2xl font-bold mb-3">Smart Dashboards</h3>
              <p className="text-gray-400">Real-time visibility into what's working and what needs attention.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-[#080808]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Simple, Transparent Pricing</h2>
          <p className="text-gray-400 mb-16">No hidden fees. Cancel anytime.</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#1A1A18] p-10 rounded-3xl border border-white/10 hover:border-lime-400/30 transition-all">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-5xl font-bold mb-8">R950<span className="text-base font-normal text-gray-400">/mo</span></p>
              <ul className="space-y-4 mb-10 text-left text-gray-400">
                <li className="flex items-center gap-2"><span className="text-lime-400">✓</span> WhatsApp Automation</li>
                <li className="flex items-center gap-2"><span className="text-lime-400">✓</span> Basic Lendly Access</li>
                <li className="flex items-center gap-2"><span className="text-lime-400">✓</span> 1 Dashboard</li>
              </ul>
              <button className="w-full py-4 border border-white/30 rounded-2xl hover:bg-white/5">Get Started</button>
            </div>

            <div className="bg-gradient-to-b from-lime-400 to-emerald-400 p-10 rounded-3xl text-black relative scale-105 shadow-2xl">
              <div className="absolute -top-4 right-6 bg-black text-white text-xs px-5 py-1 rounded-full">Most Popular</div>
              <h3 className="text-2xl font-bold mb-2">Growth</h3>
              <p className="text-5xl font-bold mb-8">R2,450<span className="text-base font-normal opacity-75">/mo</span></p>
              <ul className="space-y-4 mb-10 text-left">
                <li className="flex items-center gap-2"><span className="text-black">✓</span> Full WhatsApp Suite</li>
                <li className="flex items-center gap-2"><span className="text-black">✓</span> Unlimited Lendly</li>
                <li className="flex items-center gap-2"><span className="text-black">✓</span> Advanced Dashboards</li>
                <li className="flex items-center gap-2"><span className="text-black">✓</span> Priority Support</li>
              </ul>
              <button className="w-full py-4 bg-black text-white rounded-2xl hover:bg-black/80">Start Growth Plan</button>
            </div>

            <div className="bg-[#1A1A18] p-10 rounded-3xl border border-white/10 hover:border-lime-400/30 transition-all">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-5xl font-bold mb-8">Custom</p>
              <ul className="space-y-4 mb-10 text-left text-gray-400">
                <li className="flex items-center gap-2"><span className="text-lime-400">✓</span> Everything in Growth</li>
                <li className="flex items-center gap-2"><span className="text-lime-400">✓</span> Custom AI Training</li>
                <li className="flex items-center gap-2"><span className="text-lime-400">✓</span> Dedicated Manager</li>
              </ul>
              <button className="w-full py-4 border border-white/30 rounded-2xl hover:bg-white/5">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-16 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>© 2026 Easy Branding AI. All rights reserved.</p>
          <p className="mt-3 text-lime-400">Built with Organic Intelligence</p>
        </div>
      </footer>

      {/* Lendly Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#111111] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between bg-[#1A1A18]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-lime-400 flex items-center justify-center text-black font-bold">L</div>
                <div>
                  <div className="font-semibold">Lendly</div>
                  <div className="text-xs text-lime-400">Online • AI Assistant</div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-3xl text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="h-[420px] p-6 overflow-y-auto bg-[#0A0A0A] space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-3xl px-6 py-4 ${msg.type === 'user' ? 'bg-lime-400 text-black' : 'bg-[#1F1F1F]'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex">
                  <div className="bg-[#1F1F1F] rounded-3xl px-6 py-4 flex gap-1.5">
                    <div className="w-2 h-2 bg-lime-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-lime-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-lime-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-5 border-t border-white/10 bg-[#111111]">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask Lendly anything..." 
                  className="flex-1 bg-[#1F1F1F] border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-lime-400"
                />
                <button onClick={sendMessage} className="px-10 bg-lime-400 hover:bg-lime-300 text-black rounded-2xl font-medium transition">Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;