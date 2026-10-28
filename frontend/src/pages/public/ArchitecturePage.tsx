import React from 'react';
import { Cpu, Server, Radio, Database, ShieldAlert, Layers, ArrowDown, CheckCircle2 } from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  const tiers = [
    {
      tier: 'Tier 1: Physical Edge & Sensors',
      tech: 'ESP32 Microcontroller / DHT22 / MQ-2 / SW-420 / Physical E-Stop',
      role: 'Autonomous fail-safe siren activation (<250ms), ADC sampling, SPIFFS ring-buffer for offline resilience, debounced hardware interrupts.',
    },
    {
      tier: 'Tier 2: Edge Gateway & Messaging',
      tech: 'Python Gateway Daemon / Mosquitto MQTT Broker (Port 1883) / SQLite',
      role: 'Local store-and-forward buffering (edge_buffer.db), network health pinging, MQTT topic isolation (telemetry, status, events, commands), QoS 1 delivery.',
    },
    {
      tier: 'Tier 3: Core Event Engine & API',
      tech: 'FastAPI (Python 3.12) / SQLAlchemy 2.0 / Pydantic v2 / Alembic',
      role: 'Asynchronous event ingestion, outbox notification engine, auto-escalation timer, lifecycle transition validation, role-based access control.',
    },
    {
      tier: 'Tier 4: Artificial Intelligence & Sensor Fusion',
      tech: 'Scikit-learn Isolation Forest / NumPy / Spatial Fusion Matrix',
      role: 'Multivariate statistical anomaly scoring, RUL degradation curves, explainability reason code synthesis, computer vision human verification pipeline.',
    },
    {
      tier: 'Tier 5: Real-Time Presentation & Command Center',
      tech: 'React 19 / TypeScript / Vite / Tailwind CSS / WebSockets / Recharts',
      role: 'Interactive 2D vector digital twin, sub-second telemetry feeds, audio-visual hazard alerts, worker mobile SOS portal, exportable compliance reports.',
    },
  ];

  return (
    <div className="py-16 bg-slate-950 text-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-950 text-purple-400 border border-purple-800 mb-4">
            SYSTEM ARCHITECTURE & DATA FLOW
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            End-to-End Industrial Architecture
          </h1>
          <p className="mt-4 text-slate-400 text-base">
            Multi-tier distributed architecture designed for low-latency emergency coordination, offline edge survivability, and verifiable event auditability.
          </p>
        </div>

        {/* Visual Architecture Diagram */}
        <div className="mt-16 max-w-4xl mx-auto space-y-6">
          {tiers.map((t, idx) => (
            <React.Fragment key={idx}>
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    {t.tier}
                  </div>
                  <span className="text-xs font-mono text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-900/80">
                    {t.tech}
                  </span>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">{t.role}</p>
              </div>

              {idx < tiers.length - 1 && (
                <div className="flex justify-center text-slate-600">
                  <ArrowDown className="w-6 h-6 animate-bounce" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* MQTT Topics Spec */}
        <div className="mt-16 max-w-4xl mx-auto p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4 font-mono">
            <Radio className="w-5 h-5 text-emerald-400" />
            STANDARDIZED MQTT TOPIC CONTRACT
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
              <span className="text-slate-300">industry/{'{plant_id}'}/{'{zone_id}'}/{'{device_id}'}/telemetry</span>
              <span className="text-emerald-400">Periodic Telemetry Frames</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
              <span className="text-slate-300">industry/{'{plant_id}'}/{'{zone_id}'}/{'{device_id}'}/status</span>
              <span className="text-blue-400">Heartbeat & LWT Status</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
              <span className="text-slate-300">industry/{'{plant_id}'}/{'{zone_id}'}/{'{device_id}'}/events</span>
              <span className="text-rose-400">Critical Alarm & SOS Triggers</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
              <span className="text-slate-300">industry/{'{plant_id}'}/{'{zone_id}'}/{'{device_id}'}/commands</span>
              <span className="text-amber-400">Authorized Operator Commands</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
