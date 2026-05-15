import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop: Reset scroll posisi ke atas setiap kali navigasi ke halaman baru.
 * Dipasang di dalam BrowserRouter di App.tsx.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
