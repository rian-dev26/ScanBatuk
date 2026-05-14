import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, Mail, Shield, Activity, ArrowLeft, LogOut } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Skeleton } from '../components/ui/SkeletonLoader';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ screenings: 0, chats: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      try {
        const screenQ = query(collection(db, 'screenings'), where('userId', '==', user.id));
        const chatQ = query(collection(db, 'chat_sessions'), where('userId', '==', user.id));

        const [screenSnap, chatSnap] = await Promise.all([
          getCountFromServer(screenQ),
          getCountFromServer(chatQ),
        ]);

        setStats({
          screenings: screenSnap.data().count,
          chats: chatSnap.data().count,
        });
      } catch (e) {
        console.error('Error fetching profile stats:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  const initials = user.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto w-full pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-medium" style={{ color: 'var(--text-ink)', letterSpacing: '-0.025em' }}>Profil Saya</h1>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl mb-6"
        style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}
      >
        {/* Banner — brand teal */}
        <div className="h-36 relative rounded-t-3xl overflow-hidden" style={{ backgroundColor: 'var(--bg-brand-teal)' }}>
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#a4d4c5] opacity-15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-[#b8a4ed] opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>

        {/* Avatar + Info */}
        <div className="px-6 pb-6">
          <div className="-mt-14 mb-5 relative z-10">
            <div className="w-28 h-28 rounded-full flex items-center justify-center text-white text-3xl font-medium border-4 shadow-xl" style={{ backgroundColor: 'var(--bg-brand-teal)', borderColor: 'var(--bg-canvas)', letterSpacing: '-0.03em' }}>
              {initials}
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-ink)' }}>{user.name}</h2>
          <div className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            <Mail className="w-4 h-4" />
            <span>{user.email}</span>
          </div>

          {user.role === 'admin' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--bg-brand-teal)', color: 'var(--text-on-brand-teal)' }}>
              <Shield className="w-3.5 h-3.5" />
              Administrator
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-4 mb-6"
      >
        <div className="card-feature text-[#0a0a0a] text-center !p-5" style={{ backgroundColor: 'var(--color-brand-lavender)' }}>
          <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center mx-auto mb-3">
            <Activity className="w-5 h-5" />
          </div>
          {isLoading ? (
            <Skeleton className="w-10 h-8 rounded-md mx-auto mb-1" />
          ) : (
            <div className="text-2xl font-medium mb-1" style={{ letterSpacing: '-0.03em' }}>{stats.screenings}</div>
          )}
          <div className="text-sm font-medium opacity-70">Total Screening</div>
        </div>
        <div className="card-feature text-[#0a0a0a] text-center !p-5" style={{ backgroundColor: 'var(--color-brand-peach)' }}>
          <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center mx-auto mb-3">
            <UserIcon className="w-5 h-5" />
          </div>
          {isLoading ? (
            <Skeleton className="w-10 h-8 rounded-md mx-auto mb-1" />
          ) : (
            <div className="text-2xl font-medium mb-1" style={{ letterSpacing: '-0.03em' }}>{stats.chats}</div>
          )}
          <div className="text-sm font-medium opacity-70">Sesi Chatbot</div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-3xl p-2"
        style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}
      >
        <Link
          to="/dashboard/screening"
          className="w-full flex items-center justify-between p-4 rounded-2xl transition-colors text-left group"
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[#1a3a3a]" style={{ backgroundColor: 'var(--color-brand-mint)' }}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium" style={{ color: 'var(--text-ink)' }}>Mulai Screening Baru</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Rekam dan analisis suara batuk</div>
            </div>
          </div>
        </Link>

        <div className="border-t mx-4" style={{ borderColor: 'var(--border)' }} />

        <button
          onClick={async () => {
            await logout();
            navigate('/');
          }}
          className="w-full flex items-center justify-between p-4 rounded-2xl transition-colors text-left group hover:bg-[#ef4444]/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#ef4444]/10 flex items-center justify-center text-[#ef4444]">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium text-[#ef4444]">Keluar</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Logout dari akun Anda</div>
            </div>
          </div>
        </button>
      </motion.div>
    </div>
  );
}
