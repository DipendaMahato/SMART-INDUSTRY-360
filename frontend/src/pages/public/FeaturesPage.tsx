import React from 'react';
import {
  Activity,
  Flame,
  BrainCircuit,
  Radio,
  Layers,
  Wrench,
  Server,
  FileBarChart,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const features = [
    {
      icon: Activity,
      title: 'Real-Time IoT Telemetry & Device Health',
      description:
        'Continuous ingestion of temperature, combustible gases (isobutane, methane, alcohol), smoke particulates, vibration RMS, and acoustic noise. Distinct health states: ONLINE, WARNING, CRITICAL, OFFLINE, and STALE. Missing or delayed readings trigger automatic data freshness warnings.',
    },
    {
      icon: Flame,
      title: 'Rule-Based & Multi-Sensor Emergency Coordination',
      description:
        'Deterministic hardware fail-safe limits combined with sensor fusion. Documented lifecycle: NEW → ACKNOWLEDGED → RESPONDING → CONTAINED → RESOLVED. Automatic alert dispatch across Dashboard, Mobile App, SMS, and public address sirens with a 45-second auto-escalation timer.',
    },
    {
      icon: BrainCircuit,
      title: 'AI Anomaly Detection & Sensor Fusion',
      description:
        'Scikit-learn Isolation Forest baseline models combined with multivariate spatial correlation. Generates explainable reason codes (e.g. THERMAL_AEROSOL_CONCOMITANT_SIGNATURE) and a fused 0-100 risk index. Critical safety alarms are never suppressed by AI scores.',
    },
    {
      icon: Radio,
      title: 'Mobile Worker Portal & Instant SOS Distress',
      description:
        'Handheld web interface allowing field operators to trigger 1-tap SOS distress with safety countdown cancel, report hazards with photos and category tagging, acknowledge personalized evacuation alerts, and view real-time designated assembly points.',
    },
    {
      icon: Layers,
      title: 'Interactive 2D Factory Digital Twin',
      description:
        'Vector floor plan representing production bays, chemical reactors, high-voltage yards, and control rooms. Real-time SVG hazard color fills (CLEAR, WARNING, EVACUATE), live sensor placement pins, active incident indicators, and click-to-inspect zone telemetry.',
    },
    {
      icon: Wrench,
      title: 'Predictive Maintenance & Work Orders',
      description:
        'Rotating equipment vibration and thermal trend analysis. Calculates Remaining Useful Life (RUL) in days, Mean Time Between Failures (MTBF), and Mean Time to Repair (MTTR). Automatically links equipment anomalies to maintenance work order workflows.',
    },
    {
      icon: Server,
      title: 'Autonomous Edge Computing & Offline Store-and-Forward',
      description:
        'Hardware sirens fire autonomously without waiting for cloud or broker acknowledgements. Edge gateway buffers sensor frames in local SQLite (edge_buffer.db) during network severing and flushes without duplicates upon connectivity restoration.',
    },
    {
      icon: FileBarChart,
      title: 'Reports, Latency Metrics & CSV Export',
      description:
        'Comprehensive MTTA (Mean Time to Acknowledge) and MTTR (Mean Time to Resolve) calculation. Incident breakdown by zone, severity, and category. One-click CSV export and print-friendly audit reports reconciled with underlying database records.',
    },
  ];

  return (
    <div className="py-16 bg-slate-950 text-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800 mb-4">
            CAPABILITY SPECIFICATION
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Comprehensive Industrial Capabilities
          </h1>
          <p className="mt-4 text-slate-400 text-base">
            Every feature is backed by active database models, validated REST endpoints, real-time WebSockets, and verifiable operational logic.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">{feat.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
