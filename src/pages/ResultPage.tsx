import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Activity, MapPin, Mic, Info, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

function useCountUp(target: number, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let s = 0;
      const step = target / 40;
      const timer = setInterval(() => {
        s += step;
        if (s >= target) { setVal(target); clearInterval(timer); }
        else setVal(Math.round(s));
      }, 24);
      return () => clearInterval(timer);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return val;
}

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const screeningPath = isDashboard ? '/dashboard/screening' : '/screening';
  const nearbyPath = isDashboard ? '/dashboard/nearby' : '/login';
  
  const result = location.state?.result;
  
  if (!result) {
    return <Navigate to={isDashboard ? '/dashboard/screening' : '/screening'} replace />;
  }

  const { riskLevel, score, insight } = result;
  const animatedScore = useCountUp(score, 400);

  let riskColor = "var(--color-success)";
  let riskBg = "var(--color-brand-mint)";
  let gaugeColor = "var(--color-success)";
  let riskBgStyle = { backgroundColor: 'var(--color-brand-mint)' };
  
  if (riskLevel === 'Medium Risk') {
    riskColor = "var(--color-warning)";
    riskBg = "var(--color-brand-ochre)";
    gaugeColor = "var(--color-warning)";
    riskBgStyle = { backgroundColor: 'var(--color-brand-ochre)' };
  } else if (riskLevel === 'High Risk') {
    riskColor = "var(--color-error)";
    riskBg = "var(--color-brand-pink)";
    gaugeColor = "var(--color-error)";
    riskBgStyle = { backgroundColor: 'var(--color-brand-pink)' };
  }

  return (
    <div className="flex-1 flex flex-col py-8 px-4" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      <div className="max-w-3xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
           <h1 className="text-2xl md:text-3xl font-medium" style={{ color: 'var(--text-ink)', letterSpacing: '-0.025em' }}>Hasil Screening</h1>
           {user?.email === 'guest@anonymous' && (
             <Link to="/login" state={{ pendingResult: result }} className="btn-secondary h-9 px-5 text-sm">
               Simpan Permanen
             </Link>
           )}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="col-span-1 rounded-3xl p-8 flex flex-col items-center justify-center text-center"
            style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-medium text-sm uppercase tracking-wider mb-6" style={{ color: 'var(--text-muted)' }}>Tingkat Risiko Terdeteksi</h2>
            <div className="relative w-48 h-48 mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--bg-card)" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="40" fill="transparent" stroke={gaugeColor} strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                  animate={{ strokeDashoffset: (2 * Math.PI * 40) - ((score / 100) * (2 * Math.PI * 40)) }}
                  transition={{ duration: 1.8, ease: [0.34, 1.56, 0.64, 1] }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-medium tabular-nums" style={{ color: 'var(--text-ink)', letterSpacing: '-0.03em' }}>{animatedScore}</span>
                <span className="text-xs uppercase font-medium tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>Skor AI</span>
              </div>
            </div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12, delay: 0.6 }}
              className="px-6 py-2.5 rounded-xl font-semibold text-lg mb-2 text-[#0a0a0a]"
              style={riskBgStyle}
            >
              {riskLevel}
            </motion.div>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Berdasarkan analisis akustik suara batuk.</p>
          </motion.div>

          <div className="col-span-1 flex flex-col gap-6">
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl p-6"
                style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}
             >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-on-primary)' }}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-ink)' }}>AI Insight</h3>
                </div>
                <p className="leading-relaxed" style={{ color: 'var(--text-body)' }}>{insight}</p>
             </motion.div>

             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-3xl p-2 flex flex-col gap-2"
                style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}
             >
                <button onClick={() => navigate(nearbyPath)} className="w-full flex items-center justify-between p-4 rounded-2xl transition-colors text-left group" onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[#1a3a3a]" style={{ backgroundColor: 'var(--color-brand-mint)' }}>
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text-ink)' }}>Cari Faskes Terdekat</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Temukan klinik atau rumah sakit</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-dim)' }} />
                </button>
                <button onClick={() => navigate(screeningPath)} className="w-full flex items-center justify-between p-4 rounded-2xl transition-colors text-left group" onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl border flex items-center justify-center" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text-ink)' }}>Skrining Ulang</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Ambil rekaman suara baru</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-dim)' }} />
                </button>
             </motion.div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex gap-4 !p-6 rounded-3xl"
          style={{ backgroundColor: 'var(--bg-soft)' }}
        >
          <Info className="w-6 h-6 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <div className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
            <strong style={{ color: 'var(--text-ink)' }}>Penting:</strong> Platform ScanBatuk menggunakan kecerdasan buatan untuk menganalisis karakteristik audio. Hasil ini <strong>bukan merupakan diagnosis medis</strong>. Kami sangat menyarankan agar Anda mengunjungi fasilitas layanan kesehatan terdekat untuk mendapatkan pemeriksaan medis yang komprehensif.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
