import React, { useState, useEffect } from 'react';
import {
  Layers,
  MapPin,
  Flame,
  Radio,
  Activity,
  Users,
  Footprints,
  AlertTriangle,
  RefreshCw,
  Info,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { useWebSocket } from '../../context/WebSocketContext';
import { StatusBadge } from '../../components/common/StatusBadge';

export const DigitalTwinPage: React.FC<{ plantId: number }> = ({ plantId }) => {
  const { subscribe } = useWebSocket();
  const [layout, setLayout] = useState<any>(null);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchLayout = async () => {
    try {
      const data = await api.getPlantLayout(plantId);
      setLayout(data);
      if (data?.zones?.length > 0 && !selectedZone) {
        setSelectedZone(data.zones[0]);
      } else if (selectedZone) {
        const updated = data.zones.find((z: any) => z.id === selectedZone.id);
        if (updated) setSelectedZone(updated);
      }
    } catch (err) {
      console.error('Failed to load digital twin layout:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayout();

    const unsubInc = subscribe('INCIDENT_CREATED', () => fetchLayout());
    const unsubIncUp = subscribe('INCIDENT_UPDATED', () => fetchLayout());
    const unsubHaz = subscribe('SIMULATION_HAZARD_INJECTED', () => fetchLayout());
    const unsubReset = subscribe('SIMULATION_RESET', () => fetchLayout());

    return () => {
      unsubInc();
      unsubIncUp();
      unsubHaz();
      unsubReset();
    };
  }, [plantId, subscribe]);

  const zones = layout?.zones || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-blue-400" />
            Interactive 2D Factory Digital Twin
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time spatial floor plan mapping production bays, sensor telemetry pins, active hazards, and evacuation routes.
          </p>
        </div>

        <button
          onClick={fetchLayout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Map</span>
        </button>
      </div>

      {/* Main Grid: SVG Floor Plan Map + Zone Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive SVG Factory Floor Plan */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
            <span>FACILITY BLUEPRINT: DETROIT MEGA-PLANT (FLOOR 1)</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/80" /> Clear
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/80" /> Warning
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500/80 animate-pulse" /> Evacuate
              </span>
            </div>
          </div>

          {/* SVG Map Container */}
          <div className="w-full overflow-x-auto bg-slate-950 rounded-xl p-4 border border-slate-800/80 shadow-inner">
            <svg
              viewBox="0 0 1180 740"
              className="w-full h-auto min-w-[700px] select-none"
              style={{ maxHeight: '540px' }}
            >
              {/* Plant Perimeter Background */}
              <rect x="20" y="20" width="1140" height="700" rx="16" fill="#090d16" stroke="#1e293b" strokeWidth="2" />

              {/* Central Walkway / Evacuation Corridor */}
              <rect x="440" y="40" width="20" height="660" fill="#1e293b" opacity="0.4" strokeDasharray="4 4" stroke="#475569" />
              <rect x="40" y="290" width="820" height="20" fill="#1e293b" opacity="0.4" strokeDasharray="4 4" stroke="#475569" />

              {/* Render Zones */}
              {zones.map((zone: any) => {
                const geo = zone.svg_layout || { x: 50, y: 50, width: 300, height: 200, label: zone.name };
                const isSelected = selectedZone?.id === zone.id;
                const isEvacuate = zone.hazard_status === 'EVACUATE';
                const isWarning = zone.hazard_status === 'WARNING';

                let fillColor = '#0f172a';
                let strokeColor = '#334155';
                if (isEvacuate) {
                  fillColor = '#881337'; // Rose 900
                  strokeColor = '#f43f5e'; // Rose 500
                } else if (isWarning) {
                  fillColor = '#78350f'; // Amber 900
                  strokeColor = '#f59e0b'; // Amber 500
                } else if (isSelected) {
                  strokeColor = '#3b82f6';
                }

                return (
                  <g
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className="cursor-pointer transition-all"
                  >
                    {/* Zone Rect */}
                    <rect
                      x={geo.x}
                      y={geo.y}
                      width={geo.width}
                      height={geo.height}
                      rx="12"
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? '3' : '1.5'}
                      className="hover:opacity-90"
                    />

                    {/* Zone Title */}
                    <text
                      x={geo.x + 18}
                      y={geo.y + 32}
                      fill="#f8fafc"
                      fontSize="14"
                      fontWeight="bold"
                      fontFamily="system-ui"
                    >
                      {zone.name}
                    </text>

                    {/* Zone Code & Type */}
                    <text
                      x={geo.x + 18}
                      y={geo.y + 52}
                      fill="#94a3b8"
                      fontSize="11"
                      fontFamily="monospace"
                    >
                      {zone.code} • {zone.zone_type}
                    </text>

                    {/* Sensor Node Indicator Dots */}
                    {zone.devices?.map((d: any, dIdx: number) => (
                      <circle
                        key={d.id}
                        cx={geo.x + 30 + dIdx * 24}
                        cy={geo.y + geo.height - 30}
                        r="6"
                        fill={d.status === 'ONLINE' ? '#10b981' : d.status === 'CRITICAL' ? '#ef4444' : '#f59e0b'}
                        stroke="#0f172a"
                        strokeWidth="2"
                      />
                    ))}

                    {/* Active Hazard Badge */}
                    {isEvacuate && (
                      <g transform={`translate(${geo.x + geo.width - 110}, ${geo.y + 15})`}>
                        <rect width="95" height="24" rx="6" fill="#e11d48" />
                        <text x="47" y="16" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                          EVACUATE
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Muster Points */}
              <g transform="translate(60, 40)">
                <rect width="180" height="26" rx="6" fill="#065f46" stroke="#10b981" strokeWidth="1" />
                <text x="90" y="17" fill="#a7f3d0" fontSize="10" fontWeight="bold" textAnchor="middle">
                  MUSTER POINT NORTH (EXIT)
                </text>
              </g>
            </svg>
          </div>
          <div className="text-[11px] text-slate-500 font-mono text-center">
            Click any production bay to inspect active telemetry, mapped sensor nodes, and emergency response actions.
          </div>
        </div>

        {/* Selected Zone Inspector Drawer */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          {selectedZone ? (
            <>
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="text-xs font-mono text-blue-400 font-bold">{selectedZone.code}</div>
                  <h3 className="text-lg font-bold text-white">{selectedZone.name}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">{selectedZone.zone_type}</div>
                </div>
                <StatusBadge status={selectedZone.hazard_status} pulse={selectedZone.hazard_status === 'EVACUATE'} />
              </div>

              {/* Occupancy and Hazard Stat */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>Occupancy</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-white">
                    {selectedZone.current_occupancy} / {selectedZone.max_occupancy}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Evac Route</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">Approved & Clear</div>
                </div>
              </div>

              {/* Active Incidents in Zone */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Active Incidents in Zone ({selectedZone.active_incidents?.length || 0})
                </div>
                {selectedZone.active_incidents?.length === 0 ? (
                  <div className="p-3 rounded-lg bg-slate-950 text-xs text-slate-500">
                    No active emergency incidents in this sector.
                  </div>
                ) : (
                  selectedZone.active_incidents.map((inc: any) => (
                    <div key={inc.id} className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-rose-300">
                        <span>{inc.incident_number}</span>
                        <StatusBadge status={inc.status} />
                      </div>
                      <div className="text-slate-200 font-semibold">{inc.title}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Mapped Sensors */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Mapped Sensor Nodes ({selectedZone.devices?.length || 0})
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedZone.devices?.map((d: any) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white">{d.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{d.device_id}</div>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Select a factory zone on the map to inspect telemetry and device topology.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
