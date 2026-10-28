import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, Plus, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    api.getUsers().then(setUsers).catch(console.error);
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            User & Role-Based Access Control (RBAC)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enforces least-privilege authorizations across all 8 industrial operational tiers.
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="pb-3">User</th>
              <th className="pb-3">Role</th>
              <th className="pb-3">Department</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                <td className="py-3 font-semibold text-white">
                  <div>{u.full_name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">@{u.username}</div>
                </td>
                <td className="py-3 font-mono">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                    {u.role}
                  </span>
                </td>
                <td className="py-3 text-slate-300">{u.department || 'Operations'}</td>
                <td className="py-3 font-mono text-slate-400">{u.email}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    u.is_active !== false
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {u.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
