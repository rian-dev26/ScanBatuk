import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Activity, Menu, X, LogOut, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function GuestLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleScrollToCaraKerja = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById('cara-kerja')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById('cara-kerja')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: 'Beranda', to: '/', exact: true },
    { label: 'Cara Kerja', onClick: handleScrollToCaraKerja },
    { label: 'Screening', to: '/screening' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--text-ink)' }}>
      {/* ── Top Navigation ── */}
      <header className={cn(
        "fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 h-16",
        scrolled
          ? "backdrop-blur-xl shadow-[0_1px_0_0_var(--border)]"
          : "backdrop-blur-md"
      )} style={{ backgroundColor: scrolled ? 'color-mix(in srgb, var(--bg-canvas) 95%, transparent)' : 'color-mix(in srgb, var(--bg-canvas) 80%, transparent)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#a4d4c5] flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
              <Activity className="w-5 h-5 text-[#1a3a3a]" />
            </div>
            <span className="font-medium text-lg tracking-tight" style={{ letterSpacing: '-0.03em', color: 'var(--text-ink)' }}>ScanBatuk</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.to ? (
                <Link key={link.label} to={link.to} className="px-4 py-2 text-sm font-medium transition-colors rounded-lg" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-ink)'; e.currentTarget.style.backgroundColor = 'var(--bg-card)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  {link.label}
                 </Link>
              ) : (
                <button key={link.label} onClick={link.onClick} className="px-4 py-2 text-sm font-medium transition-colors rounded-lg" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-ink)'; e.currentTarget.style.backgroundColor = 'var(--bg-card)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  {link.label}
                </button>
              )
            )}

            <div className="flex items-center gap-2 pl-4 ml-2" style={{ borderLeft: '1px solid var(--border)' }}>
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-all duration-200"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-ink)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </motion.div>
                </AnimatePresence>
              </button>

              {user && user.email !== 'guest@anonymous' ? (
                <div className="flex items-center gap-3">
                  <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="px-4 py-2 text-sm font-medium transition-colors rounded-lg" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-ink)'; e.currentTarget.style.backgroundColor = 'var(--bg-card)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    Dashboard
                  </Link>
                  <button onClick={logout} className="p-2 rounded-lg transition-all duration-200 text-[#ef4444] hover:bg-[#ef4444]/10">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-secondary h-9 px-5 text-sm">Masuk</Link>
                  <Link to="/login" state={{ isRegister: true }} className="btn-primary h-9 px-5 text-sm">Daftar</Link>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile: theme toggle + menu */}
          <div className="md:hidden flex items-center gap-1">
            <button onClick={toggleTheme} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} aria-label="Toggle theme">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={isMobileMenuOpen ? 'close' : 'open'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Nav Drawer ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 z-30 backdrop-blur-sm" style={{ backgroundColor: 'var(--overlay-black)' }} />
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }} className="fixed top-16 inset-x-0 z-40 shadow-lg px-4 py-4" style={{ backgroundColor: 'var(--bg-canvas)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex flex-col gap-1 max-w-[1280px] mx-auto">
                {navLinks.map((link, i) =>
                  link.to ? (
                    <motion.div key={link.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <Link to={link.to} className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl transition-colors" style={{ color: 'var(--text-ink)' }}>{link.label}</Link>
                    </motion.div>
                  ) : (
                    <motion.div key={link.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <button onClick={link.onClick} className="w-full text-left flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl transition-colors" style={{ color: 'var(--text-ink)' }}>{link.label}</button>
                    </motion.div>
                  )
                )}
                <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
                  {user && user.email !== 'guest@anonymous' ? (
                    <>
                      <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="px-4 py-3 text-base font-medium rounded-xl transition-colors" style={{ color: 'var(--text-ink)' }}>Dashboard</Link>
                      <button onClick={logout} className="text-left px-4 py-3 text-base font-medium text-[#ef4444] hover:bg-[#ef4444]/10 rounded-xl transition-colors">Keluar</button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Link to="/login" className="btn-secondary flex-1 h-11 text-sm">Masuk</Link>
                      <Link to="/login" state={{ isRegister: true }} className="btn-primary flex-1 h-11 text-sm">Daftar</Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col w-full pt-16">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: 'var(--bg-soft)' }} className="py-16 md:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <Link to="/" className="flex items-center space-x-2 group mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#a4d4c5] flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                  <Activity className="w-4 h-4 text-[#1a3a3a]" />
                </div>
                <span className="font-medium text-lg" style={{ letterSpacing: '-0.03em', color: 'var(--text-ink)' }}>ScanBatuk</span>
              </Link>
              <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Screening awal risiko Tuberkulosis menggunakan AI. Platform ini tidak menggantikan diagnosis medis profesional.
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-8 md:gap-16">
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-ink)' }}>Produk</h4>
                <div className="flex flex-col gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Link to="/screening" className="hover:opacity-80 transition-opacity">Screening AI</Link>
                  <button onClick={handleScrollToCaraKerja} className="text-left hover:opacity-80 transition-opacity">Cara Kerja</button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-ink)' }}>Lainnya</h4>
                <div className="flex flex-col gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {['Privasi', 'Persyaratan', 'Bantuan'].map(item => (
                    <a key={item} href="#" className="hover:opacity-80 transition-opacity">{item}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid var(--bg-strong)' }}>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>© 2026 ScanBatuk. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
