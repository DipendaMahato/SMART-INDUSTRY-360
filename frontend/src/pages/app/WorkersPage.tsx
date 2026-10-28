import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, ShieldCheck, MapPin, Heart, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { Worker } from '../../types';

export const WorkersPage: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchWorkers = async () => {
    try {
      const data = await api.getWorkers();
      setWorkers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const filtered = workers.filter(
    (w) =>
      w.badge_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-purple-400" />
            Workers & Emergency Response Teams
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time on-site personnel accounting, zone localization, and emergency contacts.
          </p>
        </div>

        <button
          onClick={fetchWorkers}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by badge number or department..."
          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Roster Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((w) => (
          <div key={w.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-blue-400">{w.badge_number}</span>
                <h3 className="font-bold text-white text-base mt-0.5">{w.department}</h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  w.is_on_site
                    ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {w.is_on_site ? 'ON-SITE' : 'OFF-DUTY'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>{w.certification_level}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span>Zone {w.current_zone_id || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{w.emergency_contact}</span>
              </div>
            </div>

            {/* Vitals */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5 text-rose-400">
                <Heart className="w-3.5 h-3.5" />
                <span>{w.heart_rate} BPM</span>
              </div>
              <div className="text-slate-400">Temp: {w.body_temp}°C</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
