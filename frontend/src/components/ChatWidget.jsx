import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'system', text: "Hi! I'm your literary assistant. Ask me for recommendations or details about any book!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const scrollRef = useRef(null);
  const location = useLocation();

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  // Context Awareness: Try to scrape book details if on a BookDetail page
  // (In a real app, you might pass this via props or context, but this is a quick hack)
  const getContext = () => {
    if (location.pathname.startsWith('/book/')) {
      const title = document.querySelector('h1')?.innerText;
      const author = document.querySelector('p.text-xl')?.innerText?.replace('by ', '');
      if (title) return { title, author };
    }
    return null;
  };

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: userMsg,
        context: getContext()
      });
      
      setMessages(prev => [...prev, { role: 'system', text: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'system', text: "I'm having trouble connecting to the library network. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center">
              <div className="flex items-center gap-2 text-white">
                <span className="text-xl">✨</span>
                <h3 className="font-bold font-serif">BookShop AI</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="relative">
                <input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask for a book recommendation..." 
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
                <button 
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-slate-900 dark:bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center text-2xl transition-colors"
      >
        {isOpen ? '✕' : '✨'}
      </motion.button>
    </div>
  );
}