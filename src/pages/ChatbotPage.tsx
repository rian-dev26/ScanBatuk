import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User as UserIcon, Activity, CornerDownLeft, Loader2, Sparkles } from 'lucide-react';
import { askHealthAssistant } from '../services/aiService';
import { ChatMessage } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useUserLocation } from '../hooks/useGoogleMaps';

// Simple markdown renderer for AI responses
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
          {listItems.map((li, i) => <li key={i}>{formatInline(li)}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  const formatInline = (str: string): React.ReactNode => {
    // Bold **text** or __text__
    const parts = str.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
    return parts.map((part, i) => {
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      // Italic *text* or _text_
      const italicParts = part.split(/(\*[^*]+\*|_[^_]+_)/g);
      return italicParts.map((ip, j) => {
        if ((ip.startsWith('*') && ip.endsWith('*') && !ip.startsWith('**')) || (ip.startsWith('_') && ip.endsWith('_') && !ip.startsWith('__'))) {
          return <em key={`${i}-${j}`}>{ip.slice(1, -1)}</em>;
        }
        return ip;
      });
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^[-*]\s|^\d+\.\s/, '');
      listItems.push(content);
    } else {
      flushList();
      if (trimmed === '') {
        elements.push(<br key={`br-${idx}`} />);
      } else {
        elements.push(<p key={`p-${idx}`} className="mb-1 last:mb-0">{formatInline(trimmed)}</p>);
      }
    }
  });
  flushList();
  return elements;
}

const quickReplies = [
  'Apa itu Tuberkulosis?',
  'Gejala TB yang perlu diwaspadai?',
  'Bagaimana cara pencegahan TB?',
  'Hasil screening saya Medium Risk, apa artinya?',
];

export default function ChatbotPage({ initialMessage = '' }: { initialMessage?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'ai',
      content: 'Halo! Saya AI asisten kesehatan dari ScanBatuk. Ada pertanyaan seputar hasil screening, gejala, atau tentang Tuberkulosis yang ingin Anda tanyakan?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState(initialMessage);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { location: userLocation } = useUserLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let currentSessionId = sessionId;

    try {
      if (!currentSessionId && user) {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        const docRef = await addDoc(collection(db, 'chat_sessions'), {
          userId: user.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        currentSessionId = docRef.id;
        setSessionId(currentSessionId);
      } else if (currentSessionId && user) {
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        updateDoc(doc(db, 'chat_sessions', currentSessionId), {
          updatedAt: serverTimestamp()
        }).catch(err => console.error("Error updating chat stats", err));
      }
      
      if (currentSessionId && user) {
        const { doc, collection, setDoc } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        const messageRef = doc(collection(db, 'chat_sessions', currentSessionId, 'messages'), userMsg.id);
        setDoc(messageRef, {
            role: userMsg.role,
            content: userMsg.content,
            timestamp: userMsg.timestamp
        }).catch(err => console.error("Error saving user message:", err));
      }

    } catch (error) {
      console.error("Failed to log chat session:", error);
    }

    const aiResponseText = await askHealthAssistant(userMsg.content, messages, userLocation);
    
    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      content: aiResponseText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
    
    try {
      if (currentSessionId && user) {
        const { doc, collection, setDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        const messageRef = doc(collection(db, 'chat_sessions', currentSessionId, 'messages'), aiMsg.id);
        await setDoc(messageRef, {
            role: aiMsg.role,
            content: aiMsg.content,
            timestamp: aiMsg.timestamp
        });
        await updateDoc(doc(db, 'chat_sessions', currentSessionId), {
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Error saving AI message:", err);
    }
  };

  return (
    <div className="flex flex-col h-full relative w-full" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      <div className="flex-1 flex flex-col h-full w-full">
        
        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3 z-10 pr-12" style={{ backgroundColor: 'var(--bg-canvas)', borderBottom: '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-brand-mint)', color: '#1a3a3a' }}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--text-ink)' }}>Asisten Edukasi ScanBatuk</h2>
            <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success)' }}></span> Aktif merespons
            </p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ backgroundColor: 'var(--bg-soft)' }}>
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-[#0a0a0a] text-white' : 'text-[#1a3a3a]'
                }`} style={msg.role !== 'user' ? { backgroundColor: 'var(--color-brand-mint)' } : { backgroundColor: 'var(--bg-primary)', color: 'var(--text-on-primary)' }}>
                  {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                </div>
                
                <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
                  msg.role === 'user' 
                    ? 'rounded-tr-sm' 
                    : 'border rounded-tl-sm'
                }`} style={msg.role === 'user' ? { backgroundColor: 'var(--bg-primary)', color: 'var(--text-on-primary)' } : { backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border)', color: 'var(--text-ink)' }}>
                  <div className="leading-relaxed text-sm md:text-base">
                    {msg.role === 'ai' ? renderMarkdown(msg.content) : <p className="whitespace-pre-wrap">{msg.content}</p>}
                  </div>
                  <span className="text-[10px] mt-2 block opacity-70" style={msg.role === 'user' ? { color: 'var(--text-on-primary)' } : { color: 'var(--text-dim)' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
               <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-brand-mint)', color: '#1a3a3a' }}>
                 <Activity className="w-4 h-4" />
               </div>
               <div className="rounded-2xl rounded-tl-sm px-5 py-4 flex flex-col gap-2" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}>
                 <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-brand-lavender)' }} />
                 <span className="text-xs" style={{ color: 'var(--text-muted)' }}>AI sedang memproses...</span>
               </div>
            </motion.div>
          )}

          {/* Quick Reply Chips - show only at start */}
          {messages.length <= 1 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-2 pt-2"
            >
              <div className="w-full flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Pertanyaan populer:</span>
              </div>
              {quickReplies.map((qr, i) => (
                <button
                  key={i}
                  onClick={() => setInput(qr)}
                  className="px-3.5 py-2 rounded-xl text-sm transition-all"
                  style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-ink)'; e.currentTarget.style.borderColor = 'var(--text-dim)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-canvas)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  {qr}
                </button>
              ))}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4" style={{ backgroundColor: 'var(--bg-canvas)', borderTop: '1px solid var(--border)' }}>
          <form onSubmit={handleSend} className="relative flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Tanyakan sesuatu..."
                className="w-full rounded-2xl py-3 px-4 pr-12 resize-none focus:outline-none focus:ring-1 text-sm md:text-base max-h-32 min-h-[52px]"
                style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text-ink)', outlineColor: 'var(--text-ink)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--text-ink)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 4) : 1}
              />
              <div className="absolute right-3 bottom-2.5 hidden md:flex items-center justify-center pointer-events-none">
                 <div className="flex border rounded-md px-1.5 py-0.5 text-[10px] items-center gap-1" style={{ backgroundColor: 'var(--bg-canvas)', borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
                   <CornerDownLeft className="w-3 h-3" /> Enter
                 </div>
              </div>
            </div>
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="btn-primary w-12 h-12 md:w-[52px] md:h-[52px] !rounded-2xl !p-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="text-center mt-2">
            <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>AI dapat membuat kesalahan. Jangan jadikan sebagai acuan diagnosis medis utama.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
