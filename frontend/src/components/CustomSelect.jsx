import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select...", 
  icon,
  className = "" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button - Clean Professional Style */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white text-slate-700 py-3 px-4 rounded-xl border transition-all duration-200 outline-none ${
          isOpen 
            ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-md' 
            : 'border-slate-200 hover:border-slate-300 shadow-sm hover:shadow'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {icon && <span className="text-slate-400 text-lg">{icon}</span>}
          <span className={`font-semibold text-sm truncate ${!value ? 'text-slate-400' : 'text-slate-700'}`}>
            {selectedLabel}
          </span>
        </div>
        
        {/* Animated Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400 ml-2 flex-shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </motion.div>
      </button>

      {/* Dropdown Menu - Floating Glassy Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-2 w-full bg-white/95 backdrop-blur-xl border border-slate-100 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar ring-1 ring-black/5"
          >
            <div className="p-1.5 space-y-0.5">
              {options.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium transition-colors ${
                    value === opt.value
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && (
                    <span className="text-indigo-600">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}