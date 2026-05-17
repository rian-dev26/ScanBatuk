import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Users, Activity, FileWarning, TrendingUp, BarChart3, ChevronDown, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { collection, getDocs, getCountFromServer, query, orderBy, where, Timestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { StatCardSkeleton, ChartBarSkeleton, TableRowSkeleton } from '../components/ui/SkeletonLoader';
import { ErrorState } from '../components/ui/ErrorState';

type TimeRange = '7d' | '30d' | 'all';
interface DailyData { date: string; count: number; label: string; }
interface RecentScreening { id: string; userId: string; riskLevel: string; riskScore: number; date: string; }

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalScreenings: 0, totalUsers: 0, lowRisk: 0, mediumRisk: 0, highRisk: 0, chatSessions: 0 });
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [allScreenings, setAllScreenings] = useState<RecentScreening[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const timeLabels: Record<TimeRange, string> = { '7d': '7 Hari Terakhir', '30d': '30 Hari Terakhir', 'all': 'Semua Waktu' };

  const fetchData = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setIsLoading(true); setError(null);
    try {
      const [uSnap, cSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'))),
        getCountFromServer(query(collection(db, 'chat_sessions'))),
      ]);
      const totalUsers = uSnap.size;
      const chatSessions = cSnap.data().count;

      const userNames = new Map<string, string>();
      uSnap.forEach(doc => {
        if (doc.data().name) {
          userNames.set(doc.id, doc.data().name);
        }
      });

      const now = new Date();
      let startDate: Date | null = null;
      if (timeRange === '7d') startDate = new Date(now.getTime() - 7*24*60*60*1000);
      else if (timeRange === '30d') startDate = new Date(now.getTime() - 30*24*60*60*1000);

      const screenQ = startDate
        ? query(collection(db, 'screenings'), where('createdAt', '>=', Timestamp.fromDate(startDate)), orderBy('createdAt', 'desc'))
        : query(collection(db, 'screenings'), orderBy('createdAt', 'desc'));
      const screenSnap = await getDocs(screenQ);
      const all = screenSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      const totalScreenings = all.length;
      const lowRisk = all.filter(s => s.riskLevel === 'Low Risk').length;
      const mediumRisk = all.filter(s => s.riskLevel === 'Medium Risk').length;
      const highRisk = all.filter(s => s.riskLevel === 'High Risk').length;
      setStats({ totalScreenings, totalUsers, lowRisk, mediumRisk, highRisk, chatSessions });

      // Build daily chart
      const dailyMap = new Map<string, number>();
      const days = timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 14;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i*24*60*60*1000);
        dailyMap.set(d.toISOString().split('T')[0], 0);
      }
      all.forEach((s: any) => {
        if (s.createdAt) {
          const dt = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt.seconds * 1000);
          const key = dt.toISOString().split('T')[0];
          if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
        }
      });
      setDailyData(Array.from(dailyMap.entries()).map(([ds, c]) => ({
        date: ds, count: c, label: new Date(ds).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      })));

      setAllScreenings(all.map((s: any) => {
        const userName = userNames.get(s.userId);
        return {
          id: s.id,
          userId: userName ? userName : (s.userId ? `${s.userId.slice(0, 6)}...` : 'N/A'),
          riskLevel: s.riskLevel || 'Unknown',
          riskScore: s.riskScore || 0,
          date: s.createdAt ? (s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt.seconds * 1000)).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
        };
      }));
    } catch (err: any) {
      console.error("Error fetching admin data:", err);
      if (err?.message?.includes('index')) {
        setError('Database memerlukan konfigurasi index. Buka Firebase Console → Firestore → Indexes, dan buat composite index: screenings (createdAt DESC). Lihat console browser untuk link langsung.');
      } else {
        setError('Gagal memuat data admin. Periksa koneksi dan pastikan Anda memiliki akses admin.');
      }
    } finally { setIsLoading(false); }
  }, [user, timeRange]);

  useEffect(() => { fetchData(); setCurrentPage(1); }, [fetchData]);

  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const maxChart = Math.max(...dailyData.map(d => d.count), 1);
  const riskStyles: Record<string, { t: string; b: string }> = {
    'Low Risk': { t: 'var(--color-success)', b: '#F0FDF4' },
    'Medium Risk': { t: 'var(--color-warning)', b: '#FFFBEB' },
    'High Risk': { t: 'var(--color-error)', b: '#FEF2F2' },
  };

  const filteredScreenings = allScreenings.filter(s => 
    s.userId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.riskLevel.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.date.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.max(1, Math.ceil(filteredScreenings.length / itemsPerPage));
  const currentScreenings = filteredScreenings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto w-full pb-20">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium mb-2" style={{ color: 'var(--text-ink)', letterSpacing: '-0.025em' }}>Admin analytics dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Ringkasan metrik penggunaan platform ScanBatuk.</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowTimeMenu(!showTimeMenu)} className="btn-secondary gap-2">
            {timeLabels[timeRange]} <ChevronDown className={`w-4 h-4 transition-transform ${showTimeMenu ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
          </button>
          {showTimeMenu && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 mt-2 rounded-xl shadow-lg overflow-hidden z-20 min-w-[180px]" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}>
              {(Object.keys(timeLabels) as TimeRange[]).map(k => (
                <button key={k} onClick={() => { setTimeRange(k); setShowTimeMenu(false); }} className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors`} style={timeRange === k ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-ink)' } : { color: 'var(--text-muted)' }} onMouseEnter={e => { if (timeRange !== k) { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-ink)'; } }} onMouseLeave={e => { if (timeRange !== k) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}>{timeLabels[k]}</button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {error ? <ErrorState message={error} onRetry={fetchData} /> : (<>
        {/* Stats — Saturated brand color cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />) : [
            { label: 'Total Screening', value: stats.totalScreenings, icon: Activity, cardBg: '#DCFCE7' },
            { label: 'Total Pengguna', value: stats.totalUsers, icon: Users, cardBg: '#F0FDF4' },
            { label: 'High Risk', value: stats.highRisk, icon: FileWarning, cardBg: '#FEF2F2' },
            { label: 'Sesi Chatbot', value: stats.chatSessions, icon: TrendingUp, cardBg: '#DCFCE7' },
          ].map((stat, i) => (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i}
              className="card-feature flex flex-col"
              style={{ backgroundColor: stat.cardBg, border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center" style={{ color: '#0a0a0a' }}><stat.icon className="w-5 h-5" /></div>
              </div>
              <div className="mt-auto">
                <p className="text-sm font-medium mb-1" style={{ color: '#0a0a0a', opacity: 0.8 }}>{stat.label}</p>
                <h3 className="text-2xl font-medium" style={{ letterSpacing: '-0.03em', color: '#0a0a0a' }}>{stat.value}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Chart + Distribution */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="rounded-3xl p-6 lg:col-span-2" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-ink)' }}><BarChart3 className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /> Tren Screening Harian</h3>
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{timeLabels[timeRange]}</span>
            </div>
            {isLoading ? <ChartBarSkeleton /> : dailyData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>Belum ada data.</div>
            ) : (<>
              <div className="h-64 w-full flex items-end justify-between gap-1.5 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                {dailyData.map((d, i) => {
                  const pct = (d.count / maxChart) * 100;
                  return (
                    <motion.div key={d.date} initial={{ height: 0 }} animate={{ height: `${Math.max(pct, 3)}%` }} transition={{ duration: 0.8, delay: i * 0.03 }}
                      className="w-full rounded-t-sm transition-colors relative group cursor-pointer min-h-[3px]" style={{ backgroundColor: 'var(--text-ink)' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.8'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-opacity shadow-lg z-10" style={{ backgroundColor: 'var(--text-ink)', color: 'var(--bg-canvas)' }}>
                        {d.count} screening
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: 'var(--text-ink)' }} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                <span>{dailyData[0]?.label}</span>
                <span>{dailyData[dailyData.length - 1]?.label}</span>
              </div>
            </>)}
          </div>

          <div className="rounded-3xl p-6" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}>
            <h3 className="font-semibold mb-6" style={{ color: 'var(--text-ink)' }}>Distribusi Risiko</h3>
            <div className="space-y-6">
              {[
                { label: 'Low Risk', value: stats.totalScreenings ? Math.round((stats.lowRisk / stats.totalScreenings) * 100) : 0, color: 'var(--color-success)', count: stats.lowRisk },
                { label: 'Medium Risk', value: stats.totalScreenings ? Math.round((stats.mediumRisk / stats.totalScreenings) * 100) : 0, color: 'var(--color-warning)', count: stats.mediumRisk },
                { label: 'High Risk', value: stats.totalScreenings ? Math.round((stats.highRisk / stats.totalScreenings) * 100) : 0, color: 'var(--color-error)', count: stats.highRisk },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <span className="font-bold" style={{ color: 'var(--text-ink)' }}>{item.count} ({item.value}%)</span>
                  </div>
                  <div className="w-full rounded-full h-2.5" style={{ backgroundColor: 'var(--bg-card)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 1, delay: 0.5 }} className={`h-2.5 rounded-full`} style={{ backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              Total: <span className="font-bold" style={{ color: 'var(--text-ink)' }}>{stats.totalScreenings}</span> screening
            </div>
          </div>
        </div>

        {/* All Screenings Table */}
        <div className="rounded-3xl p-6" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-ink)' }}><Clock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /> Daftar Screening</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Cari nama, risiko, tanggal..." 
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none transition-colors"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-ink)' }}
              />
            </div>
          </div>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider px-6 py-3" style={{ color: 'var(--text-muted)' }}>Tanggal</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3" style={{ color: 'var(--text-muted)' }}>Pengguna</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3" style={{ color: 'var(--text-muted)' }}>Skor</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider px-4 py-3" style={{ color: 'var(--text-muted)' }}>Risiko</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? Array.from({ length: Math.min(5, itemsPerPage) }).map((_, i) => <TableRowSkeleton key={i} cols={4} />) : filteredScreenings.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Tidak ada data yang cocok dengan pencarian Anda.</td></tr>
                ) : currentScreenings.map((s, i) => {
                  const rs = riskStyles[s.riskLevel] || { t: 'var(--text-muted)', b: 'var(--bg-card)' };
                  return (
                    <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b last:border-0 transition-colors" style={{ borderColor: 'var(--border-soft)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td className="px-6 py-3.5 text-sm font-medium whitespace-nowrap" style={{ color: 'var(--text-ink)' }}>{s.date}</td>
                      <td className="px-4 py-3.5 text-sm font-medium" style={{ color: 'var(--text-ink)' }}>{s.userId}</td>
                      <td className="px-4 py-3.5 text-sm font-bold" style={{ color: 'var(--text-ink)' }}>{s.riskScore}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap"><span className={`text-xs font-semibold px-2.5 py-1 rounded-xl`} style={{ backgroundColor: rs.b, color: rs.t }}>{s.riskLevel}</span></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-ink)' }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-ink)' }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </>)}
    </div>
  );
}
