import React, { useState } from 'react';
import {
  X,
  Flame,
  ThermometerSnowflake,
  Activity,
  Radio,
  WifiOff,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
} from 'lucide-react';
import { api } from '../../services/api';

interface SimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onHazardTriggered?: () => void;
}

export const SimulatorDrawer: React.FC<SimulatorDrawerProps> = ({ isOpen, onClose, onHazardTriggered }) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      type: 'GAS_LEAK',
      title: 'Combustible Gas & Smoke Leak',
      zoneId: 2,
      zoneName: 'Chemical Reactor & Solvent Bay',
      icon: Flame,
      color: 'border-rose-500/50 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40',
      description: 'Injects >280 ppm hydrocarbon solvent vapors into MQ-2 sensor node.',
    },
    {
      type: 'THERMAL_RUNAWAY',
      title: 'Reactor Thermal Runaway Exceedance',
      zoneId: 2,
      zoneName: 'Chemical Reactor & Solvent Bay',
      icon: ThermometerSnowflake,
      color: 'border-amber-500/50 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40',
      description: 'Simulates rapid heat exchanger failure pushing temperature to 88.5°C.',
    },
    {
      type: 'VIBRATION_SPIKE',
      title: 'CNC Spindle Harmonic Vibration Spike',
      zoneId: 1,
      zoneName: 'Machining & Milling Hall A',
      icon: Activity,
      color: 'border-purple-500/50 bg-purple-950/20 text-purple-300 hover:bg-purple-950/40',
      description: 'Simulates severe mechanical imbalance (9.4 mm/s RMS) on milling spindle.',
    },
    {
      type: 'WORKER_SOS',
      title: 'Worker Mobile Emergency SOS',
      zoneId: 1,
      zoneName: 'Machining & Milling Hall A',
      icon: Radio,
      color: 'border-red-500/50 bg-red-950/20 text-red-300 hover:bg-red-950/40',
      description: 'Triggers manual distress call from floor worker mobile app.',
    },
    {
      type: 'GATEWAY_DROP',
      title: 'Edge Gateway Disconnection Outage',
      zoneId: 6,
      zoneName: 'Central Industrial Control Room',
      icon: WifiOff,
      color: 'border-slate-500/50 bg-slate-800/40 text-slate-300 hover:bg-slate-800/60',
      description: 'Simulates physical Ethernet severing. Gateway initiates offline store-and-forward buffering.',
    },
    {
      type: 'RECONNECT_SYNC',
      title: 'Gateway Reconnect & Buffer Sync',
      zoneId: 6,
      zoneName: 'Central Industrial Control Room',
      icon: Play,
      color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40',
      description: 'Restores connection and synchronizes buffered events into database without loss.',
    },
  ];

  const handleInject = async (scenario: (typeof scenarios)[0]) => {
    try {
      setLoadingAction(scenario.type);
      setLastActionStatus(null);
      await api.injectSimulation(scenario.type, scenario.zoneId, 1, 'CRITICAL');
      setLastActionStatus(`Successfully injected ${scenario.title}!`);
      if (onHazardTriggered) onHazardTriggered();
    } catch (err: any) {
      setLastActionStatus(`Injection failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    try {
      setLoadingAction('RESET');
      setLastActionStatus(null);
      await api.resetSimulation();
      setLastActionStatus('Simulation baseline restored. All zones cleared.');
      if (onHazardTriggered) onHazardTriggered();
    } catch (err: any) {
      setLastActionStatus(`Reset failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
              Industrial Simulation Console
            </h3>
            <p className="text-xs text-slate-400">Inject operational hazards and test response workflows</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message */}
        {lastActionStatus && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-blue-950/60 border border-blue-800/80 text-xs text-blue-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-400" />
            <span>{lastActionStatus}</span>
          </div>
        )}

        {/* Scenarios List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Select Operational Scenario
          </div>

          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isLoading = loadingAction === sc.type;
            return (
              <div
                key={sc.type}
                className={`p-3.5 rounded-xl border transition-all ${sc.color} flex flex-col justify-between gap-2`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{sc.title}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/80 text-slate-300 shrink-0">
                    Zone {sc.zoneId}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{sc.description}</p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono text-slate-400">{sc.zoneName}</span>
                  <button
                    disabled={isLoading}
                    onClick={() => handleInject(sc)}
                    className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="animate-spin text-xs">...</span>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        Trigger
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
          <button
            onClick={handleReset}
            disabled={loadingAction === 'RESET'}
            className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span>Reset Simulation Baseline</span>
          </button>
          <div className="text-[10px] text-center text-slate-400 font-mono">
            All simulated events pass through identical validation and alerting workflows.
          </div>
        </div>
      </div>
    </div>
  );
};
