/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { motion, AnimatePresence } from 'motion/react';
import { Activity } from 'lucide-react';

import { GuestLayout } from './components/GuestLayout';
import { UserLayout } from './components/UserLayout';

import LandingPage from './pages/LandingPage';
import ScreeningPage from './pages/ScreeningPage';
import ResultPage from './pages/ResultPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import NearbyPage from './pages/NearbyPage';

function GlobalLoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="w-16 h-16 rounded-full bg-[#DCFCE7] flex items-center justify-center mb-6 shadow-lg"
      >
        <Activity className="w-8 h-8 text-[#16A34A]" />
      </motion.div>
      <p className="text-sm font-medium animate-pulse" style={{ color: 'var(--text-muted)' }}>Memuat ScanBatuk...</p>
    </motion.div>
  );
}

function AppRoutes() {
  const { loading } = useAuth();

  return (
    <>
      <AnimatePresence>
        {loading && <GlobalLoadingScreen />}
      </AnimatePresence>

      {!loading && (
        <Routes>
          {/* Guest/Public Routes */}
          <Route element={<GuestLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/screening" element={<ScreeningPage />} />
            <Route path="/result" element={<ResultPage />} />
          </Route>
          
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected/User Routes - screening tetap di dalam dashboard */}
          <Route element={<UserLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/screening" element={<ScreeningPage />} />
            <Route path="/dashboard/result" element={<ResultPage />} />
            <Route path="/dashboard/history" element={<HistoryPage />} />
            <Route path="/dashboard/nearby" element={<NearbyPage />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
