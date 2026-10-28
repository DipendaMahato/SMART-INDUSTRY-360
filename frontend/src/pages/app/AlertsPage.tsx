import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  ShieldAlert,
  Send,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { useWebSocket } from '../../context/WebSocketContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { NotificationAlert } from '../../types';

export const AlertsPage: React.FC = () => {
  const { subscribe } = useWebSocket();
  const [alerts, setAlerts] = useState<NotificationAlert[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
      const s = await api.getAlertStats();
      setStats(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const unsubAlert = subscribe('ALERT_DISPATCHED', () => fetchAlerts());
    const unsubAck = subscribe('ALERT_ACKNOWLEDGED', () => fetchAlerts());
    const unsubEsc = subscribe('ALERT_ESCALATED', () => fetchAlerts());

    return () => {
      unsubAlert();
      unsubAck();
      unsubEsc();
    };
  }, [subscribe]);

  const handleAcknowledge = async (id: number) => {
    try {
      await api.acknowledgeAlert(id, 'Acknowledged from Notification Center');
      fetchAlerts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRetry = async (id: number) => {
    try {
      await api.retryAlert(id);
      fetchAlerts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter === 'ALL') return true;
    return a.delivery_status === statusFilter;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-amber-500" />
            Alerts & Outbox Notification Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Persistent notification outbox tracking delivery status, escalation tier deadlines, and receipts.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Outbox</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase">Total Outbox Dispatches</div>
          <div className="text-2xl font-black font-mono text-white mt-1">{stats?.total_alerts || alerts.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase">Acknowledged</div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{stats?.acknowledged ?? 0}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase">Escalated (Tier &gt; 1)</div>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">{stats?.escalated ?? 0}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase">Delivery Success Rate</div>
          <div className="text-2xl font-black font-mono text-blue-400 mt-1">{stats?.delivery_rate_percent != null ? `${stats.delivery_rate_percent}%` : '—'}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        {['ALL', 'DELIVERED', 'ACKNOWLEDGED', 'FAILED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              statusFilter === tab
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Alerts Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="pb-3">Alert ID</th>
              <th className="pb-3">Severity</th>
              <th className="pb-3">Channel / Target</th>
              <th className="pb-3">Message</th>
              <th className="pb-3">Escalation</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No notifications recorded for this filter.
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alt) => (
                <tr key={alt.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 font-mono font-bold text-slate-300">ALT-{alt.id.toString().padStart(4, '0')}</td>
                  <td className="py-3">
                    <StatusBadge status={alt.alert_level} pulse={alt.alert_level === 'CRITICAL'} />
                  </td>
                  <td className="py-3 font-mono text-slate-400">
                    <span className="text-blue-400 font-semibold">{alt.channel}</span> → {alt.recipient_group}
                  </td>
                  <td className="py-3 max-w-xs truncate text-slate-200" title={alt.message}>
                    {alt.title}
                  </td>
                  <td className="py-3 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alt.escalation_level > 1 ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'text-slate-400'
                      }`}
                    >
                      Tier {alt.escalation_level}
                    </span>
                  </td>
                  <td className="py-3">
                    <StatusBadge status={alt.delivery_status} />
                  </td>
                  <td className="py-3 text-right space-x-2">
                    {alt.delivery_status !== 'ACKNOWLEDGED' && (
                      <button
                        onClick={() => handleAcknowledge(alt.id)}
                        className="px-2.5 py-1 rounded bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-400 font-bold border border-emerald-800/80 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alt.delivery_status === 'FAILED' && (
                      <button
                        onClick={() => handleRetry(alt.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 transition-colors"
                      >
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
