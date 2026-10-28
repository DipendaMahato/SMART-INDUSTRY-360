import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Incident } from '../../types';

export const IncidentHistoryPage: React.FC<{ plantId: number }> = ({ plantId }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getIncidents(plantId).then(setIncidents).catch(console.error);
  }, [plantId]);

  const filtered = incidents.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.incident_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-slate-400" />
            Complete Incident History & Root Cause Log
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Permanent, searchable event ledger of all resolved, contained, and active emergency operations.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by incident number or title..."
          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="pb-3">Incident #</th>
              <th className="pb-3">Title</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Severity</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Created</th>
              <th className="pb-3">Resolved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filtered.map((inc) => (
              <tr key={inc.id} className="hover:bg-slate-850/50 transition-colors">
                <td className="py-3 font-mono font-bold text-blue-400">{inc.incident_number}</td>
                <td className="py-3 font-semibold text-white">{inc.title}</td>
                <td className="py-3 text-slate-400 font-mono">{inc.category}</td>
                <td className="py-3 font-bold uppercase text-rose-400">{inc.severity}</td>
                <td className="py-3">
                  <StatusBadge status={inc.status} />
                </td>
                <td className="py-3 text-slate-400 font-mono text-[11px]">
                  {new Date(inc.created_at).toLocaleString()}
                </td>
                <td className="py-3 text-emerald-400 font-mono text-[11px]">
                  {inc.resolved_at ? new Date(inc.resolved_at).toLocaleString() : 'Active'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
