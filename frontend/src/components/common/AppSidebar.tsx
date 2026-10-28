import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Layers,
  Wrench,
  TrendingUp,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AppSidebarProps {
  criticalCount?: number;
  alertCount?: number;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ criticalCount = 0, alertCount = 0 }) => {
  const [collapsed, setCollapsed] = useState(false);

  const navigationGroups = [
    {
      group: 'Operations',
      items: [
        { label: 'Overview Dashboard',    path: '/app/overview',          icon: LayoutDashboard },
        { label: 'Live Monitoring',       path: '/app/monitoring',        icon: Activity },
        { label: 'Factory Digital Twin',  path: '/app/digital-twin',      icon: Layers },
      ],
    },
    {
      group: 'Assets & Hardware',
      items: [
        { label: 'Equipment & Machines',  path: '/app/equipment',    icon: Wrench },
      ],
    },
    {
      group: 'Intelligence',
      items: [
        { label: 'Predictive Maintenance',path: '/app/maintenance',     icon: TrendingUp },
      ],
    },
    {
      group: 'Compliance & Admin',
      items: [
        { label: 'Reports & Analytics',   path: '/app/reports',          icon: FileBarChart },
      ],
    },
  ];

  return (
    <aside
      className={`relative h-[calc(100vh-4rem)] bg-slate-950 border-r border-slate-800/80 transition-all duration-300 flex flex-col z-20 ${
        collapsed ? 'w-[60px]' : 'w-60'
      }`}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 shadow-lg z-30 transition-all"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-1 px-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800">
        {navigationGroups.map((group) => (
          <div key={group.group} className="mb-1">
            {/* Group Label */}
            {!collapsed && (
              <div className="px-3 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-600 select-none">
                {group.group}
              </div>
            )}
            {collapsed && <div className="border-t border-slate-800/60 my-2 mx-2" />}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `group flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all relative ${
                        isActive
                          ? 'bg-blue-600/15 text-blue-400 border border-blue-500/25 shadow-sm shadow-blue-900/20'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                        {!collapsed && (
                          <span className="truncate flex-1 leading-none">{item.label}</span>
                        )}
                        {!collapsed && (item as any).badge !== undefined && (
                          <span className={`ml-auto min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-black leading-none ${(item as any).badgeColor ?? 'bg-slate-700 text-slate-200'}`}>
                            {(item as any).badge}
                          </span>
                        )}
                        {/* Collapsed badge dot */}
                        {collapsed && (item as any).badge !== undefined && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-600">
            <span>v1.0.0</span>
            <span className="text-emerald-500 font-bold">● SECURE</span>
          </div>
        </div>
      )}
    </aside>
  );
};
