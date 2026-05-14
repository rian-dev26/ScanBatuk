import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Mail, Lock, ArrowRight, ShieldCheck, ArrowLeft, AlertCircle, Loader2, User } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.state?.isRegister ? false : true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, user } = useAuth();

  useEffect(() => {
    if (user && user.email !== 'guest@anonymous') {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setErrorMsg(null);
    try {
      if (isLogin) { await loginWithEmail(email, password); }
      else {
        if (password !== confirmPassword) throw new Error('Konfirmasi sandi tidak cocok.');
        if (!name.trim()) throw new Error('Nama lengkap harus diisi.');
        await registerWithEmail(email, password, name);
      }
      navigate('/dashboard');
    } catch (e: any) {
      let msg = 'Gagal memproses permintaan.';
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = 'Email atau sandi salah.';
      if (e.code === 'auth/email-already-in-use') msg = 'Email sudah terdaftar.';
      if (e.code === 'auth/weak-password') msg = 'Sandi terlalu lemah (minimal 6 karakter).';
      if (e.message === 'Konfirmasi sandi tidak cocok.' || e.message === 'Nama lengkap harus diisi.') msg = e.message;
      setErrorMsg(msg);
    } finally { setIsLoading(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setErrorMsg(null);
    try { await resetPassword(forgotPasswordEmail); setResetSent(true); }
    catch (e: any) { setErrorMsg(e.code === 'auth/user-not-found' ? 'Email tidak ditemukan.' : 'Gagal mengirim email reset.'); }
    finally { setIsLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true); setErrorMsg(null);
    try { await loginWithGoogle(); navigate('/dashboard'); }
    catch (e: any) { setErrorMsg(`Login gagal: ${e.message}.`); }
    finally { setIsLoading(false); }
  };

  const inputStyle: React.CSSProperties = { backgroundColor: 'var(--bg-canvas)', color: 'var(--text-ink)', borderColor: 'var(--border)' };

  return (
    <div className="min-h-screen flex flex-col py-8 px-4 sm:px-6 lg:px-8 relative" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      <div className="w-full mb-6 sm:mb-0 sm:absolute sm:top-8 sm:left-8 z-10">
        <Link to="/" className="inline-flex items-center font-medium text-sm" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col justify-center w-full max-w-md mx-auto sm:max-w-none">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-3xl bg-[#a4d4c5] flex items-center justify-center mb-6"><Activity className="w-8 h-8 text-[#1a3a3a]" /></div>
          </div>
          <h2 className="mt-2 text-center text-3xl font-medium tracking-tight" style={{ color: 'var(--text-ink)', letterSpacing: '-0.025em' }}>
            {isLogin ? 'Masuk ke akun Anda' : 'Buat akun baru'}
          </h2>
          <p className="mt-2 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Simpan riwayat screening Anda dan lacak kesehatan paru-paru.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="px-6 py-8 md:px-10 sm:rounded-3xl" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}>
            {showForgotPassword ? (
              <AnimatePresence mode="wait">
                <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold" style={{ color: 'var(--text-ink)', letterSpacing: '-0.02em' }}>Lupa Sandi?</h3>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang sandi.</p>
                  </div>
                  {resetSent ? (
                    <div className="bg-[#a4d4c5]/20 border border-[#a4d4c5] rounded-xl p-4 text-center">
                      <p className="text-[#1a3a3a] font-medium mb-4">Email pengaturan ulang telah dikirim.</p>
                      <button onClick={() => { setShowForgotPassword(false); setResetSent(false); }} className="text-sm font-medium" style={{ color: 'var(--text-ink)' }}>Kembali ke halaman login</button>
                    </div>
                  ) : (
                    <form className="space-y-6" onSubmit={handleForgotPassword}>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-ink)' }}>Alamat Email</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5" style={{ color: 'var(--text-dim)' }} /></div>
                          <input type="email" required value={forgotPasswordEmail} onChange={(e) => setForgotPasswordEmail(e.target.value)} className="block w-full pl-10 pr-3 py-3 rounded-xl text-sm focus:ring-1 focus:ring-current focus:outline-none" style={inputStyle} placeholder="anda@email.com" />
                        </div>
                      </div>
                      <button type="submit" disabled={isLoading} className="btn-primary w-full h-11">{isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Tautan'}</button>
                      <div className="text-center"><button type="button" onClick={() => setShowForgotPassword(false)} className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Batal, kembali ke login</button></div>
                    </form>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-ink)' }}>Nama Lengkap</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5" style={{ color: 'var(--text-dim)' }} /></div>
                        <input type="text" required={!isLogin} value={name} onChange={(e) => setName(e.target.value)} className="block w-full pl-10 pr-3 py-3 rounded-xl text-sm focus:ring-1 focus:ring-current focus:outline-none" style={inputStyle} placeholder="Nama Lengkap Anda" />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-ink)' }}>Alamat Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5" style={{ color: 'var(--text-dim)' }} /></div>
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-3 rounded-xl text-sm focus:ring-1 focus:ring-current focus:outline-none" style={inputStyle} placeholder="anda@email.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-ink)' }}>Kata Sandi</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5" style={{ color: 'var(--text-dim)' }} /></div>
                      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-3 py-3 rounded-xl text-sm focus:ring-1 focus:ring-current focus:outline-none" style={inputStyle} placeholder="••••••••" />
                    </div>
                  </div>
                  {isLogin && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input id="remember-me" type="checkbox" className="h-4 w-4 rounded" style={{ borderColor: 'var(--border)' }} />
                        <label htmlFor="remember-me" className="ml-2 block text-sm" style={{ color: 'var(--text-muted)' }}>Ingat saya</label>
                      </div>
                      <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm font-medium hover:underline" style={{ color: 'var(--text-ink)' }}>Lupa sandi?</button>
                    </div>
                  )}
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-ink)' }}>Konfirmasi Sandi</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5" style={{ color: 'var(--text-dim)' }} /></div>
                        <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="block w-full pl-10 pr-3 py-3 rounded-xl text-sm focus:ring-1 focus:ring-current focus:outline-none" style={inputStyle} placeholder="••••••••" />
                      </div>
                    </div>
                  )}
                  <button type="submit" disabled={isLoading} className="btn-primary w-full h-11 gap-2">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isLogin ? 'Masuk' : 'Daftar Sekarang'} <ArrowRight className="w-4 h-4" /></>}
                  </button>
                  <AnimatePresence>
                    {errorMsg && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg-error-light)', border: '1px solid var(--border-error)' }}>
                        <AlertCircle className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />
                        <p className="text-sm font-medium" style={{ color: 'var(--text-error-strong)' }}>{errorMsg}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
                <div className="mt-8">
                  <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full" style={{ borderTop: '1px solid var(--border)' }} /></div><div className="relative flex justify-center text-sm"><span className="px-2" style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--text-muted)' }}>Atau lanjutkan dengan</span></div></div>
                  <div className="mt-6">
                    <button onClick={handleGoogleLogin} disabled={isLoading} className="btn-secondary w-full h-11 gap-2">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <img className="h-5 w-5" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />}
                      {isLoading ? 'Memproses...' : 'Google'}
                    </button>
                  </div>
                </div>
                <div className="mt-8 text-center text-sm">
                  <button type="button" onClick={() => setIsLogin(!isLogin)} className="font-medium hover:underline" style={{ color: 'var(--text-ink)' }}>
                    {isLogin ? 'Belum punya akun? Daftar gratis' : 'Sudah punya akun? Masuk'}
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <ShieldCheck className="w-4 h-4 text-[#22c55e]" /> Data Anda aman dan dienkripsi
          </div>
        </motion.div>
      </div>
    </div>
  );
}
