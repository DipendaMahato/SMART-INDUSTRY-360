import React, { useState, useEffect } from 'react';
import { Radio, Plus, Terminal, RefreshCw, CheckCircle2, Sliders } from 'lucide-react';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Device } from '../../types';

export const DevicesPage: React.FC<{ plantId: number }> = ({ plantId }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [cmdFeedback, setCmdFeedback] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newDevId, setNewDevId] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('GAS_DETECTOR');
  const [newZoneId, setNewZoneId] = useState(1);

  const fetchDevices = async () => {
    try {
      const data = await api.getDevices(plantId);
      setDevices(data);
      if (data.length > 0 && !selectedDevice) setSelectedDevice(data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [plantId]);

  const handleSendCommand = async (cmd: string) => {
    if (!selectedDevice) return;
    try {
      setCmdFeedback(null);
      const res = await api.sendDeviceCommand(selectedDevice.device_id, cmd);
      setCmdFeedback(`Command '${cmd}' dispatched successfully to ${selectedDevice.device_id}`);
      setTimeout(() => setCmdFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.registerDevice({
        device_id: newDevId,
        plant_id: plantId,
        zone_id: newZoneId,
        name: newName,
        device_type: newType,
      });
      setShowRegisterModal(false);
      setNewDevId('');
      setNewName('');
      fetchDevices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-emerald-400" />
            Sensors & Industrial IoT Device Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authenticated hardware device management, calibration tracking, and authorized command execution.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Register IoT Device</span>
        </button>
      </div>

      {cmdFeedback && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{cmdFeedback}</span>
        </div>
      )}

      {/* Main Grid: Devices Table + Command Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 lg:col-span-2 overflow-x-auto shadow-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="pb-3">Device ID</th>
                <th className="pb-3">Name</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Zone</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Firmware</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {devices.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setSelectedDevice(d)}
                  className={`cursor-pointer transition-colors ${
                    selectedDevice?.id === d.id ? 'bg-blue-950/30' : 'hover:bg-slate-850/50'
                  }`}
                >
                  <td className="py-3 font-mono font-bold text-blue-400">{d.device_id}</td>
                  <td className="py-3 font-semibold text-white">{d.name}</td>
                  <td className="py-3 text-slate-400">{d.device_type}</td>
                  <td className="py-3 font-mono text-slate-300">Zone {d.zone_id}</td>
                  <td className="py-3">
                    <StatusBadge status={d.connection_status} />
                  </td>
                  <td className="py-3 font-mono text-slate-400 text-[11px]">{d.firmware_version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Command Panel */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
            <Terminal className="w-4 h-4 text-blue-400" />
            Device Control & Diagnostics
          </h3>

          {selectedDevice ? (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono">
                <div className="text-blue-400 font-bold">{selectedDevice.device_id}</div>
                <div className="text-white font-sans">{selectedDevice.name}</div>
                <div className="text-slate-500 text-[11px]">IP: {selectedDevice.ip_address}</div>
                <div className="text-slate-500 text-[11px]">MAC: {selectedDevice.mac_address}</div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Authorized Remote Commands
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSendCommand('RECALIBRATE')}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase"
                  >
                    Recalibrate ADC
                  </button>
                  <button
                    onClick={() => handleSendCommand('SELF_TEST')}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase"
                  >
                    Self Diagnostic
                  </button>
                  <button
                    onClick={() => handleSendCommand('SIREN_ON')}
                    className="p-2 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs uppercase"
                  >
                    Test Siren Siren ON
                  </button>
                  <button
                    onClick={() => handleSendCommand('SIREN_OFF')}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase"
                  >
                    Silence Siren
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Select a device to view hardware details and issue commands.
            </div>
          )}
        </div>
      </div>

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Register IoT Device Node</h3>
            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Device ID (Unique)</label>
                <input
                  type="text"
                  required
                  value={newDevId}
                  onChange={(e) => setNewDevId(e.target.value)}
                  placeholder="e.g. DEV-GAS-02"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Reactor Bay Backup Gas Sensor"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Device Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                >
                  <option value="GAS_DETECTOR">Gas Detector (MQ-2/MQ-135)</option>
                  <option value="ENVIRONMENTAL_STATION">Environmental Station (DHT22/PT100)</option>
                  <option value="VIBRATION_SENSOR">Vibration Sensor (SW-420)</option>
                  <option value="PHYSICAL_SOS">Physical SOS Pillar</option>
                  <option value="EDGE_GATEWAY">Edge Gateway</option>
                  <option value="CCTV_CAMERA">CCTV Node</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assigned Zone</label>
                <select
                  value={newZoneId}
                  onChange={(e) => setNewZoneId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                >
                  <option value={1}>Zone 1: Machining & Milling Hall A</option>
                  <option value={2}>Zone 2: Chemical Reactor & Solvent Bay</option>
                  <option value={3}>Zone 3: High-Voltage Transformer Yard</option>
                  <option value={4}>Zone 4: Automated Robotic Assembly Bay</option>
                  <option value={5}>Zone 5: Finished Goods Logistics Hub</option>
                  <option value={6}>Zone 6: Central Industrial Control Room</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
