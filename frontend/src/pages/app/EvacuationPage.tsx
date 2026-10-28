import React, { useState, useEffect } from 'react';
import { Footprints, AlertTriangle, CheckCircle2, Play, RefreshCw, DoorOpen } from 'lucide-react';
import { api } from '../../services/api';
import { EvacuationPlan } from '../../types';

export const EvacuationPage: React.FC<{ plantId: number }> = ({ plantId }) => {
  const [plans, setPlans] = useState<EvacuationPlan[]>([]);
  const [drillActive, setDrillActive] = useState(false);
  const [drillMessage, setDrillMessage] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      const data = await api.getEvacuationPlans(plantId);
      setPlans(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [plantId]);

  const handleToggleBlock = async (plan: EvacuationPlan) => {
    try {
      const newBlocked = !plan.is_blocked;
      const reason = newBlocked ? 'Simulated structural smoke blockage' : undefined;
      await api.toggleRouteBlock(plan.id, newBlocked, reason);
      fetchPlans();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTriggerDrill = async () => {
    try {
      const res = await api.simulateDrill(plantId);
      setDrillActive(true);
      setDrillMessage(res.message);
      setTimeout(() => {
        setDrillActive(false);
        setDrillMessage(null);
      }, 8000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Footprints className="w-6 h-6 text-emerald-400" />
            Evacuation Planning & Assembly Routing
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic emergency egress corridor status, muster point allocation, and plant-wide evacuation drills.
          </p>
        </div>

        <button
          onClick={handleTriggerDrill}
          disabled={drillActive}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950 disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          <span>{drillActive ? 'Evacuation Drill Active...' : 'Initiate Evacuation Drill'}</span>
        </button>
      </div>

      {drillMessage && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-white text-xs font-bold flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span>{drillMessage}</span>
        </div>
      )}

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`p-5 rounded-2xl bg-slate-900 border transition-all space-y-4 shadow-xl ${
              p.is_blocked ? 'border-rose-600/80 bg-rose-950/10' : 'border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-blue-400">ZONE {p.zone_id} PLAN</span>
                <h3 className="font-bold text-white text-base mt-0.5">{p.primary_route_name}</h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  p.is_blocked
                    ? 'bg-rose-950 text-rose-400 border-rose-800'
                    : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                }`}
              >
                {p.is_blocked ? 'ROUTE BLOCKED' : 'ROUTE CLEAR'}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-slate-400" />
                <span>Exit Door: <strong className="text-white font-mono">{p.exit_door_id}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Footprints className="w-4 h-4 text-emerald-400" />
                <span>Assembly: <strong className="text-emerald-300">{p.assembly_point_name}</strong></span>
              </div>
              {p.is_blocked && (
                <div className="p-2 rounded bg-rose-950/50 border border-rose-800 text-rose-300 text-[11px]">
                  Reason: {p.blocked_reason} • Re-routing workers to secondary egress!
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => handleToggleBlock(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${
                  p.is_blocked
                    ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800'
                    : 'bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800'
                }`}
              >
                {p.is_blocked ? 'Unblock Egress Corridor' : 'Simulate Route Obstruction'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
