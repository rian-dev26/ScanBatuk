import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Mail, Shield, Activity, LogOut } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Skeleton } from '../components/ui/SkeletonLoader';

import { doc, updateDoc } from 'firebase/firestore';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ screenings: 0, chats: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [age, setAge] = useState<number | ''>(user?.age || '');
  const [isSmoker, setIsSmoker] = useState<boolean>(user?.isSmoker || false);
  const [coughDurationDays, setCoughDurationDays] = useState<number | ''>(user?.coughDurationDays || '');
  const [symptoms, setSymptoms] = useState<string>(user?.symptoms || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

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

  const handleSaveMedicalData = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        age: age === '' ? null : Number(age),
        isSmoker,
        coughDurationDays: coughDurationDays === '' ? null : Number(coughDurationDays),
        symptoms
      });
      // Update local user context if possible, but Firestore is the source of truth
      user.age = age === '' ? undefined : Number(age);
      user.isSmoker = isSmoker;
      user.coughDurationDays = coughDurationDays === '' ? undefined : Number(coughDurationDays);
      user.symptoms = symptoms;
      setSaveMessage('Data medis berhasil disimpan!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      console.error(e);
      setSaveMessage('Gagal menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

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
        {/* Bug #4: Responsive font size — lebih kecil di mobile */}
        <h1 className="text-xl md:text-3xl font-medium" style={{ color: 'var(--text-ink)', letterSpacing: '-0.025em' }}>Profil Saya</h1>
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
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#22C55E] opacity-[0.08] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-[#16A34A] opacity-[0.06] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
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
        <div className="card-feature text-center !p-5" style={{ backgroundColor: '#F0FDF4', color: '#0a0a0a', border: '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-xl bg-[#16A34A]/10 flex items-center justify-center mx-auto mb-3" style={{ color: '#16A34A' }}>
            <Activity className="w-5 h-5" />
          </div>
          {isLoading ? (
            <Skeleton className="w-10 h-8 rounded-md mx-auto mb-1" />
          ) : (
            <div className="text-2xl font-medium mb-1" style={{ letterSpacing: '-0.03em' }}>{stats.screenings}</div>
          )}
          <div className="text-sm font-medium opacity-80">Total Screening</div>
        </div>
        <div className="card-feature text-center !p-5" style={{ backgroundColor: '#DCFCE7', color: '#0a0a0a', border: '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-xl bg-[#16A34A]/10 flex items-center justify-center mx-auto mb-3" style={{ color: '#16A34A' }}>
            <UserIcon className="w-5 h-5" />
          </div>
          {isLoading ? (
            <Skeleton className="w-10 h-8 rounded-md mx-auto mb-1" />
          ) : (
            <div className="text-2xl font-medium mb-1" style={{ letterSpacing: '-0.03em' }}>{stats.chats}</div>
          )}
          <div className="text-sm font-medium opacity-80">Sesi Chatbot</div>
        </div>
      </motion.div>

      {/* Medical Context Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-3xl p-6 mb-6"
        style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-ink)' }}>Konteks Medis (Untuk Akurasi AI)</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Lengkapi data ini agar AI dapat menganalisis batuk Anda dengan lebih akurat.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-ink)' }}>Umur</label>
            <input type="number" value={age} onChange={e => setAge(e.target.value ? Number(e.target.value) : '')} placeholder="Contoh: 25" className="w-full px-4 py-3 rounded-xl outline-none transition-all" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-ink)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-ink)' }}>Sudah berapa hari batuk?</label>
            <input type="number" value={coughDurationDays} onChange={e => setCoughDurationDays(e.target.value ? Number(e.target.value) : '')} placeholder="Contoh: 3" className="w-full px-4 py-3 rounded-xl outline-none transition-all" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-ink)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-ink)' }}>Gejala Penyerta (Opsional)</label>
            <input type="text" value={symptoms} onChange={e => setSymptoms(e.target.value)} placeholder="Contoh: demam, sesak napas, pilek" className="w-full px-4 py-3 rounded-xl outline-none transition-all" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-ink)' }} />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <input type="checkbox" id="smoker" checked={isSmoker} onChange={e => setIsSmoker(e.target.checked)} className="w-5 h-5 rounded" style={{ accentColor: 'var(--bg-primary)' }} />
            <label htmlFor="smoker" className="text-sm font-medium" style={{ color: 'var(--text-ink)' }}>Saya seorang perokok aktif</label>
          </div>
          
          <div className="pt-2">
            <button onClick={handleSaveMedicalData} disabled={isSaving} className="btn-primary w-full py-3">
              {isSaving ? 'Menyimpan...' : 'Simpan Data Medis'}
            </button>
            {saveMessage && (
              <p className={`text-sm text-center mt-3 font-medium ${saveMessage.includes('berhasil') ? 'text-green-500' : 'text-red-500'}`}>
                {saveMessage}
              </p>
            )}
          </div>
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[#16A34A]" style={{ backgroundColor: '#DCFCE7' }}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium" style={{ color: 'var(--text-ink)' }}>Mulai Screening Baru</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Rekam dan analisis suara batuk</div>
            </div>
          </div>
        </Link>

        <div className="border-t mx-4" style={{ borderColor: 'var(--border)' }} />

        {/* Bug #5: Tombol logout sekarang memunculkan popup konfirmasi, bukan langsung logout */}
        <button
          onClick={() => setShowLogoutModal(true)}
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

      {/* Logout Confirmation Modal — identik dengan yang ada di Sidebar */}
      <AnimatePresence>
        {showLogoutModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm z-50"
              style={{ backgroundColor: 'var(--overlay-black)' }}
              onClick={() => setShowLogoutModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, top: '45%' }}
              animate={{ opacity: 1, scale: 1, top: '50%' }}
              exit={{ opacity: 0, scale: 0.95, top: '45%' }}
              className="fixed left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm rounded-3xl shadow-2xl p-6 z-50"
              style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}
            >
              <div className="w-12 h-12 rounded-full bg-[#ef4444]/10 flex items-center justify-center mb-4 text-[#ef4444]">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-ink)', letterSpacing: '-0.02em' }}>Keluar dari akun?</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Sesi Anda akan diakhiri. Anda perlu login kembali untuk mengakses riwayat screening Anda.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutModal(false)} className="btn-secondary flex-1 py-3">Batal</button>
                <button
                  onClick={async () => {
                    setShowLogoutModal(false);
                    await logout();
                    navigate('/');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#ef4444] hover:bg-[#dc2626] transition-all"
                >
                  Ya, Keluar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


