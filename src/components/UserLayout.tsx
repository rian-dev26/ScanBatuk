import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Activity, Menu, Sun, Moon } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { AIChatButton } from './AIChatButton';
import { useTheme } from '../contexts/ThemeContext';

export function UserLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="h-[100dvh] overflow-hidden font-sans flex flex-col md:flex-row relative" style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--text-ink)' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col md:ml-64 h-[100dvh]">
        {/* Header - Fixed & Shrink-0 agar tidak pernah tergulung */}
        <header className="shrink-0 px-4 py-4 flex items-center justify-between md:justify-end z-30" style={{ backgroundColor: 'var(--bg-canvas)', borderBottom: '1px solid var(--border)' }}>
          <Link to="/" className="md:hidden flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-[#a4d4c5] flex items-center justify-center text-[#1a3a3a]">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-medium text-lg" style={{ letterSpacing: '-0.03em', color: 'var(--text-ink)' }}>ScanBatuk</span>
          </Link>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl transition-colors flex items-center justify-center" 
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-ink)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden p-2 -mr-2 rounded-xl transition-colors" 
              style={{ color: 'var(--text-muted)' }}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>
        
        {/* Scrollable Content Area */}
        <main id="dashboard-main-scroll" className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      
      <AIChatButton />
    </div>
  );
}
