import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'system', text: "Hi! I'm your literary assistant. Ask me for recommendations!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const scrollRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen, loading]);

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
    // Update UI immediately
    const newHistory = [...messages, { role: 'user', text: userMsg }];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: userMsg,
        context: getContext(),
        // Send history excluding the last message we just added (redundant) 
        // OR better: Send the previous history so backend can append the new one.
        // Actually, Gemini 'startChat' needs history *before* the current message.
        history: messages 
      });
      
      setMessages(prev => [...prev, { role: 'system', text: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'system', text: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="font-bold">BookShop AI</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                  }`}>
                    {m.role === 'system' ? (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        className="markdown-content"
                        components={{
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                          strong: ({node, ...props}) => <span className="font-bold text-indigo-700" {...props} />,
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                        }}
                      >
                        {m.text}
                      </ReactMarkdown>
                    ) : m.text}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-bl-none flex gap-1.5 border border-slate-100 shadow-sm items-center h-10">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 border-t border-slate-200 bg-white">
              <div className="relative">
                <input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask for a book..." 
                  className="w-full bg-slate-100 border-none rounded-full pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button 
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  ➤
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center text-2xl hover:bg-indigo-600 transition-colors"
      >
        {isOpen ? '✕' : '✨'}
      </motion.button>
    </div>
  );
}