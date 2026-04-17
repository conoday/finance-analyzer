"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Halo! Saya Oprex AI. Ada yang bisa saya bantu terkait keuanganmu hari ini?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  // Auto scroll to bottom
  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isOpen]);

  async function handleSend() {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput("");
    
    const newMessages: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: msg,
          history: messages.filter(m => m.role !== "system").slice(-5) 
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error");
      
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Maaf, terjadi kesalahan atau API limit." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-16 right-0 w-80 sm:w-96 h-[400px] flex flex-col rounded-2xl border shadow-2xl overflow-hidden glass mix-blend-normal"
              style={{
                background: "rgba(15, 23, 42, 0.85)", // slate-900 with opacity
                backdropFilter: "blur(16px)",
                borderColor: "rgba(255,255,255,0.1)",
                boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.25)",
              }}
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between"
                  style={{ background: "linear-gradient(to right, rgba(99,102,241,0.1), rgba(20,184,166,0.1))" }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500/20">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1">
                      Oprex AI <Sparkles className="w-3 h-3 text-amber-400" />
                    </h3>
                    <p className="text-[10px] text-teal-400">Selalu Aktif</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex max-w-[85%] ${msg.role === "user" ? "ml-auto" : "mr-auto"}`}>
                    <div 
                      className={`text-sm px-4 py-2.5 rounded-2xl ${
                        msg.role === "user" 
                          ? "bg-indigo-500 text-white rounded-br-sm" 
                          : "bg-white/10 text-slate-200 border border-white/5 rounded-bl-sm"
                      }`}
                      style={msg.role === "user" ? { background: "linear-gradient(135deg, #6366f1, #4f46e5)" } : {}}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex max-w-[85%] mr-auto">
                    <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/5 rounded-bl-sm flex gap-1 items-center h-10">
                      <motion.div animate={{ y: [0,-3,0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full"/>
                      <motion.div animate={{ y: [0,-3,0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full"/>
                      <motion.div animate={{ y: [0,-3,0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full"/>
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-white/10 bg-black/20">
                <div className="relative">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Tanya soal budget..."
                    className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="absolute right-1.5 top-1.5 w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center disabled:opacity-50 hover:bg-indigo-400 transition"
                  >
                    <Send className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 border border-white/10 relative"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          {!isOpen && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-slate-900 rounded-full animate-pulse" />
          )}
        </motion.button>
      </div>
    </>
  );
}
