import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, User, Activity, Settings, LogOut, Shield, Mic, MapPin, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navItems = [
    { icon: Home, label: 'Beranda', path: '/dashboard' },
    { icon: Mic, label: 'Screening', path: '/dashboard/screening' },
    { icon: ClipboardList, label: 'Riwayat', path: '/dashboard/history' },
    { icon: MapPin, label: 'Faskes Terdekat', path: '/dashboard/nearby' },
    { icon: User, label: 'Profil', path: '/dashboard/profile' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ icon: Settings, label: 'Admin', path: '/admin' });
  }

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="md:hidden fixed inset-0 backdrop-blur-sm z-40" style={{ backgroundColor: 'var(--overlay-black)' }} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-screen w-64 flex flex-col z-50",
        "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )} style={{ backgroundColor: 'var(--bg-canvas)', borderRight: '1px solid var(--border)' }}>
        <Link to="/" onClick={onClose} className="p-6 flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-xl bg-[#a4d4c5] flex items-center justify-center text-[#1a3a3a]">
            <Activity className="w-5 h-5" />
          </div>
          <span className="font-medium text-lg" style={{ letterSpacing: '-0.03em', color: 'var(--text-ink)' }}>ScanBatuk</span>
        </Link>
        
        <div className="px-6 pb-6">
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor: 'var(--bg-brand-teal)', color: 'var(--text-on-brand-teal)' }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate text-sm" style={{ color: 'var(--text-ink)' }}>{user?.name || 'Pengguna'}</p>
              {user?.role === 'admin' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1a3a3a] bg-[#a4d4c5] px-1.5 py-0.5 rounded-full">
                  <Shield className="w-2.5 h-2.5" /> Admin
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group overflow-hidden",
                )}
                style={active ? { backgroundColor: 'var(--bg-primary)', color: 'var(--text-on-primary)' } : { color: 'var(--text-muted)' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-ink)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
              >
                <Icon className={cn("w-5 h-5 shrink-0 transition-transform duration-200", active ? "opacity-100" : "opacity-60 group-hover:opacity-100 group-hover:scale-110")} />
                <span className="font-medium text-sm relative z-10">{item.label}</span>
                {active && (
                  <motion.span layoutId="sidebar-active-dot" className="ml-auto w-1.5 h-1.5 rounded-full opacity-70" style={{ backgroundColor: 'var(--text-on-primary)' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Logout */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#ef4444] hover:bg-[#ef4444]/10 w-full transition-colors"
          >
            <LogOut className="w-5 h-5 opacity-70" />
            <span className="font-medium text-sm">Keluar</span>
          </button>
        </div>
      </aside>

      <LogoutModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={async () => {
          setShowLogoutModal(false);
          await logout();
          navigate('/');
        }} 
      />
    </>
  );
} 

function LogoutModal({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 backdrop-blur-sm z-50" style={{ backgroundColor: 'var(--overlay-black)' }} onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, top: '45%' }} animate={{ opacity: 1, scale: 1, top: '50%' }} exit={{ opacity: 0, scale: 0.95, top: '45%' }} className="fixed left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm rounded-3xl shadow-2xl p-6 z-50" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}>
            <div className="w-12 h-12 rounded-full bg-[#ef4444]/10 flex items-center justify-center mb-4 text-[#ef4444]">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-ink)', letterSpacing: '-0.02em' }}>Keluar dari akun?</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Sesi Anda akan diakhiri. Anda perlu login kembali untuk mengakses riwayat screening Anda.</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1 py-3">Batal</button>
              <button onClick={onConfirm} className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#ef4444] hover:bg-[#dc2626] transition-all">Ya, Keluar</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
