import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-[length:200%_100%]",
        className
      )}
      style={{ 
        backgroundImage: 'linear-gradient(to right, var(--bg-card), var(--bg-strong), var(--bg-card))',
        animationDuration: '1.5s' 
      }}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-6 rounded-3xl flex flex-col gap-4" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="w-12 h-5 rounded-md" />
      </div>
      <div className="mt-auto space-y-2">
        <Skeleton className="w-24 h-4 rounded-md" />
        <Skeleton className="w-16 h-8 rounded-md" />
      </div>
    </div>
  );
}

export function HistoryItemSkeleton() {
  return (
    <div className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0" style={{ borderColor: 'var(--border-soft)' }}>
      <div className="space-y-2">
        <Skeleton className="w-32 h-4 rounded-md" />
        <Skeleton className="w-20 h-3 rounded-md" />
      </div>
      <Skeleton className="w-20 h-6 rounded-xl" />
    </div>
  );
}

export function LatestResultSkeleton() {
  return (
    <div className="rounded-3xl p-6 space-y-4" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="w-24 h-4 rounded-md" />
      </div>
      <div className="flex items-end gap-4">
        <Skeleton className="w-20 h-12 rounded-md" />
        <Skeleton className="w-24 h-7 rounded-md" />
      </div>
      <Skeleton className="w-full h-2 rounded-full" />
      <Skeleton className="w-full h-16 rounded-lg" />
    </div>
  );
}

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 4 }) => {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={cn("h-4 rounded-md", i === 0 ? "w-28" : "w-20")} />
        </td>
      ))}
    </tr>
  );
}

export function ChartBarSkeleton() {
  return (
    <div className="h-64 w-full flex items-end justify-between gap-2 pb-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="w-full flex flex-col items-center justify-end h-full">
          <Skeleton
            className="w-full rounded-t-sm"
            style={{ height: `${20 + Math.random() * 60}%` }}
          />
        </div>
      ))}
    </div>
  );
}
