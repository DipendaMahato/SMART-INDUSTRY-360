import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, ArrowRight, ShieldAlert } from 'lucide-react';

interface EmergencyBannerProps {
  criticalCount: number;
  latestIncidentTitle?: string;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({ criticalCount, latestIncidentTitle }) => {
  if (criticalCount <= 0) return null;

  return (
    <div className="w-full bg-rose-600 text-white px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-semibold shadow-lg shadow-rose-950 animate-pulse border-b border-rose-500">
      <div className="flex items-center gap-2 max-w-4xl truncate">
        <AlertOctagon className="w-5 h-5 shrink-0" />
        <span className="uppercase tracking-wider font-extrabold bg-rose-900/60 px-2 py-0.5 rounded text-[11px] font-mono">
          CRITICAL EMERGENCY ACTIVE ({criticalCount})
        </span>
        <span className="truncate hidden md:inline text-rose-100 font-medium">
          {latestIncidentTitle || 'Hazardous breach detected. Autonomous safety protocols activated.'}
        </span>
      </div>

      <Link
        to="/app/overview"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs uppercase tracking-wide transition-all shrink-0 ml-2"
      >
        <span>View Live Overview</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};
