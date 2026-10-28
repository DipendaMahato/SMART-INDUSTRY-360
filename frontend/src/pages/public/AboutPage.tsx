import React from 'react';
import { ShieldCheck, Target, Users, BookOpen, AlertTriangle } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const team = [
    { name: 'Dr. Marcus Vance', role: 'Chief Systems Architect & Industrial IoT Lead', exp: '15+ yrs OT/SCADA Safety' },
    { name: 'Sarah Jenkins', role: 'Principal Embedded Systems Engineer', exp: 'Microcontroller & Firmware' },
    { name: 'Carlos Rodriguez', role: 'Reliability & Predictive Maintenance Lead', exp: 'Vibration & Mechanical Analysis' },
    { name: 'Elena Rostova', role: 'Full-Stack & Real-Time Communications Lead', exp: 'FastAPI, WebSockets, React' },
    { name: 'Captain David Chen', role: 'Environmental Health & Safety (EHS) Advisor', exp: 'Hazardous Materials & Incident Command' },
  ];

  return (
    <div className="py-16 bg-slate-950 text-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800 mb-4">
            MISSION & METHODOLOGY
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            About Smart Industry 360
          </h1>
          <p className="mt-4 text-slate-400 text-base">
            Engineered to bridge the communication gap between shop-floor sensors, frontline operators, safety teams, and executive plant leadership.
          </p>
        </div>

        {/* Problem & Objectives Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-rose-400" />
              The Problem Statement
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Industrial facilities frequently suffer from siloed telemetry where gas alarms are isolated from ventilation controllers, worker distress is communicated via outdated radio channels, and maintenance operates purely on emergency breakdowns. Disconnected sensors frequently go unnoticed until an incident occurs.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Proposed Solution & Mission
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Smart Industry 360 establishes a unified event architecture: autonomous hardware alarms fire in &lt;250ms, telemetry feeds into Scikit-learn anomaly detection, and unacknowledged alerts escalate automatically through a durable outbox queue with verifiable delivery receipts.
            </p>
          </div>
        </div>

        {/* Scope and Limitations */}
        <div className="mt-8 p-6 rounded-2xl bg-slate-900/50 border border-amber-900/50 text-xs text-slate-400 space-y-2">
          <div className="font-bold text-amber-400 flex items-center gap-1.5 uppercase font-mono text-xs">
            <AlertTriangle className="w-4 h-4" />
            Engineering Scope & Regulatory Boundaries
          </div>
          <p className="leading-relaxed">
            This deployment provides a fully functional full-stack architecture, IoT edge synchronization, and machine learning models. Microcontroller firmware and low-cost sensors (MQ-2, SW-420, DHT22) serve educational, prototyping, and test environments. Production petrochemical or explosive environments mandate certified ATEX/IECEx hardware.
          </p>
        </div>

        {/* Team Information */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Project Engineering Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 font-bold mx-auto flex items-center justify-center text-lg">
                  {member.name.charAt(0)}
                </div>
                <div className="font-bold text-white text-sm">{member.name}</div>
                <div className="text-xs text-blue-400 font-medium">{member.role}</div>
                <div className="text-[11px] text-slate-500 font-mono">{member.exp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
