import React, { useState, useEffect } from 'react';
import { FileText, Search, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getAuditLogs().then(setLogs).catch(console.error);
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.username.toLowerCase().includes(search.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-emerald-400" />
            Append-Only Compliance Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident record of all operator actions, overrides, emergency broadcasts, and logins.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter audit logs by action, operator, or keyword..."
          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="pb-3">Timestamp (UTC)</th>
              <th className="pb-3">Operator</th>
              <th className="pb-3">Action</th>
              <th className="pb-3">Target Entity</th>
              <th className="pb-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                <td className="py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="py-3 font-mono font-bold text-blue-400">@{log.username}</td>
                <td className="py-3 font-mono font-semibold text-white">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-200 border border-slate-700">
                    {log.action}
                  </span>
                </td>
                <td className="py-3 font-mono text-slate-400 text-[11px]">
                  {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                </td>
                <td className="py-3 text-xs text-slate-300 max-w-md truncate" title={log.details || ''}>
                  {log.details || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
