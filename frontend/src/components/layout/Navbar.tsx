import React, { useEffect, useState } from 'react';
import { Shield, Database, Cpu } from 'lucide-react';
import { api } from '../../api/client';
import { SystemHealth } from '../../types';

export const Navbar: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    api.getSystemHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  return (
    <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-indigo-500/40 px-8 py-4 flex items-center justify-between sticky top-0 z-40 shadow-[0_4px_25px_rgba(30,58,138,0.35)] backdrop-blur-xl">
      <div className="flex items-center space-x-3.5">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-300/40">
          <Shield className="w-5 h-5 font-extrabold" />
        </div>
        <div>
          <h1 className="text-base font-extrabold tracking-wider text-white flex items-center gap-2 font-mono">
            MACHINEGUARD
            <span className="text-[10px] uppercase font-mono px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/50 font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              v2.0 Commercial
            </span>
          </h1>
          <p className="text-[11px] text-slate-300 font-medium">Intelligent Digital Twin for Predictive Maintenance &amp; Machine Health</p>
        </div>
      </div>

      <div className="flex items-center space-x-4 text-xs font-mono">
        <div className="hidden sm:flex items-center space-x-2.5 bg-emerald-950/80 px-4 py-1.5 rounded-xl border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300 font-sans font-semibold">Database:</span>
          <span className="font-extrabold text-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            {health?.database_connected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-2.5 bg-blue-950/80 px-4 py-1.5 rounded-xl border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300 font-sans font-semibold">ML Engine:</span>
          <span className="font-extrabold text-cyan-300">
            {health?.ml_models_loaded ? `ACTIVE (${health.active_model_version})` : 'STANDBY'}
          </span>
        </div>
      </div>
    </header>
  );
};




