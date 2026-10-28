import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Activity,
  Flame,
  ShieldAlert,
  Calendar,
  Check,
  Play,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  X,
  Gauge,
} from 'lucide-react';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Equipment, WorkOrder } from '../../types';

export const EquipmentPage: React.FC<{ plantId: number }> = ({ plantId }) => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtering & View state
  const [activeTab, setActiveTab] = useState<'EQUIPMENT' | 'WORK_ORDERS'>('EQUIPMENT');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [woStatusFilter, setWoStatusFilter] = useState('ALL');

  // Create Work Order Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEquipmentId, setNewEquipmentId] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newDesc, setNewDesc] = useState('');
  const [newScheduledDate, setNewScheduledDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );

  const fetchEquipmentData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [eq, wo] = await Promise.all([
        api.getEquipment(plantId),
        api.getWorkOrders(),
      ]);
      setEquipmentList(eq);
      if (eq.length > 0 && !newEquipmentId) {
        setNewEquipmentId(eq[0].equipment_id);
      }
      setWorkOrders(wo);
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

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      await api.createWorkOrder({
        equipment_id: newEquipmentId,
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        scheduled_date: newScheduledDate ? new Date(newScheduledDate).toISOString() : undefined,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      await fetchEquipmentData();
    } catch (err: any) {
      alert(err.message || 'Failed to create work order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateWoStatus = async (woId: number, nextStatus: 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      await api.updateWorkOrder(woId, {
        status: nextStatus,
        technician_notes: nextStatus === 'COMPLETED' ? 'Inspection and servicing completed per SOP.' : 'Maintenance activity underway.',
      });
      await fetchEquipmentData();
    } catch (err: any) {
      alert(err.message || 'Failed to update work order');
    }
  };

  const openWorkOrderForEquipment = (eqId: string) => {
    setNewEquipmentId(eqId);
    setNewTitle(`Scheduled inspection for ${eqId}`);
    setShowCreateModal(true);
  };

  // KPI Calculations
  const totalAssets = equipmentList.length;
  const avgHealth = totalAssets > 0
    ? (equipmentList.reduce((acc, curr) => acc + (curr.health_score || 0), 0) / totalAssets).toFixed(1)
    : '0.0';
  const degradedAssets = equipmentList.filter(
    (eq) => eq.status !== 'OPERATIONAL' || (eq.health_score != null && eq.health_score < 80)
  );
  const activeWorkOrders = workOrders.filter((wo) => wo.status === 'OPEN' || wo.status === 'IN_PROGRESS');
  const lowestRulAsset = equipmentList.length > 0
    ? [...equipmentList].sort((a, b) => a.estimated_rul_days - b.estimated_rul_days)[0]
    : null;

  // Filtered Equipment List
  const filteredEquipment = equipmentList.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.equipment_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || eq.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || eq.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Filtered Work Orders
  const filteredWorkOrders = workOrders.filter((wo) => {
    const matchesSearch =
      wo.work_order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.equipment_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = woStatusFilter === 'ALL' || wo.status === woStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Categories list
  const categories = ['ALL', ...Array.from(new Set(equipmentList.map((e) => e.category)))];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Equipment Inventory & Maintenance Work Orders
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Predictive machine health indexing, Remaining Useful Life (RUL) tracking, and service workflows.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchEquipmentData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
            title="Refresh Fleet Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          <button
            onClick={() => {
              if (equipmentList.length > 0 && !newEquipmentId) {
                setNewEquipmentId(equipmentList[0].equipment_id);
              }
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-900/30 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Work Order</span>
          </button>
        </div>
      </div>

      {/* ── Fleet Health Executive Summary KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Monitored Machinery */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
            <span>Total Assets</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{totalAssets}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{categories.length - 1} Operating Categories</span>
          </div>
        </div>

        {/* KPI 2: Fleet Avg Health Index */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
            <span>Fleet Health Index</span>
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
            <span>{avgHealth}%</span>
            <span className="text-xs font-semibold text-emerald-400">Nominal</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Predictive AI composite score
          </div>
        </div>

        {/* KPI 3: Predictive Attention / Degraded */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
            <span>Degraded Assets</span>
            <AlertTriangle className={`w-4 h-4 ${degradedAssets.length > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
            <span className={degradedAssets.length > 0 ? 'text-amber-400' : 'text-slate-200'}>
              {degradedAssets.length}
            </span>
            <span className="text-xs text-slate-400">/ {totalAssets}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {degradedAssets.length > 0 ? 'Maintenance attention advised' : 'All machines operational'}
          </div>
        </div>

        {/* KPI 4: Active Work Orders */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
            <span>Active Work Orders</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
            <span className="text-indigo-400">{activeWorkOrders.length}</span>
            <span className="text-xs text-slate-400">Open / Active</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lowestRulAsset ? `Min RUL: ${lowestRulAsset.estimated_rul_days}d (${lowestRulAsset.equipment_id})` : 'All healthy'}
          </div>
        </div>
      </div>

      {/* ── View Selection Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl max-w-fit">
          <button
            onClick={() => setActiveTab('EQUIPMENT')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'EQUIPMENT'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Equipment Machinery Grid</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/30">
              {equipmentList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('WORK_ORDERS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'WORK_ORDERS'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Work Orders Workflow</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/30">
              {workOrders.length}
            </span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, name, category..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
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

          {activeTab === 'EQUIPMENT' ? (
            <>
              {/* Equipment Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPERATIONAL">Operational</option>
                <option value="DEGRADED">Degraded</option>
                <option value="UNDER_MAINTENANCE">Maintenance</option>
                <option value="CRITICAL_FAULT">Critical Fault</option>
              </select>

              {/* Category Filter */}
              {categories.length > 2 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === 'ALL' ? 'All Categories' : c}
                    </option>
                  ))}
                </select>
              )}
            </>
          ) : (
            <select
              value={woStatusFilter}
              onChange={(e) => setWoStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Work Orders</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          )}
        </div>
      </div>

      {/* ── Content: Equipment Grid View ── */}
      {activeTab === 'EQUIPMENT' && (
        <div className="space-y-4">
          {filteredEquipment.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
              <Cpu className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-300">No machinery matching criteria</h3>
              <p className="text-xs text-slate-500 mt-1">Try clearing your filters or search keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEquipment.map((eq) => {
                const rul = eq.estimated_rul_days ?? 0;
                const rulStyle =
                  rul < 30
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    : rul < 60
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

                return (
                  <div
                    key={eq.id}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-xl hover:shadow-2xl flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header */}
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
                          <h3 className="font-bold text-white text-base mt-1.5 group-hover:text-blue-300 transition-colors">
                            {eq.name}
                          </h3>
                          <div className="text-xs text-slate-400 mt-0.5">{eq.category}</div>
                        </div>
                        <StatusBadge status={eq.status} />
                      </div>

                      {/* Health Score Gauge */}
                      <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Composite Health Index</span>
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
                            style={{ width: `${Math.min(Math.max(eq.health_score, 0), 100)}%` }}
                          />
                        </div>

                        {/* Sub-Health Breakdown */}
                        <div className="grid grid-cols-2 gap-3 pt-1 text-[11px] text-slate-400 border-t border-slate-850">
                          <div>
                            <div className="flex justify-between mb-0.5">
                              <span>Vibration Health</span>
                              <span className="font-mono text-slate-200">
                                {eq.vibration_health?.toFixed(0) ?? 95}%
                              </span>
                            </div>
                            <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${eq.vibration_health ?? 95}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-0.5">
                              <span>Thermal Health</span>
                              <span className="font-mono text-slate-200">
                                {eq.thermal_health?.toFixed(0) ?? 92}%
                              </span>
                            </div>
                            <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${eq.thermal_health ?? 92}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Telemetry Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 mb-4">
                        <div className="space-y-0.5">
                          <div className="text-slate-500 text-[10px] uppercase tracking-wider">Est. RUL</div>
                          <div className={`font-bold px-1.5 py-0.5 rounded border ${rulStyle}`}>
                            {rul} Days
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-slate-500 text-[10px] uppercase tracking-wider">Runtime</div>
                          <div className="font-bold text-slate-200">{eq.hours_operated ?? 0}h</div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-slate-500 text-[10px] uppercase tracking-wider">MTBF</div>
                          <div className="font-bold text-slate-200">{eq.mtbf_hours ?? 0}h</div>
                        </div>
                      </div>

                      {/* Service Timestamps */}
                      <div className="text-[11px] text-slate-400 space-y-1 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Last Service:</span>
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

                    {/* Card Footer Action */}
                    <div className="pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => openWorkOrderForEquipment(eq.equipment_id)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white text-xs font-semibold transition-all shadow-sm group-hover:bg-blue-600 group-hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Work Order</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Content: Work Orders Workflow Table ── */}
      {activeTab === 'WORK_ORDERS' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-400" />
                Active Work Orders Directory ({filteredWorkOrders.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Lifecycle tracking from initial dispatch to technician resolution.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Work Order #</th>
                  <th className="pb-3 font-semibold">Machine Target</th>
                  <th className="pb-3 font-semibold">Title & Description</th>
                  <th className="pb-3 font-semibold">Priority</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Scheduled</th>
                  <th className="pb-3 font-semibold text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredWorkOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No work orders found matching current filter.
                    </td>
                  </tr>
                ) : (
                  filteredWorkOrders.map((wo) => {
                    const priorityStyle =
                      wo.priority === 'URGENT'
                        ? 'bg-rose-950/80 text-rose-300 border-rose-800 shadow-sm shadow-rose-950'
                        : wo.priority === 'HIGH'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                        : wo.priority === 'MEDIUM'
                        ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700';

                    return (
                      <tr key={wo.id} className="hover:bg-slate-850/60 transition-colors">
                        <td className="py-3.5 font-mono font-bold text-blue-400">
                          {wo.work_order_number}
                        </td>
                        <td className="py-3.5 font-mono">
                          <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200">
                            {wo.equipment_id}
                          </span>
                        </td>
                        <td className="py-3.5 max-w-xs">
                          <div className="font-semibold text-white truncate">{wo.title}</div>
                          {wo.description && (
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {wo.description}
                            </div>
                          )}
                          {wo.technician_notes && (
                            <div className="text-[10px] text-emerald-400/90 italic mt-0.5">
                              Notes: {wo.technician_notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${priorityStyle}`}>
                            {wo.priority}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <StatusBadge status={wo.status} />
                        </td>
                        <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                          {wo.scheduled_date
                            ? new Date(wo.scheduled_date).toLocaleDateString()
                            : new Date(wo.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 text-right">
                          {wo.status === 'OPEN' && (
                            <button
                              onClick={() => handleUpdateWoStatus(wo.id, 'IN_PROGRESS')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-[11px] font-bold transition-all"
                            >
                              <Play className="w-3 h-3" />
                              <span>Start Work</span>
                            </button>
                          )}
                          {wo.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleUpdateWoStatus(wo.id, 'COMPLETED')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-[11px] font-bold transition-all"
                            >
                              <Check className="w-3 h-3" />
                              <span>Complete</span>
                            </button>
                          )}
                          {wo.status === 'COMPLETED' && (
                            <span className="text-[11px] text-emerald-400 font-medium inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Resolved
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modern Work Order Creation Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Maintenance Work Order</h3>
                  <p className="text-xs text-slate-400">Issue an authorized service directive for facility machinery.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Target Machinery Asset *</label>
                <select
                  value={newEquipmentId}
                  onChange={(e) => setNewEquipmentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.equipment_id}>
                      {eq.equipment_id} — {eq.name} ({eq.category}, Zone {eq.zone_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Directive / Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. High-pressure hydraulic seal replacement & thermal diagnostic"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Urgency & Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOW">Low (Routine)</option>
                    <option value="MEDIUM">Medium (Scheduled)</option>
                    <option value="HIGH">High (Urgent Degradation)</option>
                    <option value="URGENT">Urgent (Imminent Outage)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Scheduled Execution Date</label>
                  <input
                    type="date"
                    value={newScheduledDate}
                    onChange={(e) => setNewScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Service Instructions & Context</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detail symptoms, vibration anomaly thresholds, required replacement tooling, or safety lock-out procedures..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-900/30 disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Create Work Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
