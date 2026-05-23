// src/App.jsx
import { useState } from 'react';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-[#0A0A0A]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-sm font-bold">EB</div>
            <span className="text-2xl font-bold tracking-tight">Easy Branding AI</span>
          </div>

          <button 
            onClick={() => setIsChatOpen(true)}
            className="px-6 py-3 bg-white text-black rounded-2xl font-medium hover:bg-white/90 transition"
          >
            Talk to Lendly
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold leading-none tracking-tighter mb-8">
            Intelligence that feels<br />
            <span className="bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
              naturally alive.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12">
            AI Operations Infrastructure for SMEs.<br />
            Simple. Intelligent. Built for real business.
          </p>
          <button 
            onClick={() => setIsChatOpen(true)}
            className="px-10 py-4 bg-white text-black rounded-2xl text-lg font-medium hover:scale-105 transition"
          >
            Start Free Trial
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-[#111111]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Built for Real Operations</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#1A1A1A] p-8 rounded-3xl">
              <div className="text-green-400 text-4xl mb-4">📱</div>
              <h3 className="text-2xl font-semibold mb-3">WhatsApp Automation</h3>
              <p className="text-gray-400">Apply, track, and manage loans directly inside WhatsApp.</p>
            </div>

            <div className="bg-[#1A1A1A] p-8 rounded-3xl">
              <div className="text-teal-400 text-4xl mb-4">🧠</div>
              <h3 className="text-2xl font-semibold mb-3">Lendly AI Assistant</h3>
              <p className="text-gray-400">Intelligent guidance for your entire business operations.</p>
            </div>

            <div className="bg-[#1A1A1A] p-8 rounded-3xl">
              <div className="text-cyan-400 text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-semibold mb-3">Smart Dashboards</h3>
              <p className="text-gray-400">Real-time insights and operational intelligence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Lendly Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#111111] w-full max-w-lg rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex justify-between">
              <div>Lendly • AI Operations Assistant</div>
              <button onClick={() => setIsChatOpen(false)} className="text-2xl">✕</button>
            </div>
            <div className="h-96 p-6 overflow-y-auto bg-[#0A0A0A]">
              <div className="bg-[#1F1F1F] rounded-3xl p-4">
                Hello! I'm Lendly.<br />How can I help with your operations today?
              </div>
            </div>
            <div className="p-4">
              <input 
                type="text" 
                placeholder="Type your message..." 
                className="w-full bg-[#1F1F1F] border border-white/10 rounded-2xl px-6 py-4 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
