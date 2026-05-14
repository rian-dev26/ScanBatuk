import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Activity, Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { AIChatButton } from './AIChatButton';

export function UserLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen font-sans flex flex-col md:flex-row" style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--text-ink)' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 min-w-0 flex flex-col md:ml-64">
        {/* Mobile Header */}
        <header className="md:hidden px-4 py-4 flex items-center justify-between sticky top-0 z-30" style={{ backgroundColor: 'var(--bg-canvas)', borderBottom: '1px solid var(--border)' }}>
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-[#a4d4c5] flex items-center justify-center text-[#1a3a3a]">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-medium text-lg" style={{ letterSpacing: '-0.03em', color: 'var(--text-ink)' }}>ScanBatuk</span>
          </Link>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -mr-2 rounded-xl transition-colors" style={{ color: 'var(--text-muted)' }}>
            <Menu className="w-6 h-6" />
          </button>
        </header>
        
        <div className="flex-1 p-4 md:p-8">
          <Outlet />
        </div>
      </main>
      
      <AIChatButton />
    </div>
  );
}
