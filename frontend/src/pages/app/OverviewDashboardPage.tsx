import React, { useState, useEffect } from 'react';
import {
  Activity,
  Flame,
  Radio,
  Wrench,
  Users,
  Bell,
  Cpu,
  Layers,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Clock,
  ArrowRight,
  Wifi,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useWebSocket } from '../../context/WebSocketContext';
import { StatusBadge } from '../../components/common/StatusBadge';

/* ─── severity colour helper ─── */
const severityStyle: Record<string, string> = {
  CRITICAL: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  LOW: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
};

/* ─── Custom Tooltip ─── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 shadow-2xl">
        <p className="text-[11px] text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-white">{payload[0].value?.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export const OverviewDashboardPage: React.FC<{ plantId: number }> = ({ plantId }) => {
  const { subscribe } = useWebSocket();
  const [summary, setSummary] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('temperature');
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const sum = await api.getDashboardSummary(plantId);
      setSummary(sum);
      const trends = await api.getDashboardTrends(selectedMetric);
      setTrendData(trends);
      const incs = await api.getIncidents(plantId);
      setRecentIncidents(incs.slice(0, 5));
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const unsubInc = subscribe('INCIDENT_CREATED', () => fetchDashboardData());
    const unsubIncUp = subscribe('INCIDENT_UPDATED', () => fetchDashboardData());
    const interval = setInterval(fetchDashboardData, 8000);
    return () => {
      unsubInc();
      unsubIncUp();
      clearInterval(interval);
    };
  }, [plantId, selectedMetric]);

  const kpis = summary?.kpis;
  const safetyScore = kpis?.overall_plant_safety_score ?? 0;
  const totalDevices = kpis?.total_devices ?? 0;
  const onlineDevices = kpis?.online_devices ?? 0;
  const onlinePct = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;

  const metrics = [
    { key: 'temperature',      label: 'Temp',      unit: '°C',   color: '#f97316' },
    { key: 'combustible_gas',  label: 'Gas',       unit: 'ppm',  color: '#a78bfa' },
    { key: 'vibration_rms',    label: 'Vibration', unit: 'mm/s', color: '#34d399' },
    { key: 'smoke_ppm',        label: 'Smoke',     unit: 'ppm',  color: '#fb7185' },
  ];
  const activeMeta = metrics.find((m) => m.key === selectedMetric)!;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/70">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40">
              <Cpu className="w-4 h-4 text-blue-400" />
            </span>
            Command Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 ml-10">
            Real-time multi-sensor telemetry · Hazardous zone tracking · Emergency coordination
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            {lastRefreshed.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── KPI Cards Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">

        {/* 1 — Safety Score (double wide) */}
        <div className="xl:col-span-2 relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/40 shadow-lg">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-400 to-transparent" />
          <div className="relative space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400/80">Plant Safety Health</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tabular-nums">{safetyScore.toFixed(1)}<span className="text-2xl">%</span></span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Compliant</span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${safetyScore}%` }}
              />
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold pt-0.5">
              <span className="text-emerald-400">✓ {kpis?.zones_clear ?? 0} Clear</span>
              <span className="text-amber-400">⚠ {kpis?.zones_warning ?? 0} Warning</span>
              <span className="text-rose-400">⛔ {kpis?.zones_evacuate ?? 0} Evacuate</span>
            </div>
          </div>
        </div>

        {/* 2 — Critical Incidents */}
        <div className={`relative overflow-hidden p-5 rounded-2xl border shadow-lg ${
          (kpis?.active_critical_incidents ?? 0) > 0
            ? 'bg-gradient-to-br from-rose-950/60 to-slate-900 border-rose-700/40'
            : 'bg-gradient-to-br from-slate-900 to-slate-900/80 border-slate-800'
        }`}>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-400 to-transparent" />
          <div className="relative space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-rose-400/80">Critical Incidents</span>
              <Flame className="w-4 h-4 text-rose-500" />
            </div>
            <div className={`text-4xl font-black tabular-nums ${(kpis?.active_critical_incidents ?? 0) > 0 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
              {kpis?.active_critical_incidents ?? 0}
            </div>
            <div className="text-[11px] text-slate-400">
              <span className="text-amber-400 font-semibold">{kpis?.active_warnings ?? 0}</span> warning-tier events
            </div>
          </div>
        </div>

        {/* 3 — Pending Alerts */}
        <div className={`relative overflow-hidden p-5 rounded-2xl border shadow-lg ${
          (kpis?.unacknowledged_alerts ?? 0) > 0
            ? 'bg-gradient-to-br from-amber-950/50 to-slate-900 border-amber-700/40'
            : 'bg-gradient-to-br from-slate-900 to-slate-900/80 border-slate-800'
        }`}>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400 to-transparent" />
          <div className="relative space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400/80">Pending Alerts</span>
              <Bell className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-4xl font-black text-amber-400 tabular-nums">
              {kpis?.unacknowledged_alerts ?? 0}
            </div>
            <div className="text-[11px] text-slate-400">Awaiting acknowledgement</div>
          </div>
        </div>

        {/* 4 — Active IoT Nodes */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-950/50 to-slate-900 border border-blue-800/40 shadow-lg">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400 to-transparent" />
          <div className="relative space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400/80">IoT Nodes</span>
              <Radio className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-white tabular-nums">{onlineDevices}</span>
              <span className="text-sm text-slate-500 font-semibold">/ {totalDevices}</span>
            </div>
            {/* Online pct bar */}
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700"
                style={{ width: `${onlinePct}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400">
              <span className="text-rose-400 font-semibold">{kpis?.offline_devices ?? 0}</span> offline ·{' '}
              <span className="text-amber-400 font-semibold">{kpis?.degraded_devices ?? 0}</span> degraded
            </div>
          </div>
        </div>

        {/* 5 — Workers On Site */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-950/50 to-slate-900 border border-purple-800/40 shadow-lg">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-400 to-transparent" />
          <div className="relative space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-purple-400/80">Workers On Site</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-4xl font-black text-white tabular-nums">
              {kpis?.workers_on_site ?? 0}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              {kpis?.workers_on_site != null ? 'All Accounted' : 'Pending Count'}
            </div>
          </div>
        </div>

      </div>

      {/* ── Charts + Incidents ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Telemetry Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Live Sensor Telemetry Trends
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Sub-second time series sampled across active production zones
              </p>
            </div>

            {/* Metric tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {metrics.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedMetric(m.key)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    selectedMetric === m.key
                      ? 'text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={selectedMetric === m.key ? { backgroundColor: m.color + '33', border: `1px solid ${m.color}55`, color: m.color } : {}}
                >
                  {m.label}
                  <span className="ml-1 opacity-60">{m.unit}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={activeMeta.color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={activeMeta.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#334155"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#334155"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={activeMeta.color}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#metricGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: activeMeta.color, strokeWidth: 2, stroke: '#0f172a' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Incidents Panel */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              Recent Incidents
            </h3>
            <Link
              to="/app/reports"
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {recentIncidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
                <p className="text-xs text-slate-500">No active incidents.<br/>Normal operating baseline.</p>
              </div>
            ) : (
              recentIncidents.map((inc) => (
                <Link
                  key={inc.id}
                  to="/app/reports"
                  className="group block p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] text-slate-500">{inc.incident_number}</span>
                    <StatusBadge status={inc.status} />
                  </div>
                  <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                    {inc.title}
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-slate-500">Zone {inc.zone_id}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${severityStyle[inc.severity] ?? 'text-slate-400'}`}>
                      {inc.severity}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Digital Twin CTA */}
          <Link
            to="/app/digital-twin"
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/40 text-xs font-semibold transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            Open Factory Digital Twin
          </Link>
        </div>

      </div>

      {/* ── Quick Actions Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Live Monitoring',       path: '/app/monitoring',      icon: Activity,   color: 'blue' },
          { label: 'Equipment Fleet',       path: '/app/equipment',       icon: Wrench,     color: 'rose' },
          { label: 'Safety Reports',        path: '/app/reports',         icon: Layers,     color: 'amber' },
        ].map(({ label, path, icon: Icon, color }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all group
              bg-${color}-950/30 border-${color}-800/30 hover:bg-${color}-900/40 hover:border-${color}-700/50 hover:shadow-lg`}
          >
            <span className={`flex items-center justify-center w-8 h-8 rounded-lg bg-${color}-500/10 border border-${color}-500/20 group-hover:bg-${color}-500/20 transition-all`}>
              <Icon className={`w-4 h-4 text-${color}-400`} />
            </span>
            <span className={`text-xs font-semibold text-${color}-300 group-hover:text-${color}-200 transition-colors`}>{label}</span>
            <ArrowRight className={`w-3.5 h-3.5 text-${color}-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity`} />
          </Link>
        ))}
      </div>

    </div>
  );
};
