import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Activity, Clock, ShieldAlert, ChevronRight, CheckCircle2, AlertCircle, Mic, TrendingUp, Zap } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { HistoryItemSkeleton, LatestResultSkeleton } from '../components/ui/SkeletonLoader';
import { ErrorState } from '../components/ui/ErrorState';

/* ── Animated count-up number ── */
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / 30;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.round(start));
    }, 24);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'screenings'),
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Baru Saja',
          risk: data.riskLevel,
          score: data.riskScore,
          insight: data.aiInsight || '',
          color: data.riskLevel === 'Low Risk' ? 'var(--color-success)' : data.riskLevel === 'Medium Risk' ? 'var(--color-warning)' : 'var(--color-error)',
          bg: data.riskLevel === 'Low Risk' ? 'var(--color-brand-mint)' : data.riskLevel === 'Medium Risk' ? '#e8b94a33' : '#ff4d8b33',
          barColor: data.riskLevel === 'Low Risk' ? 'var(--color-success)' : data.riskLevel === 'Medium Risk' ? 'var(--color-warning)' : 'var(--color-error)',
        };
      });
      setHistory(fetched);
    } catch (e: any) {
      console.error('Error fetching history:', e);
      if (e?.message?.includes('index')) {
        setError('Database memerlukan konfigurasi index. Buka Firebase Console → Firestore → Indexes.');
      } else {
        setError('Gagal memuat data screening. Periksa koneksi internet Anda.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  if (!user) return <Navigate to="/login" replace />;

  const latest = history.length > 0 ? history[0] : null;

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 24 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto w-full pb-20"
    >
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="mb-8">
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Selamat datang kembali 👋</p>
        <h1 className="text-xl md:text-3xl font-medium mb-1" style={{ color: 'var(--text-ink)', letterSpacing: '-0.025em' }}>{user.name}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Pantau perkembangan kesehatan paru-paru Anda melalui screening rutin.</p>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="mb-6">
          <ErrorState compact message={error} onRetry={fetchHistory} />
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left Column ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Hero Screening Card — Brand teal */}
          <motion.div
            variants={itemVariants}
            className="shimmer-card card-feature relative overflow-hidden flex flex-col justify-between min-h-[280px] group cursor-pointer"
            style={{ backgroundColor: 'var(--bg-brand-teal)', color: 'var(--text-on-brand-teal)' }}
            onClick={() => navigate('/dashboard/screening')}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-[#a4d4c5] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="relative z-10 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md mb-5">
                <Zap className="w-3.5 h-3.5 text-[#a4d4c5]" />
                <span className="text-xs font-medium">Berdasarkan Jadwal Mingguan</span>
              </div>
              <h2 className="text-3xl font-medium mb-3 leading-tight" style={{ letterSpacing: '-0.025em', color: 'inherit' }}>
                Waktunya screening<br />rutin Anda.
              </h2>
              <p className="max-w-md text-sm leading-relaxed" style={{ color: 'color-mix(in srgb, var(--text-on-brand-teal) 60%, transparent)' }}>
                Lakukan screening suara batuk setidaknya seminggu sekali untuk deteksi dini yang optimal.
              </p>
            </div>

            <div className="relative z-10 flex items-center justify-between border-t pt-5" style={{ borderColor: 'color-mix(in srgb, var(--text-on-brand-teal) 10%, transparent)' }}>
              <div className="btn-primary h-11 px-7 gap-2" style={{ backgroundColor: 'var(--text-on-brand-teal)', color: 'var(--bg-brand-teal)' }}>
                <Mic className="w-4 h-4" />
                Mulai Screening Baru
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
              <div className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all" style={{ borderColor: 'color-mix(in srgb, var(--text-on-brand-teal) 20%, transparent)', color: 'color-mix(in srgb, var(--text-on-brand-teal) 60%, transparent)' }}>
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </motion.div>

          {/* Education Cards */}
          <motion.div variants={itemVariants}>
            <h3 className="font-semibold text-base mb-3" style={{ color: 'var(--text-ink)' }}>Edukasi &amp; Tips</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: ShieldAlert, bg: 'var(--color-brand-lavender)',
                  title: 'Kenali Gejala TB',
                  desc: 'Batuk lebih dari 2 minggu berdahak, demam meriang, dan berat badan menurun drastis.',
                },
                {
                  icon: CheckCircle2, bg: 'var(--color-brand-mint)',
                  title: 'Pencegahan Penularan',
                  desc: 'Tutup mulut saat bersin atau batuk, pastikan ventilasi rumah baik, dan gunakan masker.',
                },
              ].map((card, i) => (
                <div key={i} className="card-feature group hover:scale-[1.02] transition-transform duration-200 cursor-default" style={{ backgroundColor: card.bg }}>
                  <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center text-[#0a0a0a] mb-3 transition-transform group-hover:scale-110 duration-200">
                    <card.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-[#0a0a0a] mb-1">{card.title}</h4>
                  <p className="text-sm text-[#0a0a0a]/70 line-clamp-2 leading-relaxed mb-3">{card.desc}</p>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      window.dispatchEvent(new CustomEvent('open-ai-chat', { 
                        detail: { message: `Tolong jelaskan lebih lanjut tentang: ${card.title}` } 
                      }));
                    }}
                    className="font-semibold text-sm text-[#0a0a0a] hover:underline underline-offset-2 mt-auto flex items-center gap-1 group/link"
                  >
                    Baca selengkapnya
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Right Sidebar ── */}
        <div className="flex flex-col gap-5">
          {/* Latest Result */}
          {isLoading ? (
            <LatestResultSkeleton />
          ) : (
            <motion.div
              variants={itemVariants}
              className="rounded-3xl p-6"
              style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-4 h-4" /> Hasil Terakhir
              </h3>
              {latest ? (
                <>
                  <div className="flex items-end gap-3 mb-3">
                    <span className="text-5xl font-medium tabular-nums" style={{ color: 'var(--text-ink)', letterSpacing: '-0.03em' }}>
                      <AnimatedNumber value={latest.score} />
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl" style={{ backgroundColor: latest.bg, color: latest.color }}>
                      {latest.risk}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full mb-5 overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
                    <motion.div
                      className="h-2 rounded-full"
                      style={{ backgroundColor: latest.barColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${latest.score}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                    />
                  </div>

                  <div className="text-[#0a0a0a] text-xs px-3 py-2.5 rounded-xl leading-relaxed flex gap-2" style={{ backgroundColor: latest.bg }}>
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      {latest.risk === 'Low Risk'
                        ? 'Kondisi paru-paru Anda saat ini terpantau baik. Tetap jaga pola hidup sehat.'
                        : latest.risk === 'Medium Risk'
                        ? 'Ada sedikit anomali. Perhatikan gejala lanjutan dan konsultasi jika perlu.'
                        : 'Risiko tinggi terdeteksi. Segera periksakan diri ke dokter spesialis paru.'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-sm py-6 text-center flex flex-col items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-card)' }}>
                    <Activity className="w-6 h-6" style={{ color: 'var(--text-dim)' }} />
                  </div>
                  Belum ada data screening.
                </div>
              )}
            </motion.div>
          )}

          {/* History List */}
          <motion.div
            variants={itemVariants}
            className="rounded-3xl p-6 flex-1"
            style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-ink)' }}>Riwayat Pengecekan</h3>
              <Link to="/dashboard/history" className="text-xs font-semibold hover:text-[#0a0a0a] transition-colors flex items-center gap-1 group/link" style={{ color: 'var(--text-muted)' }}>
                Lihat Semua
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <HistoryItemSkeleton key={i} />)
              ) : history.length === 0 ? (
                <div className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Belum ada riwayat.</div>
              ) : history.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => navigate('/dashboard/result', { state: { result: { riskLevel: item.risk, score: item.score, insight: item.insight } } })}
                  className="w-full text-left flex items-center justify-between py-3 border-b last:border-0 last:pb-0 group -mx-2 px-2 rounded-xl transition-colors"
                  style={{ borderColor: 'var(--border-soft)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div>
                    <p className="font-semibold text-xs mb-0.5" style={{ color: 'var(--text-ink)' }}>{item.date}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Skor AI: {item.score}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl transition-transform group-hover:scale-105" style={{ backgroundColor: item.bg, color: item.color }}>
                    {item.risk}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
