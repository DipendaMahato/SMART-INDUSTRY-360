import React, { useState, useEffect } from 'react';
import {
  Wrench,
  RefreshCw,
  Search,
  X,
  Cpu,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Plus,
  Trash2,
} from 'lucide-react';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Equipment } from '../../types';

export const EquipmentPage: React.FC<{ plantId: number }> = ({ plantId }) => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New Equipment Form State
  const [formData, setFormData] = useState({
    equipment_id: '',
    name: '',
    zone_id: 1,
    category: 'CNC_MACHINE',
    status: 'OPERATIONAL',
    health_score: 95.0,
  });

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

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipment_id.trim() || !formData.name.trim()) return;

    setSubmitting(true);
    try {
      await api.createEquipment({
        ...formData,
        plant_id: plantId,
        health_score: Number(formData.health_score),
        zone_id: Number(formData.zone_id),
      });
      setIsAddModalOpen(false);
      setFormData({
        equipment_id: '',
        name: '',
        zone_id: 1,
        category: 'CNC_MACHINE',
        status: 'OPERATIONAL',
        health_score: 95.0,
      });
      await fetchEquipmentData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to add equipment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (!window.confirm(`Are you sure you want to remove ${equipmentId}?`)) return;

    setDeletingId(equipmentId);
    try {
      await api.deleteEquipment(equipmentId);
      await fetchEquipmentData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to delete equipment');
    } finally {
      setDeletingId(null);
    }
  };

  // Essential KPI Calculations
  const totalAssets = equipmentList.length;
  const operationalCount = equipmentList.filter((e) => e.status === 'OPERATIONAL').length;
  const maintenanceCount = equipmentList.filter((e) => e.status === 'UNDER_MAINTENANCE').length;
  const degradedCount = equipmentList.filter(
    (e) => e.status !== 'OPERATIONAL' && e.status !== 'UNDER_MAINTENANCE'
  ).length;

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
              Live status, health diagnostics, and equipment registry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Machinery</span>
          </button>
          <button
            onClick={() => fetchEquipmentData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
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
            Across {Math.max(categories.length - 1, 0)} machine categories
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
            {totalAssets > 0 ? `${((operationalCount / totalAssets) * 100).toFixed(0)}% nominal runtime` : 'No active machinery'}
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
      {equipmentList.length > 0 && (
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
      )}

      {/* ── Machinery Grid / Empty State ── */}
      {equipmentList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/90 border border-slate-800 max-w-xl mx-auto shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Cpu className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No Machinery Registered</h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            All fake placeholder equipment has been cleanly removed. Register your plant's real industrial equipment, machinery, boilers, or pumps below.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Real Equipment</span>
          </button>
        </div>
      ) : filteredEquipment.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <Cpu className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No matching machinery found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEquipment.map((eq) => (
            <div
              key={eq.id || eq.equipment_id}
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
                  <div className="flex items-center gap-2">
                    <StatusBadge status={eq.status} />
                    <button
                      onClick={() => handleDeleteEquipment(eq.equipment_id)}
                      disabled={deletingId === eq.equipment_id}
                      title="Remove equipment"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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

      {/* ── Add Equipment Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Register Real Equipment</h2>
                <p className="text-xs text-slate-400">Add operational plant machinery to tracking.</p>
              </div>
            </div>

            <form onSubmit={handleCreateEquipment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Equipment ID / Tag <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EQ-MILL-01, EQ-PUMP-02"
                  value={formData.equipment_id}
                  onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Machinery Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High-Pressure Hydraulic Pump Unit"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Zone</label>
                  <select
                    value={formData.zone_id}
                    onChange={(e) => setFormData({ ...formData, zone_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={1}>Zone 1 (Heavy Machining)</option>
                    <option value={2}>Zone 2 (Chemical / Thermal)</option>
                    <option value={3}>Zone 3 (Substation / Power)</option>
                    <option value={4}>Zone 4 (Assembly Line)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="CNC_MACHINE">CNC Machine</option>
                    <option value="BOILER">Boiler / Steam</option>
                    <option value="COMPRESSOR">Compressor</option>
                    <option value="PUMP">Pump / Hydr</option>
                    <option value="TRANSFORMER">Transformer</option>
                    <option value="ASSEMBLY">Robotic / Assembly</option>
                    <option value="CONVEYOR">Conveyor System</option>
                    <option value="CHILLER">Cooling / Chiller</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="OPERATIONAL">OPERATIONAL</option>
                    <option value="DEGRADED">DEGRADED</option>
                    <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE</option>
                    <option value="CRITICAL_FAULT">CRITICAL FAULT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Health Score ({formData.health_score}%)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={formData.health_score}
                    onChange={(e) => setFormData({ ...formData, health_score: Number(e.target.value) })}
                    className="w-full mt-2 accent-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
