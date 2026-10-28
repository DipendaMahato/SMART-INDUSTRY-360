import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-bold text-slate-300 tracking-tight">
            SMART INDUSTRY <span className="text-blue-500">360</span>
          </span>
        </div>
        <span className="text-xs text-slate-600">
          © {new Date().getFullYear()} Smart Industry 360. All rights reserved.
        </span>
      </div>
    </footer>
  );
};
