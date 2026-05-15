import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, AlertCircle, Info, ChevronRight, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { analyzeCoughAudio } from '../services/aiService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function ScreeningPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRecording]);

  useEffect(() => {
    if (isRecording && recordingTime >= 6) stopRecording();
  }, [recordingTime, isRecording]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop();
    };
  }, []);

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMicError('Akses mikrofon ditolak. Mohon izinkan akses mikrofon di pengaturan browser Anda untuk melanjutkan screening.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAnalisa = async () => {
    if (!audioBlob) return;
    setIsAnalyzing(true);
    const steps = ['Memproses Audio...', 'Mengekstrak Fitur Akustik...', 'Membandingkan Pola Batuk...', 'Menganalisis Risiko...'];
    for (let i = 0; i < steps.length; i++) {
      setAnalysisStep(i);
      await new Promise(r => setTimeout(r, 1200));
    }
    const result = await analyzeCoughAudio(audioBlob);
    if (user) {
      try {
        await addDoc(collection(db, 'screenings'), {
          userId: user.id, riskScore: result.score, riskLevel: result.riskLevel, aiInsight: result.insight, createdAt: serverTimestamp()
        });
      } catch (error: any) { console.error('Failed to save screening:', error); }
    }
    navigate(isDashboard ? '/dashboard/result' : '/result', { state: { result } });
  };

  if (isAnalyzing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-canvas)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-10 rounded-3xl flex flex-col items-center max-w-md w-full text-center" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}>
          <div className="relative w-32 h-32 flex items-center justify-center mb-8">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute inset-0 rounded-full border-4 border-dashed" style={{ borderColor: 'var(--border)' }} />
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-on-primary)' }}>
              <Activity className="w-10 h-10" />
            </motion.div>
          </div>
          <h2 className="text-2xl font-medium mb-4" style={{ color: 'var(--text-ink)', letterSpacing: '-0.02em' }}>AI sedang menganalisis</h2>
          <div className="h-6">
            <AnimatePresence mode="wait">
              <motion.p key={analysisStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="font-medium" style={{ color: 'var(--text-muted)' }}>
                {['Memproses Audio...', 'Mengekstrak Fitur Frekuensi...', 'Membandingkan Pola Anomali...', 'Menghitung Tingkat Risiko...'][analysisStep]}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="w-full h-2 rounded-full mt-8 overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
            <motion.div className="h-full rounded-full" style={{ backgroundColor: 'var(--bg-primary)' }} initial={{ width: "0%" }} animate={{ width: `${((analysisStep + 1) / 4) * 100}%` }} transition={{ duration: 0.5 }} />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-12 px-4" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      <div className="max-w-2xl mx-auto w-full">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-medium mb-3" style={{ color: 'var(--text-ink)', letterSpacing: '-0.025em' }}>ScanBatuk</h1>
          <p style={{ color: 'var(--text-muted)' }}>Rekam suara batuk Anda untuk mendapatkan screening risiko awal.</p>
        </div>

        {/* Instructions Card */}
        <div className="card-feature bg-[#ffb084] text-[#0a0a0a] mb-8 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center shrink-0"><Info className="w-5 h-5" /></div>
          <div>
            <h3 className="font-semibold mb-2">Instruksi Perekaman</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a]" /> Pindah ke ruangan yang senyap dan tidak bising.</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a]" /> Posisikan smartphone sektar 20-30cm dari mulut.</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a]" /> Batuklah secara natural 3-5 kali berturut-turut.</li>
            </ul>
          </div>
        </div>

        {/* Recorder Area */}
        <div className="rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}>
          {/* Background dot grid — pointer-events-none so buttons remain clickable */}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: 'var(--dot-opacity)', backgroundImage: 'radial-gradient(circle, var(--text-ink) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          {!audioBlob || isRecording ? (
            <>
              <div className="relative mb-8 flex items-center justify-center w-40 h-40">
                {isRecording && (
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="72" fill="none" stroke="var(--bg-card)" strokeWidth="6" />
                    <motion.circle cx="80" cy="80" r="72" fill="none" stroke="#ff4d8b" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 72}`} animate={{ strokeDashoffset: (2 * Math.PI * 72) * (recordingTime / 6) }} transition={{ duration: 0.9, ease: 'linear' }} />
                  </svg>
                )}
                {isRecording && (
                  <>
                    {[0, 0.5, 1].map((delay, i) => (
                      <motion.div key={i} className="absolute w-28 h-28 rounded-full bg-[#ff4d8b]" animate={{ scale: [1, 2.2], opacity: [0.35, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay, ease: 'easeOut' }} />
                    ))}
                  </>
                )}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={cn(
                    "relative z-10 w-28 h-28 rounded-full flex items-center justify-center text-white shadow-xl transition-transform active:scale-95",
                    isRecording ? "bg-[#ff4d8b] hover:bg-[#e8447e]" : "hover:scale-105"
                  )}
                  style={!isRecording ? { backgroundColor: 'var(--bg-primary)', color: 'var(--text-on-primary)' } : undefined}
                >
                  <AnimatePresence mode="wait">
                    {isRecording ? (
                      <motion.div key="stop" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}><Square className="w-10 h-10 fill-current" /></motion.div>
                    ) : (
                      <motion.div key="mic" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}><Mic className="w-10 h-10" /></motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>

              <AnimatePresence>
                {isRecording && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1 h-10 mb-4">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <motion.div key={i} className="w-1.5 rounded-full" animate={{ scaleY: [0.2, 1, 0.3, 0.9, 0.2] }} transition={{ repeat: Infinity, duration: 0.8 + (i % 4) * 0.15, delay: i * 0.06, ease: 'easeInOut' }} style={{ height: '100%', transformOrigin: 'center', background: ['#ff4d8b','#b8a4ed','#ffb084','#a4d4c5','#e8b94a','#ff6b5a'][i % 6] }} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.h2 key={isRecording ? 'rec' : 'idle'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-xl font-medium mb-2" style={{ color: 'var(--text-ink)', letterSpacing: '-0.02em' }}>
                  {isRecording ? 'Merekam suara...' : 'Tekan untuk merekam'}
                </motion.h2>
              </AnimatePresence>
              <p className={cn("text-3xl font-medium tabular-nums transition-colors", isRecording ? "text-[#ff4d8b]" : "")} style={!isRecording ? { color: 'var(--text-muted)', letterSpacing: '-0.03em' } : { letterSpacing: '-0.03em' }}>
                00:{String(recordingTime).padStart(2, '0')}
              </p>
              {isRecording && <p className="text-xs font-medium text-[#ff4d8b] mt-2 opacity-80">Otomatis berhenti di 6 detik</p>}
            </>
          ) : (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} className="w-full flex flex-col items-center relative z-10">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }} className="w-24 h-24 bg-[#a4d4c5] text-[#1a3a3a] rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12" />
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl font-medium mb-2" style={{ color: 'var(--text-ink)', letterSpacing: '-0.02em' }}>
                Rekaman berhasil! 🎉
              </motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
                {recordingTime} detik terekam. Siap untuk dianalisis.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                <button onClick={() => { setAudioBlob(null); setRecordingTime(0); }} className="btn-secondary px-6 py-3">Rekam Ulang</button>
                <button onClick={handleAnalisa} className="btn-primary px-8 py-3 gap-2">
                  Mulai Analisis AI <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {micError && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-6 flex items-start gap-3 px-5 py-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-error-light)', border: '1px solid var(--border-error)' }}>
              <XCircle className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />
              <p className="text-sm font-medium flex-1" style={{ color: 'var(--text-error-strong)' }}>{micError}</p>
              <button onClick={() => setMicError(null)} style={{ color: 'var(--text-error-strong)' }}><XCircle className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center text-sm flex justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <AlertCircle className="w-4 h-4 opacity-70" />
          <p>Data audio tidak disimpan di server dan hanya diproses sementara.</p>
        </div>
      </div>
    </div>
  );
}
