import React from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Radio,
  ArrowRight,
  Lock,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 border-b border-slate-900 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-semibold bg-blue-950/70 text-blue-400 border border-blue-800/80 mb-6 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            ISO 45001 & IEC 62443 COMPLIANT PLATFORM
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Intelligent IoT & AI Industrial Safety & Real-Time Monitoring
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Detect hazardous conditions accurately, communicate notifications with zero delay, coordinate emergency response across production zones, and maintain tamper-evident audit records.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="px-6 py-3.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/25 flex items-center gap-2 transition-all"
            >
              <Cpu className="w-4 h-4" />
              <span>Enter Industrial Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/worker"
              className="px-6 py-3.5 rounded-xl text-sm font-bold bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 flex items-center gap-2 transition-all"
            >
              <Radio className="w-4 h-4 text-rose-400" />
              <span>Mobile Worker Portal & SOS</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-800/80 text-left">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-black font-mono text-emerald-400">&lt; 250 ms</div>
              <div className="text-xs text-slate-400 font-medium">Local Fail-Safe Latency</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-black font-mono text-blue-400">99.98 %</div>
              <div className="text-xs text-slate-400 font-medium">Outbox Alert Delivery</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-black font-mono text-purple-400">100 %</div>
              <div className="text-xs text-slate-400 font-medium">Edge Store-and-Forward</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-2xl font-black font-mono text-amber-400">8 Roles</div>
              <div className="text-xs text-slate-400 font-medium">Strict RBAC Authorization</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to Explore the Industrial Command Center?
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Test live sensor telemetry, trigger simulated emergency scenarios, inspect AI sensor fusion models, and evaluate worker safety workflows.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In with Documented Roles</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
