import React, { useState, useEffect } from 'react';
import {
  Wrench,
  RefreshCw,
  Search,
  X,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Equipment } from '../../types';

export const EquipmentPage: React.FC<{ plantId: number }> = ({ plantId }) => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchEquipmentData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const data = await api.getEquipment(plantId);
      setEquipmentList(data);
    } catch (err) {
      console.error('Failed to load equipment data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEquipmentData();
  }, [plantId]);

  // Essential KPI Calculations
  const totalAssets = equipmentList.length;
  const operationalCount = equipmentList.filter((e) => e.status === 'OPERATIONAL').length;
  const maintenanceCount = equipmentList.filter((e) => e.status === 'UNDER_MAINTENANCE').length;
  const degradedCount = equipmentList.filter(
    (e) => e.status !== 'OPERATIONAL' && e.status !== 'UNDER_MAINTENANCE'
  ).length;

  const avgHealth = totalAssets > 0
    ? (equipmentList.reduce((acc, curr) => acc + (curr.health_score || 0), 0) / totalAssets).toFixed(1)
    : '0.0';

  // Categories list
  const categories = ['ALL', ...Array.from(new Set(equipmentList.map((e) => e.category)))];

  // Filtered list
  const filteredEquipment = equipmentList.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.equipment_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || eq.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || eq.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Equipment & Machinery
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Operational status and health monitoring across plant zones.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchEquipmentData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition-all shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ── Essential Fleet KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Equipment */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
            <span>Total Equipment</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{totalAssets}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {categories.length - 1} machine categories
          </div>
        </div>

        {/* Operational */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
            <span>Operational</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono flex items-baseline gap-1">
            <span>{operationalCount}</span>
            <span className="text-xs text-slate-400">/ {totalAssets}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalAssets > 0 ? `${((operationalCount / totalAssets) * 100).toFixed(0)}% nominal runtime` : 'No data'}
          </div>
        </div>

        {/* Under Maintenance */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
            <span>Maintenance</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">{maintenanceCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Scheduled service active
          </div>
        </div>

        {/* Degraded / At Risk */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
            <span>Attention Needed</span>
            <AlertTriangle className={`w-4 h-4 ${degradedCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
            <span className={degradedCount > 0 ? 'text-rose-400' : 'text-slate-200'}>
              {degradedCount}
            </span>
            <span className="text-xs text-slate-400">machines</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {degradedCount > 0 ? 'Requires technician inspection' : 'Fleet operating within spec'}
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative min-w-[240px] flex-1 sm:max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by equipment ID, name, or category..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPERATIONAL">Operational</option>
            <option value="DEGRADED">Degraded</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="CRITICAL_FAULT">Critical Fault</option>
          </select>

          {/* Category Filter */}
          {categories.length > 2 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Machinery Grid ── */}
      {filteredEquipment.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <Cpu className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No machinery found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEquipment.map((eq) => (
            <div
              key={eq.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {eq.equipment_id}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        Zone {eq.zone_id}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-base mt-1.5">
                      {eq.name}
                    </h3>
                    <div className="text-xs text-slate-400 mt-0.5">{eq.category}</div>
                  </div>
                  <StatusBadge status={eq.status} />
                </div>

                {/* Health Score */}
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Machine Health</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        eq.health_score > 85
                          ? 'text-emerald-400'
                          : eq.health_score > 65
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {eq.health_score?.toFixed(1) ?? 'N/A'}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        eq.health_score > 85
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : eq.health_score > 65
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          : 'bg-gradient-to-r from-rose-500 to-red-400'
                      }`}
                      style={{ width: `${Math.min(Math.max(eq.health_score || 0, 0), 100)}%` }}
                    />
                  </div>
                </div>

                {/* Service Dates */}
                <div className="text-[11px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Last Inspection:</span>
                    <span className="font-mono text-slate-300">
                      {eq.last_service_date ? new Date(eq.last_service_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Next Scheduled:</span>
                    <span className="font-mono text-blue-400 font-semibold">
                      {eq.next_service_date ? new Date(eq.next_service_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
