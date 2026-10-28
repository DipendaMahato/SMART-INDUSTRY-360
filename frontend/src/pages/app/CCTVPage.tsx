import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle2, XCircle, AlertTriangle, ShieldAlert, Eye } from 'lucide-react';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CameraSecurityEvent } from '../../types';

export const CCTVPage: React.FC = () => {
  const [cameras, setCameras] = useState<any[]>([]);
  const [events, setEvents] = useState<CameraSecurityEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CameraSecurityEvent | null>(null);
  const [notes, setNotes] = useState('');

  const fetchCCTVData = async () => {
    try {
      const c = await api.getCameras();
      setCameras(c);
      const ev = await api.getCCTVEvents();
      setEvents(ev);
      if (ev.length > 0 && !selectedEvent) setSelectedEvent(ev[0]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCCTVData();
  }, []);

  const handleVerify = async (status: 'VERIFIED' | 'FALSE_ALARM') => {
    if (!selectedEvent) return;
    try {
      await api.verifyCCTVEvent(selectedEvent.id, status, notes || undefined);
      setNotes('');
      fetchCCTVData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Camera className="w-6 h-6 text-blue-400" />
            CCTV & Physical Perimeter Security
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Explosion-proof optical sensor feeds, AI computer vision flags, and mandatory human verification review.
          </p>
        </div>
      </div>

      {/* Cameras Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cameras.map((cam) => (
          <div key={cam.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-blue-400">{cam.camera_id}</span>
                <h3 className="font-bold text-white text-sm">{cam.name}</h3>
              </div>
              <StatusBadge status={cam.status} />
            </div>

            {/* Stream Placeholder — actual feed requires on-site VMS integration */}
            <div className="w-full h-44 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#0f172a,#0f172a_10px,#111827_10px,#111827_20px)]" />
              <Camera className="relative z-10 w-8 h-8 text-slate-600" />
              <div className="relative z-10 text-center">
                <div className="text-[11px] font-mono text-slate-500">{cam.stream_url}</div>
                <div className="text-[10px] font-mono text-slate-600 mt-0.5">Live feed requires VMS integration</div>
              </div>
              <div className={`absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[10px] font-bold ${cam.status === 'ONLINE' ? 'bg-emerald-900/90 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cam.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                {cam.status === 'ONLINE' ? 'CONNECTED' : 'OFFLINE'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Security Events & Human Verification Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Vision Event Flags ({events.length})
          </div>
          {events.map((ev) => (
            <div
              key={ev.id}
              onClick={() => setSelectedEvent(ev)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                selectedEvent?.id === ev.id
                  ? 'bg-blue-950/30 border-blue-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-white">{ev.event_type}</span>
                <StatusBadge status={ev.human_verification_status} />
              </div>
              <div className="text-xs text-slate-400 font-mono">{ev.camera_name}</div>
              <div className="text-[10px] text-emerald-400 font-mono">
                AI Confidence: {(ev.confidence * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>

        {/* Verification Inspector */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 lg:col-span-2 space-y-4">
          {selectedEvent ? (
            <>
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono text-blue-400 font-bold">{selectedEvent.camera_id}</span>
                  <h3 className="text-lg font-bold text-white">{selectedEvent.event_type}</h3>
                  <div className="text-xs text-slate-400 font-mono">
                    Snapshot Timestamp: {new Date(selectedEvent.timestamp).toLocaleString()}
                  </div>
                </div>
                <StatusBadge status={selectedEvent.human_verification_status} />
              </div>

              {/* Snapshot Frame */}
              <div className="w-full h-56 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative flex flex-col items-center justify-center">
                {selectedEvent.frame_snapshot_url ? (
                  <>
                    <img
                      src={selectedEvent.frame_snapshot_url}
                      alt="Snapshot"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border-2 border-rose-500/80 pointer-events-none rounded-xl" />
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#0f172a,#0f172a_10px,#111827_10px,#111827_20px)]" />
                    <Camera className="relative z-10 w-8 h-8 text-slate-600 mb-1" />
                    <span className="relative z-10 text-[11px] font-mono text-slate-500">No frame snapshot captured</span>
                  </>
                )}
              </div>

              {/* Verification Controls */}
              {selectedEvent.human_verification_status === 'PENDING' ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-white uppercase font-mono">
                    Mandatory Human Verification Review
                  </div>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter review notes and worker identification..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVerify('VERIFIED')}
                      className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase"
                    >
                      Confirm Violation & Dispatch Guard
                    </button>
                    <button
                      onClick={() => handleVerify('FALSE_ALARM')}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase"
                    >
                      Mark False Alarm
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-950 text-xs text-slate-400">
                  Reviewed and verified. Notes: {selectedEvent.review_notes || 'None logged.'}
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Select an event flag to review camera snapshot and verify status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
