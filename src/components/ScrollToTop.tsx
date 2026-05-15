import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop: Reset scroll posisi ke atas setiap kali navigasi ke halaman baru.
 * Dipasang di dalam BrowserRouter di App.tsx.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    // Reset window scroll (for guest pages)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Reset dashboard container scroll (for logged-in pages)
    const mainContent = document.getElementById('dashboard-main-scroll');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname]);

  return null;
}
