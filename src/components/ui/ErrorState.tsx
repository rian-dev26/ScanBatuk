import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({ 
  title = 'Terjadi Kesalahan', 
  message = 'Gagal memuat data. Silakan coba lagi.', 
  onRetry,
  compact = false 
}: ErrorStateProps) {
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{ backgroundColor: 'var(--bg-error-light)', border: '1px solid var(--border-error)' }}
      >
        <AlertCircle className="w-5 h-5 shrink-0" style={{ color: 'var(--text-error-strong)' }} />
        <p className="text-sm font-medium flex-1" style={{ color: 'var(--text-error-strong)' }}>{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 transition-colors"
            style={{ color: 'var(--text-error-strong)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'var(--bg-error-light)' }}>
        <AlertCircle className="w-8 h-8" style={{ color: 'var(--color-error)' }} />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-ink)' }}>{title}</h3>
      <p className="text-sm max-w-sm mb-6" style={{ color: 'var(--text-muted)' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary h-11 px-6 gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      )}
    </motion.div>
  );
}
