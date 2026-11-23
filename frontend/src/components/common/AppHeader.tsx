import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Cpu,
  Wifi,
  WifiOff,
  Radio,
  FlaskConical,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  ChevronDown,
  Building2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { NotificationAlert } from '../../types';

interface AppHeaderProps {
  onToggleSimulator: () => void;
  selectedPlantId: number;
  onSelectPlant: (id: number) => void;
  unackedCount?: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onToggleSimulator,
  selectedPlantId,
  onSelectPlant,
  unackedCount = 0,
}) => {
  const { user, role, logout } = useAuth();
  const { isConnected } = useWebSocket();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const plants = [
    { id: 1, name: 'Detroit Advanced Powertrain (DET-01)' },
    { id: 2, name: 'Houston Petrochemical Complex (HOU-02)' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-slate-900/95 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Plant Switcher & Brand quick link */}
      <div className="flex items-center gap-4">
        <Link to="/app/overview" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/30 transition-all">
            <ShieldAlert className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-100 hidden sm:inline">
            SMART INDUSTRY <span className="text-blue-500">360</span>
          </span>
        </Link>

        {/* Plant Switcher */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/70 text-xs">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedPlantId}
            onChange={(e) => onSelectPlant(Number(e.target.value))}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
          >
            {plants.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: WS Status, Simulator Toggle, Notifications, User */}
      <div className="flex items-center gap-3">
        {/* Live WebSocket Status indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
            isConnected
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
              : 'bg-rose-950/60 text-rose-400 border-rose-800/60 animate-pulse'
          }`}
          title={isConnected ? 'Live WebSocket telemetry stream active' : 'WebSocket reconnecting...'}
        >
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden md:inline font-semibold">LIVE WS STREAM</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="hidden md:inline font-semibold">RECONNECTING</span>
            </>
          )}
        </div>

        {/* Interactive Simulator Trigger Button */}
        <button
          onClick={onToggleSimulator}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 transition-all shadow-sm shadow-indigo-950"
          title="Open interactive industrial hazard and hardware simulator"
        >
          <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Simulator Controls</span>
        </button>


        {/* User Account / Role Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs transition-colors shadow-sm"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs border ${
              role === 'SUPER_ADMIN'
                ? 'bg-purple-600/30 border-purple-500/50 text-purple-300 ring-2 ring-purple-500/20'
                : role === 'CONTROL_ROOM_OPERATOR'
                ? 'bg-blue-600/30 border-blue-500/50 text-blue-300 ring-2 ring-blue-500/20'
                : 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300 ring-2 ring-emerald-500/20'
            }`}>
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-slate-100 font-bold truncate max-w-[130px]">
                {user?.full_name || 'Operator'}
              </div>
              <div className={`text-[10px] font-mono tracking-tight font-bold ${
                role === 'SUPER_ADMIN'
                  ? 'text-purple-400'
                  : role === 'CONTROL_ROOM_OPERATOR'
                  ? 'text-blue-400'
                  : 'text-emerald-400'
              }`}>
                {role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : role === 'CONTROL_ROOM_OPERATOR' ? 'OPERATOR' : role || 'USER'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-slate-800 space-y-1">
                <div className="font-bold text-white text-sm">{user?.full_name}</div>
                <div className="text-slate-400 text-[11px] truncate">{user?.email}</div>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    role === 'SUPER_ADMIN'
                      ? 'bg-purple-950 text-purple-300 border-purple-800'
                      : role === 'CONTROL_ROOM_OPERATOR'
                      ? 'bg-blue-950 text-blue-300 border-blue-800'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}>
                    {role}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {user?.department || 'Operations'}
                  </span>
                </div>
              </div>
              <Link
                to="/worker"
                onClick={() => setShowUserMenu(false)}
                className="w-full text-left px-4 py-2.5 text-slate-300 hover:bg-slate-800/80 flex items-center gap-2 transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-rose-400" />
                Switch to Worker Mobile Portal
              </Link>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full text-left px-4 py-2.5 text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition-colors border-t border-slate-800/80"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
