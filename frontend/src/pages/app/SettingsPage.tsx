import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle2, Save } from 'lucide-react';
import { api } from '../../services/api';
import { SystemSetting } from '../../types';

export const SettingsPage: React.FC = () => {
  const [settingsList, setSettingsList] = useState<SystemSetting[]>([]);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettingsList).catch(console.error);
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    try {
      await api.updateSetting(key, value);
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-slate-400" />
            System Configuration & Policy Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global operational safety thresholds, automated escalation timeouts, and edge gateway heartbeat rules.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {settingsList.map((st) => (
          <div key={st.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-mono text-sm font-bold text-blue-400">{st.key}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{st.description}</p>
              </div>
              {savedKey === st.key && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                defaultValue={st.value}
                id={`input-${st.key}`}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => {
                  const el = document.getElementById(`input-${st.key}`) as HTMLInputElement;
                  if (el) handleUpdate(st.key, el.value);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
