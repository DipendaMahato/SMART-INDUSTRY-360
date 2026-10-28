import React, { useState, useEffect } from 'react';
import { BrainCircuit, Play, CheckCircle2, AlertTriangle, ShieldAlert, Cpu } from 'lucide-react';
import { api } from '../../services/api';
import { AIModel, AIAnomaly } from '../../types';

export const AIIntelligencePage: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [anomalies, setAnomalies] = useState<AIAnomaly[]>([]);
  const [testTemp, setTestTemp] = useState(65.0);
  const [testGas, setTestGas] = useState(180.0);
  const [testVib, setTestVib] = useState(4.2);
  const [testSmoke, setTestSmoke] = useState(45.0);
  const [fusionResult, setFusionResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const loadAI = async () => {
      try {
        const m = await api.getAIModels();
        setModels(m);
        const a = await api.getAIAnomalies();
        setAnomalies(a);
      } catch (err) {
        console.error(err);
      }
    };
    loadAI();
  }, []);

  const handleRunFusionTest = async () => {
    setTesting(true);
    try {
      const res = await api.evaluateFusion('DEV-TEST-01', 2, {
        temperature: testTemp,
        combustible_gas: testGas,
        vibration_rms: testVib,
        smoke_ppm: testSmoke,
        humidity: 50.0,
      });
      setFusionResult(res);
      // Reload anomalies list
      const updatedAnomalies = await api.getAIAnomalies();
      setAnomalies(updatedAnomalies);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BrainCircuit className="w-6 h-6 text-purple-400" />
            AI Intelligence & Multi-Sensor Fusion
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Scikit-learn Isolation Forest anomaly scoring, spatial risk index fusion, and explainability reason codes.
          </p>
        </div>
      </div>

      {/* Models Evaluation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {models.map((m) => (
          <div key={m.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-purple-400">{m.version}</span>
                <h3 className="font-bold text-white text-base mt-0.5">{m.model_name}</h3>
                <div className="text-xs text-slate-400 font-mono">{m.model_type}</div>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                {m.status}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="text-slate-500 text-[10px]">PRECISION</div>
                <div className="font-bold text-emerald-400">{(m.precision * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">RECALL</div>
                <div className="font-bold text-blue-400">{(m.recall * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">F1 SCORE</div>
                <div className="font-bold text-purple-400">{(m.f1_score * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">LATENCY</div>
                <div className="font-bold text-amber-400">{m.latency_ms} ms</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sensor Fusion Interactive Inference Test Harness */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <Play className="w-4 h-4 text-emerald-400" />
          Interactive Multi-Sensor Fusion Test Harness
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Temperature (°C): {testTemp}</label>
            <input
              type="range"
              min="15"
              max="100"
              value={testTemp}
              onChange={(e) => setTestTemp(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Combustible Gas (ppm): {testGas}</label>
            <input
              type="range"
              min="0"
              max="350"
              value={testGas}
              onChange={(e) => setTestGas(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Vibration RMS (mm/s): {testVib}</label>
            <input
              type="range"
              min="0"
              max="12"
              step="0.1"
              value={testVib}
              onChange={(e) => setTestVib(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Smoke Particulate (ppm): {testSmoke}</label>
            <input
              type="range"
              min="0"
              max="100"
              value={testSmoke}
              onChange={(e) => setTestSmoke(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleRunFusionTest}
            disabled={testing}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-2"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>{testing ? 'Computing Anomaly Vector...' : 'Execute Scikit-Learn Inference'}</span>
          </button>
        </div>

        {/* Inference Result Output */}
        {fusionResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Inference Output Analysis</span>
              <span
                className={`px-3 py-1 rounded-full font-mono font-bold ${
                  fusionResult.is_anomaly
                    ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {fusionResult.is_anomaly ? 'ANOMALOUS RISK DETECTED' : 'NORMAL PARAMETRIC PATTERN'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900">
                <div className="text-slate-500 text-[10px]">FUSED RISK INDEX</div>
                <div className="text-xl font-bold text-white">{fusionResult.fused_risk_index} / 100</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900">
                <div className="text-slate-500 text-[10px]">ANOMALY SCORE</div>
                <div className="text-xl font-bold text-blue-400">{fusionResult.anomaly_score}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900">
                <div className="text-slate-500 text-[10px]">CONFIDENCE</div>
                <div className="text-xl font-bold text-purple-400">
                  {(fusionResult.explainability?.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900">
                <div className="text-slate-500 text-[10px]">PRIMARY DRIVER</div>
                <div className="text-xs font-bold text-amber-400 truncate mt-1">
                  {fusionResult.explainability?.primary_driver}
                </div>
              </div>
            </div>

            {/* Reason Codes */}
            {fusionResult.explainability?.reason_codes?.length > 0 && (
              <div className="pt-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Explainability Reason Codes
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {fusionResult.explainability.reason_codes.map((code: string) => (
                    <span
                      key={code}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/70 text-purple-300 border border-purple-800"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Anomalies Log */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Flagged AI Anomaly Log
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="pb-3">Device / Zone</th>
                <th className="pb-3">Risk Index</th>
                <th className="pb-3">Anomaly Score</th>
                <th className="pb-3">Reason Codes</th>
                <th className="pb-3">Confidence</th>
                <th className="pb-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {anomalies.map((anom) => (
                <tr key={anom.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 font-mono font-bold text-white">
                    {anom.device_id} (Zone {anom.zone_id})
                  </td>
                  <td className="py-3 font-mono font-bold text-rose-400">{anom.risk_index} / 100</td>
                  <td className="py-3 font-mono text-slate-300">{anom.anomaly_score}</td>
                  <td className="py-3 font-mono text-purple-300 text-[11px]">
                    {anom.reason_codes ? JSON.parse(anom.reason_codes).join(', ') : 'MULTIVARIATE_OUTLIER'}
                  </td>
                  <td className="py-3 font-mono text-emerald-400">{(anom.confidence * 100).toFixed(0)}%</td>
                  <td className="py-3 font-mono text-slate-500 text-[11px]">
                    {new Date(anom.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
