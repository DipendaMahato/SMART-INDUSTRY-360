import React, { useState, useEffect } from 'react';
import { TrendingUp, Wrench, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { Equipment } from '../../types';

export const MaintenancePage: React.FC<{ plantId: number }> = ({ plantId }) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  useEffect(() => {
    api.getEquipment(plantId).then(setEquipment).catch(console.error);
  }, [plantId]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            Predictive Maintenance & RUL Health Index
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Machine learning remaining useful life (RUL) estimation, vibration harmonic analysis, and thermal aging.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {equipment.map((eq) => (
          <div key={eq.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div>
              <span className="font-mono text-xs font-bold text-blue-400">{eq.equipment_id}</span>
              <h3 className="font-bold text-white text-base mt-0.5">{eq.name}</h3>
              <div className="text-xs text-slate-400">{eq.category}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Estimated RUL</span>
                <span className="text-lg font-bold text-emerald-400">{eq.estimated_rul_days} Days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Vibration Integrity</span>
                <span className="font-bold text-blue-400">{eq.vibration_health.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Thermal Health</span>
                <span className="font-bold text-purple-400">{eq.thermal_health.toFixed(1)}%</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
              <span>Operating Hours: {eq.hours_operated}h</span>
              <span>MTBF: {eq.mtbf_hours}h</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
