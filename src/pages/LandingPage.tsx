import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { Activity, Shield, Mic, CheckCircle2, Play, HeartPulse, ArrowRight, Zap, Users, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return { count, ref };
}

const RevealOnScroll: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <div ref={ref} className={className} style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(32px)', transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s` }}>
      {children}
    </div>
  );
};

const WAVE_COLORS = ['#ffb084','#b8a4ed','#ff4d8b','#a4d4c5','#e8b94a','#ff6b5a','#ffb084','#b8a4ed','#ff4d8b','#a4d4c5','#e8b94a','#ff6b5a','#ffb084','#b8a4ed','#a4d4c5'];

export default function LandingPage() {
  const { count: countCases, ref: refCases } = useCountUp(1060000, 2000);
  const { count: countRank, ref: refRank } = useCountUp(2, 600);
  const formatCases = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(2) + 'M' : n >= 1000 ? (n / 1000).toFixed(0) + 'K' : n.toString();

  return (
    <div className="flex flex-col w-full">
      {/* ══════════ HERO ══════════ */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden px-4">
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#ffb084] rounded-full blur-[140px] opacity-20 -z-10 animate-float-slow pointer-events-none" />
        <div className="absolute top-20 right-[-100px] w-[450px] h-[450px] bg-[#b8a4ed] rounded-full blur-[120px] opacity-15 -z-10 animate-float pointer-events-none" />
        <div className="absolute bottom-0 left-[-50px] w-[350px] h-[350px] bg-[#a4d4c5] rounded-full blur-[120px] opacity-20 -z-10 animate-float-delay pointer-events-none" />

        <div className="max-w-[1280px] mx-auto relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, type: 'spring', stiffness: 200 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ backgroundColor: 'var(--bg-card)' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-body)' }}>Didukung oleh AI Gemini</span>
                <Zap className="w-3.5 h-3.5 text-[#e8b94a]" />
              </motion.div>

              <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }} className="text-[clamp(36px,7vw,72px)] font-medium leading-[1] mb-6" style={{ letterSpacing: '-0.035em', color: 'var(--text-ink)' }}>
                {['Batuk', 'bisa', 'menjadi'].map((word, i) => (
                  <motion.span key={word} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }} className="inline-block mr-3 md:mr-4">{word}</motion.span>
                ))}
                <br />
                <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="inline-block text-[#ff4d8b]">tanda awal TB.</motion.span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="text-lg mb-10 max-w-lg leading-relaxed" style={{ color: 'var(--text-body)' }}>
                Screening awal risiko Tuberkulosis melalui analisis suara batuk menggunakan AI.
                <span className="font-semibold" style={{ color: 'var(--text-ink)' }}> Cepat, aman,</span> dan dapat dilakukan dari rumah Anda.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="flex flex-col sm:flex-row items-start gap-3">
                <Link to="/screening" className="btn-primary w-full sm:w-auto h-12 px-8 text-base gap-2.5"><Mic className="w-5 h-5" /> Mulai Screening</Link>
                <button onClick={() => document.getElementById('cara-kerja')?.scrollIntoView({ behavior: 'smooth' })} className="btn-secondary w-full sm:w-auto h-12 px-8 text-base gap-2.5"><Play className="w-5 h-5" /> Lihat Cara Kerja</button>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-8 flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                <div className="flex -space-x-2">
                  {['#ff4d8b','#b8a4ed','#e8b94a','#a4d4c5'].map((c, i) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold" style={{ background: c, borderColor: 'var(--bg-canvas)' }}>{String.fromCharCode(65 + i)}</div>
                  ))}
                </div>
                <span><strong style={{ color: 'var(--text-ink)' }}>500+</strong> pengguna telah melakukan screening</span>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.7, type: 'spring', stiffness: 80 }} className="lg:col-span-5">
              <div className="aspect-square rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: 'var(--bg-soft)' }}>
                <div className="absolute inset-0 pointer-events-none" style={{ opacity: 'var(--dot-opacity)', backgroundImage: 'radial-gradient(circle, var(--text-ink) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <div className="relative w-24 h-24 md:w-28 md:h-28 mb-8 z-10">
                  <div className="absolute inset-0 rounded-full bg-[#ff4d8b] opacity-20 animate-pulse-ring" />
                  <div className="absolute inset-0 rounded-full bg-[#ff4d8b] opacity-10" style={{ animation: 'pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite', animationDelay: '0.5s' }} />
                  <div className="absolute inset-0 rounded-full flex items-center justify-center shadow-xl z-10" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-on-primary)' }}>
                    <Mic className="w-10 h-10 md:w-12 md:h-12" />
                  </div>
                </div>
                <div className="flex items-center gap-1 h-10 md:h-12 overflow-hidden px-2 z-10">
                  {WAVE_COLORS.map((color, i) => (
                    <motion.div key={i} animate={{ scaleY: [0.2, 1, 0.4, 0.9, 0.2] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.07, ease: 'easeInOut' }} className="w-1.5 md:w-2 rounded-full origin-bottom" style={{ background: color, height: '100%' }} />
                  ))}
                </div>
                <p className="mt-4 font-medium text-sm text-center z-10" style={{ color: 'var(--text-muted)' }}>Visualisasi Analisis Suara Batuk</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section className="py-24" style={{ backgroundColor: 'var(--bg-canvas)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <RevealOnScroll>
              <h2 className="text-[clamp(28px,4vw,40px)] font-medium mb-6 leading-[1.1]" style={{ color: 'var(--text-ink)', letterSpacing: '-0.025em' }}>
                Mengapa deteksi dini <span className="text-[#ff4d8b]">sangat penting?</span>
              </h2>
              <p className="text-lg mb-8 leading-relaxed" style={{ color: 'var(--text-body)' }}>Indonesia adalah salah satu negara dengan beban Tuberkulosis tertinggi di dunia. Banyak penderita tidak menyadari gejalanya hingga kondisi memburuk.</p>
              <ul className="space-y-4">
                {["Batuk kronis sering dianggap sebagai 'batuk biasa' dan diabaikan.", "Deteksi dini meningkatkan tingkat keberhasilan pengobatan secara drastis.", "Satu penderita TB yang tidak diobati dapat menularkan hingga 15 orang dalam setahun."].map((text, i) => (
                  <RevealOnScroll key={i} delay={i * 0.12}>
                    <li className="flex items-start gap-4 group">
                      <div className="mt-0.5 w-6 h-6 rounded-full bg-[#a4d4c5] flex items-center justify-center shrink-0"><CheckCircle2 className="w-3.5 h-3.5 text-[#1a3a3a]" /></div>
                      <span className="leading-relaxed" style={{ color: 'var(--text-body)' }}>{text}</span>
                    </li>
                  </RevealOnScroll>
                ))}
              </ul>
            </RevealOnScroll>
            <div className="grid grid-cols-2 gap-4">
              <RevealOnScroll delay={0.1}>
                <div className="card-feature bg-[#b8a4ed] text-[#0a0a0a] hover:scale-[1.02] transition-transform duration-300 cursor-default">
                  <Activity className="w-10 h-10 mb-4 opacity-70" />
                  <div className="text-4xl font-medium mb-2 tabular-nums" style={{ letterSpacing: '-0.03em' }}>Ke-<span ref={refRank}>{countRank}</span></div>
                  <div className="text-sm font-medium leading-snug opacity-80">Beban TB Tertinggi di Dunia (WHO 2022)</div>
                </div>
              </RevealOnScroll>
              <RevealOnScroll delay={0.2}>
                <div className="card-feature bg-[#ff4d8b] text-white hover:scale-[1.02] transition-transform duration-300 cursor-default mt-8">
                  <HeartPulse className="w-10 h-10 mb-4 opacity-80" />
                  <div className="text-4xl font-medium mb-2 tabular-nums" style={{ letterSpacing: '-0.03em' }}><span ref={refCases}>{formatCases(countCases)}</span></div>
                  <div className="text-sm font-medium leading-snug opacity-80">Estimasi Kasus Baru TB per Tahun</div>
                </div>
              </RevealOnScroll>
              <RevealOnScroll delay={0.25} className="col-span-2">
                <div className="card-feature bg-[#1a3a3a] text-white hover:scale-[1.02] transition-transform duration-300 cursor-default flex items-center gap-5 !py-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#a4d4c5] flex items-center justify-center shrink-0"><Users className="w-7 h-7 text-[#1a3a3a]" /></div>
                  <div>
                    <div className="text-3xl font-medium" style={{ letterSpacing: '-0.03em' }}>94%</div>
                    <div className="text-sm font-medium opacity-70">Tingkat kesembuhan jika terdeteksi dini & diobati</div>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="cara-kerja" className="py-24 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-soft)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <RevealOnScroll>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ backgroundColor: 'var(--bg-card)' }}>
              <Star className="w-4 h-4 text-[#e8b94a]" />
              <span className="text-sm font-medium" style={{ color: 'var(--text-body)' }}>Mudah & Cepat</span>
            </div>
            <h2 className="text-[clamp(28px,4vw,40px)] font-medium mb-4" style={{ color: 'var(--text-ink)', letterSpacing: '-0.025em' }}>Cara kerja screening AI</h2>
            <p className="max-w-xl mx-auto mb-16" style={{ color: 'var(--text-muted)' }}>Hanya butuh 3 langkah sederhana untuk mendapatkan hasil analisis risiko dari AI kami.</p>
          </RevealOnScroll>
          <div className="grid md:grid-cols-3 gap-6 relative z-10">
            {[
              { icon: Mic, title: 'Rekam Batuk', description: 'Dekatkan smartphone dan rekam suara batuk alami selama 3–6 detik di tempat tenang.', bg: '#ffb084' },
              { icon: Activity, title: 'AI Menganalisis', description: 'Gemini AI menganalisis frekuensi & pola akustik batuk Anda secara instan dan akurat.', bg: '#b8a4ed' },
              { icon: Shield, title: 'Dapat Insight', description: 'Terima skor risiko, rekomendasi, dan langkah selanjutnya yang tepat untuk kesehatan Anda.', bg: '#a4d4c5' },
            ].map((step, i) => (
              <RevealOnScroll key={i} delay={i * 0.15}>
                <div className="card-feature flex flex-col items-center text-center hover:scale-[1.02] transition-transform duration-300 cursor-default relative text-[#0a0a0a]" style={{ backgroundColor: step.bg }}>
                  <div className="w-16 h-16 rounded-2xl bg-white/30 flex items-center justify-center mb-6 relative">
                    <step.icon className="w-8 h-8" />
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#0a0a0a] flex items-center justify-center font-bold text-white text-xs">{i + 1}</div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3" style={{ letterSpacing: '-0.01em' }}>{step.title}</h3>
                  <p className="leading-relaxed text-sm opacity-80">{step.description}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="py-24 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-canvas)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="rounded-3xl p-12 md:p-20 text-center relative overflow-hidden" style={{ backgroundColor: 'var(--bg-soft)' }}>
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#ffb084] rounded-full blur-[120px] opacity-15 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#b8a4ed] rounded-full blur-[120px] opacity-15 -translate-x-1/3 translate-y-1/3 pointer-events-none" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ backgroundColor: 'var(--bg-card)' }}>
                  <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-body)' }}>Gratis & Tanpa Login untuk Mulai</span>
                </div>
                <h2 className="text-[clamp(28px,5vw,40px)] font-medium mb-6 leading-[1.1]" style={{ color: 'var(--text-ink)', letterSpacing: '-0.025em' }}>
                  Kesehatan paru-paru Anda <span className="text-[#ff4d8b]">sangat berharga.</span>
                </h2>
                <p className="text-lg mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-body)' }}>Jangan abaikan batuk yang tidak kunjung sembuh. Lakukan screening awal sekarang untuk ketenangan pikiran Anda.</p>
                <Link to="/screening" className="btn-primary h-14 px-10 text-base gap-3">Mulai Screening Sekarang <ArrowRight className="w-5 h-5" /></Link>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
