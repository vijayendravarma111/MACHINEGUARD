import React from 'react';
import { Cpu, Zap, Activity, Thermometer, Gauge } from 'lucide-react';

interface MotorSchematicProps {
  healthScore: number;
  condition: string;
  processTempK?: number;
  speedRpm?: number;
  torqueNm?: number;
  toolWearMin?: number;
  powerW?: number;
}

export const MotorSchematic: React.FC<MotorSchematicProps> = ({
  healthScore,
  condition,
  processTempK = 308.5,
  speedRpm = 1500,
  torqueNm = 40.0,
  toolWearMin = 20,
  powerW = 6280
}) => {
  const cond = condition.toUpperCase();
  const isCritical = cond === 'CRITICAL' || healthScore < 40;
  const isWarning = cond === 'WARNING' || cond === 'WATCH' || (healthScore >= 40 && healthScore < 80);

  const statusGlowClass = isCritical
    ? 'border-rose-300 shadow-md shadow-rose-500/10 pulse-critical'
    : isWarning
    ? 'border-amber-300 shadow-md shadow-amber-500/10'
    : 'border-blue-200 shadow-md shadow-blue-500/10';

  const casingFill = isCritical ? '#4c0519' : isWarning ? '#451a03' : '#0f172a';
  const casingStroke = isCritical ? '#f43f5e' : isWarning ? '#f59e0b' : '#38bdf8';

  return (
    <div className={`panel-card p-6 border ${statusGlowClass} relative overflow-hidden transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/90 pb-4 mb-5">
        <div className="flex items-center space-x-2.5">
          <Cpu className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 font-mono">
            2D SOFTWARE TWIN MOTOR SCHEMATIC
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono text-slate-500 font-bold">STATE:</span>
          <span className={`px-3 py-0.5 rounded-lg text-[11px] font-extrabold font-mono border ${
            isCritical ? 'bg-rose-50 text-rose-800 border-rose-200' :
            isWarning ? 'bg-amber-50 text-amber-800 border-amber-200' :
            'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {cond} ({healthScore.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* 2D Vector Industrial Motor Visualization Container */}
      <div className="relative flex items-center justify-center py-6 bg-[#0f172a] rounded-xl border border-slate-800 overflow-hidden shadow-inner">
        {/* SVG Grid Overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-15" width="100%" height="100%">
          <pattern id="motorGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#38bdf8" strokeWidth="0.5"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#motorGrid)" />
        </svg>

        <svg viewBox="0 0 600 240" className="w-full max-w-xl h-52 z-10">
          <defs>
            <linearGradient id="statorFinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor={casingFill} />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="driveShaftGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          {/* Motor Base Plate */}
          <rect x="140" y="185" width="240" height="25" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="170" y="210" width="40" height="15" rx="2" fill="#1e293b" />
          <rect x="310" y="210" width="40" height="15" rx="2" fill="#1e293b" />

          {/* Rotating Drive Shaft */}
          <rect x="60" y="110" width="400" height="20" rx="3" fill="url(#driveShaftGrad)" stroke="#475569" strokeWidth="1.5" />
          <line x1="70" y1="120" x2="380" y2="120" stroke="#0284c7" strokeWidth="2" strokeDasharray="12 6" className="animate-pulse" />

          {/* NDE Bearing Housing */}
          <rect x="110" y="70" width="40" height="100" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <circle cx="130" cy="120" r="14" fill="#0f172a" stroke={casingStroke} strokeWidth="2" />

          {/* Main Stator Body & Fins */}
          <rect x="150" y="55" width="220" height="130" rx="8" fill="url(#statorFinGrad)" stroke={casingStroke} strokeWidth="2.5" />
          {[170, 195, 220, 245, 270, 295, 320, 345].map((x, i) => (
            <line key={i} x1={x} y1="55" x2={x} y2="185" stroke="#334155" strokeWidth="2" />
          ))}

          {/* DE Bearing Housing */}
          <rect x="370" y="70" width="40" height="100" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <circle cx="390" cy="120" r="14" fill="#0f172a" stroke={casingStroke} strokeWidth="2" />

          {/* Terminal Conduit Box */}
          <rect x="230" y="25" width="60" height="30" rx="4" fill="#1e293b" stroke="#0284c7" strokeWidth="2" />
          <text x="260" y="44" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">TERMINAL</text>

          {/* Shaft Output Flange */}
          <rect x="420" y="90" width="20" height="60" rx="3" fill="#334155" stroke="#64748b" strokeWidth="1.5" />

          {/* Sensor Beacon Callout */}
          <g transform="translate(260, 120)">
            <circle r="22" fill={casingFill} stroke={casingStroke} strokeWidth="2" className="animate-pulse" />
            <text x="0" y="4" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {processTempK.toFixed(0)}K
            </text>
          </g>
        </svg>
      </div>

      {/* Sensor Badges Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
        <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center space-x-3.5">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600 border border-blue-200">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Process Temp</div>
            <div className="text-xs font-mono font-extrabold text-slate-900">{processTempK.toFixed(1)} K</div>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center space-x-3.5">
          <div className="p-2 rounded-lg bg-sky-100 text-sky-600 border border-sky-200">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Speed (RPM)</div>
            <div className="text-xs font-mono font-extrabold text-slate-900">{speedRpm.toFixed(0)} RPM</div>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center space-x-3.5">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-600 border border-amber-200">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Motor Torque</div>
            <div className="text-xs font-mono font-extrabold text-slate-900">{torqueNm.toFixed(1)} Nm</div>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center space-x-3.5">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 border border-emerald-200">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Tool Wear</div>
            <div className="text-xs font-mono font-extrabold text-slate-900">{toolWearMin} min</div>
          </div>
        </div>
      </div>
    </div>
  );
};

