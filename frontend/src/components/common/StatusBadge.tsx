import React from 'react';

interface StatusBadgeProps {
  status: string;
  pulse?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, pulse = false, className = '' }) => {
  const norm = (status || '').toUpperCase();

  let bg = 'bg-slate-700/60 text-slate-300 border-slate-600';
  let dot = 'bg-slate-400';

  if (['NORMAL', 'ONLINE', 'HEALTHY', 'CLEAR', 'OPERATIONAL', 'RESOLVED', 'VERIFIED'].includes(norm)) {
    bg = 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80';
    dot = 'bg-emerald-400';
  } else if (['WARNING', 'DEGRADED', 'CONTAINED', 'PENDING', 'HIGH'].includes(norm)) {
    bg = 'bg-amber-950/70 text-amber-300 border-amber-800/80';
    dot = 'bg-amber-400';
  } else if (['CRITICAL', 'EVACUATE', 'CRITICAL_FAULT', 'NEW', 'FAILED'].includes(norm)) {
    bg = 'bg-rose-950/80 text-rose-300 border-rose-800/90';
    dot = 'bg-rose-500';
  } else if (['OFFLINE', 'STALE', 'UNKNOWN', 'CANCELLED', 'FALSE_ALARM'].includes(norm)) {
    bg = 'bg-slate-800 text-slate-400 border-slate-700';
    dot = 'bg-slate-500';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border ${bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${pulse ? 'animate-ping' : ''}`} />
      {norm}
    </span>
  );
};
