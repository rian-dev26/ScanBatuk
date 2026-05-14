import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ChevronRight, AlertCircle, Filter, ArrowLeft } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { HistoryItemSkeleton } from '../components/ui/SkeletonLoader';
import { ErrorState } from '../components/ui/ErrorState';

interface ScreeningRecord {
  id: string;
  date: string;
  risk: string;
  score: number;
  insight: string;
  color: string;
  bg: string;
}

const PAGE_SIZE = 10;

function getRiskStyles(riskLevel: string) {
  if (riskLevel === 'Low Risk') return { color: 'var(--color-success)', bg: 'var(--color-brand-mint)' };
  if (riskLevel === 'Medium Risk') return { color: 'var(--color-warning)', bg: '#e8b94a33' };
  return { color: 'var(--color-error)', bg: '#ff4d8b33' };
}

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<ScreeningRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterRisk, setFilterRisk] = useState<string>('all');

  const fetchRecords = useCallback(async (isLoadMore = false) => {
    if (!user) return;
    
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      let q = query(
        collection(db, 'screenings'),
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      if (isLoadMore && lastDoc) {
        q = query(
          collection(db, 'screenings'),
          where('userId', '==', user.id),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      const fetched: ScreeningRecord[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const styles = getRiskStyles(data.riskLevel);
        return {
          id: doc.id,
          date: data.createdAt
            ? new Date(data.createdAt.toMillis()).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })
            : 'Baru Saja',
          risk: data.riskLevel,
          score: data.riskScore,
          insight: data.aiInsight || '',
          ...styles,
        };
      });

      if (isLoadMore) {
        setRecords(prev => [...prev, ...fetched]);
      } else {
        setRecords(fetched);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (e: any) {
      console.error('Error fetching history:', e);
      setError('Gagal memuat riwayat screening. Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [user, lastDoc]);

  useEffect(() => {
    fetchRecords();
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const filteredRecords = filterRisk === 'all'
    ? records
    : records.filter(r => r.risk === filterRisk);

  return (
    <div className="max-w-4xl mx-auto w-full pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-medium mb-2" style={{ color: 'var(--text-ink)', letterSpacing: '-0.025em' }}>Riwayat Screening</h1>
        <p style={{ color: 'var(--text-muted)' }}>Semua hasil screening ScanBatuk Anda, dari yang terbaru.</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
        {['all', 'Low Risk', 'Medium Risk', 'High Risk'].map((filter) => (
          <button
            key={filter}
            onClick={() => setFilterRisk(filter)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200`}
            style={
              filterRisk === filter
                ? { backgroundColor: 'var(--bg-primary)', color: 'var(--text-on-primary)', border: '1px solid transparent' }
                : { backgroundColor: 'var(--bg-canvas)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
            }
          >
            {filter === 'all' ? 'Semua' : filter}
          </button>
        ))}
      </div>

      {/* Content */}
      {error ? (
        <ErrorState message={error} onRetry={() => fetchRecords()} />
      ) : isLoading ? (
        <div className="rounded-3xl p-6 space-y-4" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <HistoryItemSkeleton key={i} />
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-12 text-center"
          style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--bg-card)' }}>
            <Clock className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-ink)' }}>
            {filterRisk !== 'all' ? `Tidak ada hasil ${filterRisk}` : 'Belum ada riwayat'}
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {filterRisk !== 'all'
              ? 'Coba filter lain atau lakukan screening baru.'
              : 'Mulai screening pertama Anda untuk melihat riwayat di sini.'
            }
          </p>
          <Link
            to="/dashboard/screening"
            className="btn-primary h-11 px-6 gap-2 inline-flex"
          >
            Mulai Screening
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredRecords.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <button
                  onClick={() => navigate('/dashboard/result', {
                    state: {
                      result: {
                        riskLevel: item.risk,
                        score: item.score,
                        insight: item.insight
                      }
                    }
                  })}
                  className="w-full text-left rounded-2xl p-5 transition-all flex items-start justify-between gap-4 group"
                  style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-canvas)'}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-xl" style={{ backgroundColor: item.bg, color: item.color }}>
                        {item.risk}
                      </span>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-ink)' }}>Skor: {item.score}</span>
                    </div>
                    <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.insight}</p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end justify-between h-full">
                    <p className="text-xs whitespace-nowrap mb-2" style={{ color: 'var(--text-muted)' }}>{item.date}</p>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors mt-auto" style={{ backgroundColor: 'var(--bg-card)' }}>
                      <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-dim)' }} />
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchRecords(true)}
                disabled={loadingMore}
                className="btn-secondary px-6 py-3 disabled:opacity-50"
              >
                {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
