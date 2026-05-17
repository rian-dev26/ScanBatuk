import React, { useState, useEffect } from 'react';
import { Sparkles, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ChatbotPage from '../pages/ChatbotPage';

export function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');

  useEffect(() => {
    if (isOpen) return;
    const show = setTimeout(() => setShowTooltip(true), 4000);
    const hide = setTimeout(() => setShowTooltip(false), 9000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [isOpen]);

  useEffect(() => {
    const handleOpenChat = (e: any) => {
      setIsOpen(true);
      setShowTooltip(false);
      if (e.detail?.message) setInitialMessage(e.detail.message);
      else setInitialMessage('');
    };
    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenChat);
  }, []);

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.5, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 10 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="fixed bottom-6 right-6 z-40 md:bottom-8 md:right-8 flex flex-col items-end gap-2">
            <AnimatePresence>
              {showTooltip && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.95 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="rounded-2xl shadow-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap flex items-center gap-2 relative" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)', color: 'var(--text-ink)' }}>
                  <MessageCircle className="w-4 h-4 text-[#22c55e]" />
                  Ada yang bisa saya bantu? ✨
                  <div className="absolute -bottom-1.5 right-8 w-3 h-3 rotate-45" style={{ backgroundColor: 'var(--bg-canvas)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <motion.div className="absolute inset-0 rounded-full opacity-20" style={{ backgroundColor: 'var(--bg-primary)' }} animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
              <button onClick={() => { setIsOpen(true); setShowTooltip(false); }} className="animate-breathe relative flex items-center gap-3 px-5 h-14 rounded-xl shadow-lg group transition-all duration-300 overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-on-primary)' }}>
                <motion.div animate={{ rotate: [0, 15, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                  <Sparkles className="w-5 h-5 text-[#16A34A] relative z-10" />
                </motion.div>
                <span className="font-semibold text-sm whitespace-nowrap relative z-10">Tanya AI</span>
                <motion.span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#22c55e] rounded-full" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setIsOpen(false)} className="md:hidden fixed inset-0 backdrop-blur-sm z-50" style={{ backgroundColor: 'var(--overlay-black)' }} />
            <motion.div initial={{ opacity: 0, y: 60, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.97 }} transition={{ type: 'spring', stiffness: 350, damping: 30 }} className="fixed bottom-0 right-0 w-full h-[88vh] md:w-[430px] md:h-[620px] md:bottom-8 md:right-8 z-50 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col rounded-t-[2rem]" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}>
              <div className="md:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
              </div>
              <div className="absolute top-3 right-3 z-50 md:top-4 md:right-4">
                <button onClick={() => setIsOpen(false)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                  <motion.div whileTap={{ rotate: 90 }} transition={{ duration: 0.15 }}><X className="w-4 h-4" /></motion.div>
                </button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <ChatbotPage initialMessage={initialMessage} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
