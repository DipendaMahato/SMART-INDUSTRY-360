import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Radio,
  Flame,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Bell,
  ArrowLeft,
  Send,
  UserCheck,
  Footprints,
  PhoneCall,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { StatusBadge } from '../../components/common/StatusBadge';

export const WorkerPortalPage: React.FC = () => {
  const { user } = useAuth();
  const { isConnected, subscribe } = useWebSocket();
  const [selectedZone, setSelectedZone] = useState<number>(1);
  const [zones, setZones] = useState<any[]>([]);
  const [sosActive, setSosActive] = useState<boolean>(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [sosDispatched, setSosDispatched] = useState<boolean>(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentCategory, setIncidentCategory] = useState('HAZARDOUS_GAS');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const z = await api.getZones(1);
        setZones(z);
        const a = await api.getAlerts();
        setActiveAlerts(a.filter((al) => al.delivery_status !== 'ACKNOWLEDGED'));
      } catch (err) {
        console.error('Error loading worker portal data:', err);
      }
    };
    loadData();

    const unsubAlert = subscribe('ALERT_DISPATCHED', (payload) => {
      setActiveAlerts((prev) => [payload, ...prev]);
    });

    return () => {
      unsubAlert();
    };
  }, [subscribe]);

  // Handle SOS hold or countdown
  const initiateSos = () => {
    if (sosCountdown !== null || sosDispatched) return;
    setSosCountdown(3);
    const interval = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev === null) {
          clearInterval(interval);
          return null;
        }
        if (prev <= 1) {
          clearInterval(interval);
          executeSosDispatch();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSosCountdown = () => {
    setSosCountdown(null);
  };

  const executeSosDispatch = async () => {
    try {
      setSosActive(true);
      await api.triggerWorkerSOS(selectedZone, `Worker ${user?.full_name || 'Anonymous'} pressed SOS button`);
      setSosDispatched(true);
    } catch (err) {
      console.error('SOS dispatch error:', err);
    }
  };

  const handleManualReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createIncident({
        plant_id: 1,
        zone_id: selectedZone,
        category: incidentCategory,
        severity: 'HIGH',
        detection_method: 'MANUAL_REPORT',
        title: incidentTitle || `${incidentCategory} reported by frontline worker`,
        description: incidentDesc || 'Observed by floor worker through Mobile Safety Portal',
        assigned_team: 'Safety Response Team',
      });
      setReportSuccess('Hazard report transmitted to Control Room dispatch!');
      setIncidentTitle('');
      setIncidentDesc('');
      setTimeout(() => setReportSuccess(null), 5000);
    } catch (err: any) {
      alert(`Report failed: ${err.message}`);
    }
  };

  const handleAcknowledgeAlert = async (id: number) => {
    try {
      await api.acknowledgeAlert(id, 'Acknowledged on Worker Mobile Handheld');
      setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const currentZoneObj = zones.find((z) => z.id === selectedZone);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto border-x border-slate-900 shadow-2xl">
      {/* Top Header */}
      <header className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Portal</span>
        </Link>
        <div className="text-center">
          <div className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5 justify-center">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            WORKER SAFETY PORTAL
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {user?.full_name || 'Worker Alex Morgan'} • {isConnected ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>
        <Link to="/app/overview" className="text-xs font-bold text-blue-400 hover:text-blue-300">
          Command
        </Link>
      </header>

      {/* Main Body */}
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {/* Zone Selector & Check-In */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              Current Assigned Production Bay
            </span>
            <span className="font-mono text-emerald-400 text-[11px]">CHECKED IN</span>
          </div>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                Zone {z.id}: {z.name} ({z.hazard_status})
              </option>
            ))}
          </select>
          {currentZoneObj?.hazard_status === 'EVACUATE' && (
            <div className="p-2 rounded bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-bold animate-pulse flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>EVACUATION ORDER ACTIVE FOR THIS ZONE!</span>
            </div>
          )}
        </div>

        {/* SOS Emergency Distress Hero Button */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-rose-950/40 to-slate-900 border border-rose-900/60 text-center space-y-4">
          <div className="text-xs font-bold text-rose-400 uppercase tracking-widest font-mono">
            EMERGENCY DISTRESS ALARM
          </div>

          {sosDispatched ? (
            <div className="p-4 rounded-xl bg-rose-900/80 border border-rose-600 text-white space-y-2 animate-bounce">
              <div className="font-black text-lg">DISTRESS DISPATCHED!</div>
              <p className="text-xs text-rose-100">
                Medical and Safety teams notified. Siren activated in {currentZoneObj?.name}. Stay calm and move towards nearest emergency exit.
              </p>
            </div>
          ) : sosCountdown !== null ? (
            <div className="space-y-3">
              <div className="text-4xl font-black text-rose-500 font-mono animate-ping">
                {sosCountdown}
              </div>
              <p className="text-xs text-rose-300">Dispatching emergency extraction alert...</p>
              <button
                onClick={cancelSosCountdown}
                className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider border border-slate-600 transition-colors"
              >
                Cancel SOS
              </button>
            </div>
          ) : (
            <button
              onClick={initiateSos}
              className="w-36 h-36 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-2xl tracking-wider uppercase shadow-2xl shadow-rose-950 border-4 border-rose-400/80 flex flex-col items-center justify-center mx-auto transition-transform"
            >
              <Radio className="w-8 h-8 mb-1 animate-pulse" />
              <span>SOS</span>
              <span className="text-[10px] font-sans font-normal opacity-90 tracking-normal">TAP TO TRIGGER</span>
            </button>
          )}

          <p className="text-[11px] text-slate-400">
            Triggers audible siren, notifies Control Room, and directs rapid response unit to your zone.
          </p>
        </div>

        {/* Active Emergency Broadcasts / Alerts */}
        {activeAlerts.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-bold">
              <Bell className="w-3.5 h-3.5" />
              Personal Safety Broadcasts ({activeAlerts.length})
            </div>
            {activeAlerts.map((alt) => (
              <div
                key={alt.id}
                className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-xs space-y-2"
              >
                <div className="flex items-center justify-between font-bold text-amber-200">
                  <span>{alt.title}</span>
                  <StatusBadge status={alt.alert_level} />
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{alt.message}</p>
                <button
                  onClick={() => handleAcknowledgeAlert(alt.id)}
                  className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Confirm Safe & Acknowledge
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Hazard Incident Reporting Form */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-blue-400" />
            Report Industrial Hazard
          </div>

          {reportSuccess && (
            <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{reportSuccess}</span>
            </div>
          )}

          <form onSubmit={handleManualReport} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Hazard Category</label>
              <select
                value={incidentCategory}
                onChange={(e) => setIncidentCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="HAZARDOUS_GAS">Hazardous Gas Odor / Leak</option>
                <option value="FIRE_SMOKE">Smoke or Visible Sparking</option>
                <option value="EQUIPMENT_ELECTRICAL_FAULT">Machine Jam or Electrical Arching</option>
                <option value="WORKER_FALL_INJURY">Worker Slip / Fall / Injury</option>
                <option value="RESTRICTED_ZONE_BREACH">Blocked Exit / Obstruction</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Brief Description</label>
              <textarea
                rows={2}
                value={incidentDesc}
                onChange={(e) => setIncidentDesc(e.target.value)}
                placeholder="Describe exact machine or location..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
            >
              <Send className="w-3 h-3" />
              <span>Submit Hazard Report</span>
            </button>
          </form>
        </div>

        {/* Muster Point Instructions */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Footprints className="w-3.5 h-3.5 text-emerald-400" />
            Emergency Evacuation Instructions
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Upon continuous siren sounding: Exit through designated fire doors to <strong>Muster Point Alpha (North Parking Lot)</strong>. Do not use elevators or return for personal items.
          </p>
        </div>
      </div>
    </div>
  );
};
