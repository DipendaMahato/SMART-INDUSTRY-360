import React, { useState, useEffect } from 'react';
import {
  Flame,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertOctagon,
  RefreshCw,
  Plus,
  Send,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useWebSocket } from '../../context/WebSocketContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Incident, IncidentStatus } from '../../types';

export const EmergencyCenterPage: React.FC<{ plantId: number }> = ({ plantId }) => {
  const { user } = useAuth();
  const { subscribe } = useWebSocket();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    try {
      const data = await api.getIncidents(plantId);
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0]);
      } else if (selectedIncident) {
        const updated = data.find((i: Incident) => i.id === selectedIncident.id);
        if (updated) setSelectedIncident(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();

    const unsubInc = subscribe('INCIDENT_CREATED', () => fetchIncidents());
    const unsubIncUp = subscribe('INCIDENT_UPDATED', () => fetchIncidents());

    return () => {
      unsubInc();
      unsubIncUp();
    };
  }, [plantId, subscribe]);

  const handleAcknowledge = async (id: number) => {
    try {
      const updated = await api.acknowledgeIncident(id);
      setSelectedIncident(updated);
      fetchIncidents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTransition = async (status: IncidentStatus) => {
    if (!selectedIncident) return;
    try {
      const updated = await api.transitionIncident(selectedIncident.id, {
        status,
        resolution_notes: resolutionNotes || undefined,
      });
      setSelectedIncident(updated);
      setResolutionNotes('');
      fetchIncidents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredIncidents = incidents.filter((i) => {
    const matchesSearch =
      i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.incident_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
    const matchesSeverity = severityFilter === 'ALL' || i.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <div className="p-6 lg:p-8 space-y-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Flame className="w-6 h-6 text-rose-500" />
            Emergency Center & Incident Coordination
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Standardized incident lifecycle: NEW → ACKNOWLEDGED → RESPONDING → CONTAINED → RESOLVED with audit logging.
          </p>
        </div>

        <button
          onClick={fetchIncidents}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Incidents</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search incident number, title, or category..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Lifecycles</option>
            <option value="NEW">New</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESPONDING">Responding</option>
            <option value="CONTAINED">Contained</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Main Two-Column Incident Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {/* Left: Incident List */}
        <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
          {filteredIncidents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
              No matching incidents found.
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'bg-slate-850 border-blue-500 shadow-lg shadow-blue-950/40'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-300">{inc.incident_number}</span>
                    <StatusBadge status={inc.status} />
                  </div>

                  <h3 className="text-sm font-semibold text-white leading-snug">{inc.title}</h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Zone {inc.zone_id}</span>
                    <span className="uppercase font-bold text-rose-400">{inc.severity}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Incident Lifecycle & Actions */}
        <div className="p-7 rounded-2xl bg-slate-900 border border-slate-800 lg:col-span-2 space-y-7">
          {selectedIncident ? (
            <>
              {/* Incident Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-blue-400">
                      {selectedIncident.incident_number}
                    </span>
                    <StatusBadge status={selectedIncident.status} pulse={selectedIncident.status === 'NEW'} />
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {selectedIncident.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{selectedIncident.title}</h2>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    Detection Method: {selectedIncident.detection_method} • Zone {selectedIncident.zone_id}
                  </div>
                </div>

                <div className="text-right text-xs font-mono text-slate-400">
                  <div>Created: {new Date(selectedIncident.created_at).toLocaleTimeString()}</div>
                  {selectedIncident.acknowledged_at && (
                    <div className="text-emerald-400">
                      Ack: {new Date(selectedIncident.acknowledged_at).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Description & Evidence */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  Telemetry Evidence & Report Details
                </div>
                <p className="leading-relaxed">{selectedIncident.description}</p>
                {selectedIncident.device_id && (
                  <div className="text-[11px] font-mono text-blue-400 pt-1">
                    Associated Device Node: {selectedIncident.device_id}
                  </div>
                )}
              </div>

              {/* Lifecycle Step Progression */}
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Documented Emergency Lifecycle
                </div>
                <div className="grid grid-cols-5 gap-2 text-center text-xs font-semibold">
                  {(['NEW', 'ACKNOWLEDGED', 'RESPONDING', 'CONTAINED', 'RESOLVED'] as IncidentStatus[]).map((step, idx) => {
                    const activeIndex = ['NEW', 'ACKNOWLEDGED', 'RESPONDING', 'CONTAINED', 'RESOLVED'].indexOf(
                      selectedIncident.status
                    );
                    const isPassed = activeIndex >= idx;
                    return (
                      <div
                        key={step}
                        className={`p-2 rounded-lg border text-[11px] font-mono ${
                          isPassed
                            ? 'bg-blue-950/80 text-blue-300 border-blue-700/80 font-bold'
                            : 'bg-slate-950 text-slate-600 border-slate-800'
                        }`}
                      >
                        {step}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lifecycle Actions */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Operator Response Controls
                </div>

                {selectedIncident.status === 'NEW' && (
                  <button
                    onClick={() => handleAcknowledge(selectedIncident.id)}
                    className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Acknowledge Incident & Halt Auto-Escalation</span>
                  </button>
                )}

                {['ACKNOWLEDGED', 'RESPONDING', 'CONTAINED'].includes(selectedIncident.status) && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {selectedIncident.status === 'ACKNOWLEDGED' && (
                        <button
                          onClick={() => handleTransition('RESPONDING')}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase"
                        >
                          Dispatch Response Team
                        </button>
                      )}
                      {selectedIncident.status === 'RESPONDING' && (
                        <button
                          onClick={() => handleTransition('CONTAINED')}
                          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase"
                        >
                          Mark Hazard Contained
                        </button>
                      )}
                      <button
                        onClick={() => handleTransition('RESOLVED')}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase"
                      >
                        Declare Resolved
                      </button>
                      <button
                        onClick={() => handleTransition('FALSE_ALARM')}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs uppercase border border-slate-700"
                      >
                        Classify as False Alarm
                      </button>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-xs mb-1">Response / Resolution Notes</label>
                      <textarea
                        rows={2}
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Detail remediation actions taken..."
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {selectedIncident.status === 'RESOLVED' && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Incident closed and archived. Resolution Notes: {selectedIncident.resolution_notes || 'All safe.'}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500">
              Select an incident from the left column to view details and execute response workflows.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
