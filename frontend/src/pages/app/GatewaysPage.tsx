import React, { useState, useEffect } from 'react';
import { Network, Wifi, WifiOff, RefreshCw, CheckCircle2, RotateCcw } from 'lucide-react';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { GatewayHealth } from '../../types';

export const GatewaysPage: React.FC<{ plantId: number }> = ({ plantId }) => {
  const [gateways, setGateways] = useState<GatewayHealth[]>([]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const fetchGateways = async () => {
    try {
      const data = await api.getGateways(plantId);
      setGateways(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGateways();
  }, [plantId]);

  const handleSyncBuffer = async (gw: GatewayHealth) => {
    try {
      const dummyBuffer = [
        { device_id: 'DEV-GAS-01', zone_id: 2, metric_name: 'combustible_gas', metric_value: 32.1, unit: 'ppm', status: 'NORMAL' },
        { device_id: 'DEV-ENV-01', zone_id: 1, metric_name: 'temperature', metric_value: 24.8, unit: '°C', status: 'NORMAL' },
      ];
      const res = await api.syncGatewayBuffer(gw.gateway_id, dummyBuffer);
      setSyncStatus(`Flushed ${res.synced_events} buffered edge frames into central telemetry database!`);
      fetchGateways();
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Network className="w-6 h-6 text-emerald-400" />
            Communication & Edge Gateway Health
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            MQTT broker connectivity, ping latency, packet loss, and offline store-and-forward edge buffer sync.
          </p>
        </div>

        <button
          onClick={fetchGateways}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Ping Gateways</span>
        </button>
      </div>

      {syncStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Gateway Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {gateways.map((gw) => (
          <div key={gw.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-blue-400">{gw.gateway_id}</span>
                <h3 className="font-bold text-white text-base mt-0.5">{gw.name}</h3>
                <div className="text-xs text-slate-400 font-mono">IP: {gw.ip_address}</div>
              </div>
              <StatusBadge status={gw.status} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="text-slate-400">LATENCY</div>
                <div className="font-bold text-emerald-400">{gw.ping_latency_ms} ms</div>
              </div>
              <div>
                <div className="text-slate-400">PACKET LOSS</div>
                <div className="font-bold text-white">{gw.packet_loss_percent}%</div>
              </div>
              <div>
                <div className="text-slate-400">OFFLINE BUFFER</div>
                <div className="font-bold text-amber-400">{gw.buffered_events_count} frames</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] font-mono text-slate-500">
                Broker: {gw.broker_connected ? 'CONNECTED (Port 1883)' : 'DISCONNECTED'}
              </span>
              <button
                onClick={() => handleSyncBuffer(gw)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sync Buffer</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
