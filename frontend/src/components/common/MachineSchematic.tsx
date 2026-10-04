import React from 'react';

interface MachineSchematicProps {
  machineName: string;
  status: string;
  health: number;
  anomalyState: string;
  processTemp: number;
  rotationalSpeed: number;
  torque: number;
  toolWear: number;
}

export const MachineSchematic: React.FC<MachineSchematicProps> = ({
  machineName,
  status,
  health,
  anomalyState,
  processTemp,
  rotationalSpeed,
  torque,
  toolWear
}) => {
  const isAbnormal = anomalyState === 'ABNORMAL' || health < 60;
  const isCritical = health < 40;

  const colorMain = isCritical ? '#f43f5e' : isAbnormal ? '#f59e0b' : '#10b981';

  return (
    <div className="panel-card p-5 border border-slate-200/90 dark:border-slate-800/80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white font-mono">{machineName} — Operational Schematic</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Software Machine Twin Physical Representation</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorMain }} />
          <span className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300">{anomalyState}</span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden bg-[#090d16] rounded-xl p-4 text-slate-100 font-mono text-xs flex flex-col items-center justify-center border border-slate-800">
        <svg viewBox="0 0 600 240" className="w-full h-auto max-h-60">
          {/* Background Grid */}
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="1" />
          </pattern>
          <rect width="600" height="240" fill="url(#grid)" />

          {/* Machine Base Mounting Frame */}
          <rect x="80" y="180" width="440" height="20" fill="#334155" stroke="#475569" strokeWidth="2" rx="3" />
          <rect x="110" y="195" width="40" height="15" fill="#1e293b" stroke="#64748b" />
          <rect x="450" y="195" width="40" height="15" fill="#1e293b" stroke="#64748b" />

          {/* Cooling Fan Cover (Left) */}
          <path d="M 90 70 L 140 70 L 140 180 L 90 180 Z" fill="#475569" stroke="#64748b" strokeWidth="2" />
          <line x1="100" y1="80" x2="100" y2="170" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="115" y1="80" x2="115" y2="170" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />

          {/* Main Stator Motor Housing (Center Body) */}
          <rect x="140" y="60" width="260" height="120" fill="#1e293b" stroke={colorMain} strokeWidth="3" rx="4" />

          {/* Stator Fins */}
          {[160, 190, 220, 250, 280, 310, 340, 370].map((x, i) => (
            <line key={i} x1={x} y1="60" x2={x} y2="180" stroke="#334155" strokeWidth="3" />
          ))}

          {/* Front Bearing Housing (Right) */}
          <rect x="400" y="75" width="40" height="90" fill="#475569" stroke="#64748b" strokeWidth="2" />

          {/* Output Rotating Shaft */}
          <rect x="440" y="105" width="110" height="30" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="2" />
          {/* Shaft Rotation Indicator Arrow */}
          <path d="M 480 95 Q 495 85 510 95" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
          <text x="475" y="82" fill="#38bdf8" fontSize="10">{rotationalSpeed} RPM</text>

          {/* Sensor Callouts & Indicators */}
          {/* Temp Sensor */}
          <circle cx="270" cy="60" r="6" fill={processTemp > 312 ? '#f43f5e' : '#38bdf8'} stroke="#ffffff" strokeWidth="2" />
          <line x1="270" y1="60" x2="270" y2="30" stroke="#38bdf8" strokeWidth="1.5" />
          <rect x="210" y="10" width="120" height="22" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" rx="3" />
          <text x="220" y="25" fill="#38bdf8" fontSize="10">TEMP: {processTemp} K</text>

          {/* Torque Sensor */}
          <circle cx="420" cy="120" r="6" fill={torque > 65 ? '#f43f5e' : '#fbbf24'} stroke="#ffffff" strokeWidth="2" />
          <line x1="420" y1="120" x2="420" y2="210" stroke="#fbbf24" strokeWidth="1.5" />
          <rect x="360" y="210" width="120" height="22" fill="#0f172a" stroke="#fbbf24" strokeWidth="1" rx="3" />
          <text x="370" y="225" fill="#fbbf24" fontSize="10">TORQUE: {torque} Nm</text>

          {/* Tool Wear / Spindle End */}
          <rect x="530" y="95" width="20" height="50" fill={toolWear > 200 ? '#f43f5e' : '#34d399'} stroke="#ffffff" strokeWidth="1.5" />
          <text x="500" y="165" fill="#34d399" fontSize="10">WEAR: {toolWear} min</text>
        </svg>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
        <span>Drive Type: AC Synchronous Induction Motor</span>
        <span>Sensor Stream: Continuous Telemetry</span>
      </div>
    </div>
  );
};

