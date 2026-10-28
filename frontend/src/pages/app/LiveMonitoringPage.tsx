import React, { useState, useEffect } from 'react';
import {
  Activity,
  Radio,
  Search,
  Filter,
  RefreshCw,
  Battery,
  Wifi,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Gauge,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  List,
  LayoutGrid,
  X,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../services/api';
import { useWebSocket } from '../../context/WebSocketContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Device, Telemetry } from '../../types';

export const LiveMonitoringPage: React.FC<{ plantId: number }> = ({ plantId }) => {
  const { subscribe } = useWebSocket();
  const [devices, setDevices] = useState<Device[]>([]);
  const [telemetryMap, setTelemetryMap] = useState<Record<string, Telemetry>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMonitoringData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [devs, recents] = await Promise.all([
        api.getDevices(plantId),
        api.getRecentTelemetry(100),
      ]);
      setDevices(devs);
      const map: Record<string, Telemetry> = {};
      recents.forEach((t) => {
        if (!map[t.device_id] || new Date(t.timestamp) > new Date(map[t.device_id].timestamp)) {
          map[t.device_id] = t;
        }
      });
      setTelemetryMap(map);
    } catch (err) {
      console.error('Failed to load telemetry data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();

    const unsubTel = subscribe('TELEMETRY_INGESTED', (t: Telemetry) => {
      setTelemetryMap((prev) => ({ ...prev, [t.device_id]: t }));
    });

    const interval = setInterval(() => fetchMonitoringData(false), 5000);
    return () => {
      unsubTel();
      clearInterval(interval);
    };
  }, [plantId, subscribe]);

  // Dynamically extract active device types present in the system
  const availableTypes = Array.from(new Set(devices.map((d) => d.device_type))).filter(Boolean);

  const formatTypeName = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatMetricName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .toUpperCase();
  };

  // KPI Calculations
  const totalNodes = devices.length;
  let nominalCount = 0;
  let warningCount = 0;
  let criticalCount = 0;

  devices.forEach((dev) => {
    const telem = telemetryMap[dev.device_id];
    const status = telem ? telem.status : dev.connection_status;
    if (status === 'CRITICAL') criticalCount++;
    else if (status === 'WARNING') warningCount++;
    else nominalCount++;
  });

  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `zone ${d.zone_id}`.toLowerCase().includes(searchTerm.toLowerCase());

    const telem = telemetryMap[d.device_id];
    const status = telem ? telem.status : d.connection_status;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'NORMAL' && (status === 'NORMAL' || status === 'ONLINE')) ||
      status === statusFilter;

    const matchesType = typeFilter === 'ALL' || d.device_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Live Industrial Telemetry & Sensor Nodes
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE STREAM
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Real-time multi-sensor telemetry, threshold compliance monitoring, and hardware signal fidelity.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchMonitoringData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
            title="Refresh Telemetry Stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh Feeds</span>
          </button>

          {/* View Toggle */}
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'GRID'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'TABLE'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dense Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Operational Telemetry KPI Overview ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Nodes */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
            <span className="uppercase tracking-wider font-mono text-[11px]">Active Nodes</span>
            <Radio className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {totalNodes}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Telemetry polling active</span>
          </div>
        </div>

        {/* Nominal Nodes */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
            <span className="uppercase tracking-wider font-mono text-[11px]">Normal Baseline</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">
            {nominalCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Safe operating parameters
          </div>
        </div>

        {/* Warnings */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
            <span className="uppercase tracking-wider font-mono text-[11px]">Threshold Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${warningCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-3xl font-black font-mono ${warningCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
            {warningCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {warningCount > 0 ? 'Approaching max limit' : 'Zero active warnings'}
          </div>
        </div>

        {/* Critical Breaches */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
            <span className="uppercase tracking-wider font-mono text-[11px]">Critical Breaches</span>
            <ShieldAlert className={`w-4 h-4 ${criticalCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-3xl font-black font-mono ${criticalCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {criticalCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {criticalCount > 0 ? 'Hazard safety threshold triggered' : 'All channels within limit'}
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sensor name, ID, or zone..."
            className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="NORMAL">Normal / Online</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Sensor Types</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {formatTypeName(t)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Content: Grid View ── */}
      {viewMode === 'GRID' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDevices.length === 0 ? (
            <div className="col-span-full p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
              <Radio className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-300">No telemetry nodes found</h3>
              <p className="text-xs text-slate-500 mt-1">Try broadening your search query or status filter.</p>
            </div>
          ) : (
            filteredDevices.map((dev) => {
              const telem = telemetryMap[dev.device_id];
              const status = telem ? telem.status : dev.connection_status;

              // Calculate threshold percentage
              let thresholdPct = 0;
              if (telem && telem.max_threshold) {
                thresholdPct = Math.min(Math.round((telem.metric_value / telem.max_threshold) * 100), 100);
              }

              const isCritical = status === 'CRITICAL';
              const isWarning = status === 'WARNING';

              const valueColor = isCritical
                ? 'text-rose-400'
                : isWarning
                ? 'text-amber-400'
                : 'text-white';

              const cardBorder = isCritical
                ? 'border-rose-600/80 shadow-rose-950/40 bg-rose-950/20'
                : isWarning
                ? 'border-amber-600/70 shadow-amber-950/20 bg-amber-950/15'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/90';

              const progressColor = isCritical
                ? 'bg-rose-500'
                : isWarning
                ? 'bg-amber-500'
                : 'bg-emerald-500';

              // WiFi signal evaluation
              const wifiStrength =
                dev.signal_strength_dbm > -65
                  ? 'text-emerald-400'
                  : dev.signal_strength_dbm > -75
                  ? 'text-blue-400'
                  : 'text-amber-400';

              // Battery evaluation
              const batteryColor =
                dev.battery_percentage > 70
                  ? 'text-emerald-400'
                  : dev.battery_percentage > 30
                  ? 'text-blue-400'
                  : 'text-rose-400';

              return (
                <div
                  key={dev.id}
                  className={`p-5 rounded-2xl border transition-all duration-300 shadow-xl space-y-4 flex flex-col justify-between ${cardBorder}`}
                >
                  <div className="space-y-3.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {dev.device_id}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            Zone {dev.zone_id}
                          </span>
                        </div>
                        <h3 className="font-bold text-white text-sm mt-1.5 leading-snug">
                          {dev.name}
                        </h3>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {formatTypeName(dev.device_type)}
                        </div>
                      </div>
                      <StatusBadge status={status} pulse={isCritical} />
                    </div>

                    {/* Primary Measurement Card */}
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                        <span>{telem ? formatMetricName(telem.metric_name) : 'SENSOR READING'}</span>
                        {telem && telem.quality_score != null && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Fidelity: {(telem.quality_score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between">
                        <div className={`text-3xl font-black font-mono tracking-tight ${valueColor}`}>
                          {telem ? (
                            <>
                              <span>{telem.metric_value}</span>
                              <span className="text-xs font-normal text-slate-400 ml-1.5 font-sans">
                                {telem.unit}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 font-sans font-normal">
                              Listening on MQTT stream...
                            </span>
                          )}
                        </div>

                        {telem && telem.max_threshold && (
                          <div className="text-right text-[11px] font-mono text-slate-400">
                            <div className="text-slate-500 text-[10px] uppercase">Threshold Limit</div>
                            <div className="font-bold text-slate-200">
                              &lt; {telem.max_threshold} {telem.unit}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Threshold Progress Gauge */}
                      {telem && telem.max_threshold && (
                        <div className="space-y-1 pt-1">
                          <div className="w-full h-1.5 rounded-full bg-slate-850 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                              style={{ width: `${thresholdPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] font-mono text-slate-500">
                            <span>0 {telem.unit}</span>
                            <span className={isCritical ? 'text-rose-400 font-bold' : isWarning ? 'text-amber-400' : 'text-slate-400'}>
                              {thresholdPct}% of Safe Operating Limit
                            </span>
                            <span>{telem.max_threshold} {telem.unit}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Hardware & Wireless Health */}
                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 ${wifiStrength}`} title="Signal RSSI">
                        <Wifi className="w-3.5 h-3.5" />
                        <span>{dev.signal_strength_dbm} dBm</span>
                      </div>
                      <div className={`flex items-center gap-1 ${batteryColor}`} title="Battery Reserve">
                        <Battery className="w-3.5 h-3.5" />
                        <span>{dev.battery_percentage}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 text-[10px]" title="Last Transmission">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(dev.last_seen_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Content: Table View ── */}
      {viewMode === 'TABLE' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-semibold">Sensor ID</th>
                <th className="pb-3 font-semibold">Device Name</th>
                <th className="pb-3 font-semibold">Zone</th>
                <th className="pb-3 font-semibold">Sensor Type</th>
                <th className="pb-3 font-semibold">Current Value</th>
                <th className="pb-3 font-semibold">Threshold Limit</th>
                <th className="pb-3 font-semibold">Health Status</th>
                <th className="pb-3 font-semibold">Signal</th>
                <th className="pb-3 font-semibold">Battery</th>
                <th className="pb-3 font-semibold">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No sensor nodes found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((dev) => {
                  const telem = telemetryMap[dev.device_id];
                  const status = telem ? telem.status : dev.connection_status;

                  return (
                    <tr key={dev.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="py-3 font-mono font-bold text-blue-400">
                        {dev.device_id}
                      </td>
                      <td className="py-3 font-semibold text-white">
                        {dev.name}
                      </td>
                      <td className="py-3 font-mono text-slate-400">
                        Zone {dev.zone_id}
                      </td>
                      <td className="py-3 text-slate-300">
                        {formatTypeName(dev.device_type)}
                      </td>
                      <td className="py-3 font-mono font-bold">
                        {telem ? (
                          <span className={status === 'CRITICAL' ? 'text-rose-400' : status === 'WARNING' ? 'text-amber-400' : 'text-white'}>
                            {telem.metric_value} {telem.unit}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 font-mono text-slate-400">
                        {telem && telem.max_threshold ? `< ${telem.max_threshold} ${telem.unit}` : 'N/A'}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="py-3 font-mono text-slate-300">
                        {dev.signal_strength_dbm} dBm
                      </td>
                      <td className="py-3 font-mono text-slate-300">
                        {dev.battery_percentage}%
                      </td>
                      <td className="py-3 font-mono text-slate-400 text-[11px]">
                        {new Date(dev.last_seen_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
