import React, { useEffect, useState } from 'react';
import { Sliders, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { Machine, WhatIfResponse } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const SimulationPage: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState('MOTOR-001');

  // What-If State Controls
  const [whatIfTemp, setWhatIfTemp] = useState(312.0);
  const [whatIfSpeed, setWhatIfSpeed] = useState(1400.0);
  const [whatIfTorque, setWhatIfTorque] = useState(55.0);
  const [whatIfWear, setWhatIfWear] = useState(120);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResponse | null>(null);
  const [runningWhatIf, setRunningWhatIf] = useState(false);

  useEffect(() => {
    api.getMachines().then(setMachines).catch(console.error);
  }, []);

  const handleRunWhatIf = () => {
    setRunningWhatIf(true);
    api.runWhatIf({
      machine_id: selectedMachineId,
      process_temperature_k: whatIfTemp,
      air_temperature_k: 300.0,
      rotational_speed_rpm: whatIfSpeed,
      torque_nm: whatIfTorque,
      tool_wear_min: whatIfWear
    })
      .then(setWhatIfResult)
      .catch(console.error)
      .finally(() => setRunningWhatIf(false));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 font-mono flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            WHAT-IF DIGITAL TWIN LAB &amp; SCENARIO ENGINE
          </h2>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Test hypothetical machine operating parameters in an isolated model-estimated sandbox
          </p>
        </div>

        {/* Machine Target Selector */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-700 font-bold">Target Machine:</span>
          <select
            value={selectedMachineId}
            onChange={(e) => setSelectedMachineId(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500 shadow-xs"
          >
            {machines.map(m => (
              <option key={m.machine_id} value={m.machine_id}>
                {m.machine_id} ({m.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* WHAT-IF DIGITAL TWIN LAB */}
      <div className="panel-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-300/80 pb-3.5">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider font-mono">
                HYPOTHETICAL WHAT-IF PARAMETER SANDBOX
              </h3>
              <p className="text-xs font-semibold text-slate-600">Simulate operating parameter shifts without altering actual machine telemetry or database state</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-mono font-extrabold bg-blue-100 text-blue-900 border border-blue-300 shadow-xs">
            MODEL-ESTIMATED SANDBOX
          </span>
        </div>

        {/* Industrial Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white rounded-xl border border-slate-300/80 shadow-xs">
          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-800 font-extrabold">Process Temperature (K):</span>
              <span className="text-blue-700 font-extrabold text-sm">{whatIfTemp.toFixed(1)} K</span>
            </div>
            <input
              type="range"
              min="295.0"
              max="325.0"
              step="0.5"
              value={whatIfTemp}
              onChange={(e) => setWhatIfTemp(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-600 font-mono font-bold">
              <span>295 K</span>
              <span>Nominal: 308 K</span>
              <span>325 K</span>
            </div>
          </div>

          {/* RPM Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-800 font-extrabold">Rotational Speed (RPM):</span>
              <span className="text-blue-700 font-extrabold text-sm">{whatIfSpeed.toFixed(0)} RPM</span>
            </div>
            <input
              type="range"
              min="1000"
              max="2800"
              step="20"
              value={whatIfSpeed}
              onChange={(e) => setWhatIfSpeed(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-600 font-mono font-bold">
              <span>1000 RPM</span>
              <span>Nominal: 1500 RPM</span>
              <span>2800 RPM</span>
            </div>
          </div>

          {/* Torque Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-800 font-extrabold">Motor Torque (Nm):</span>
              <span className="text-blue-700 font-extrabold text-sm">{whatIfTorque.toFixed(1)} Nm</span>
            </div>
            <input
              type="range"
              min="10.0"
              max="90.0"
              step="1.0"
              value={whatIfTorque}
              onChange={(e) => setWhatIfTorque(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-600 font-mono font-bold">
              <span>10 Nm</span>
              <span>Nominal: 40 Nm</span>
              <span>90 Nm</span>
            </div>
          </div>

          {/* Tool Wear Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-800 font-extrabold">Tool Wear (min):</span>
              <span className="text-blue-700 font-extrabold text-sm">{whatIfWear} min</span>
            </div>
            <input
              type="range"
              min="0"
              max="250"
              step="5"
              value={whatIfWear}
              onChange={(e) => setWhatIfWear(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-600 font-mono font-bold">
              <span>0 min</span>
              <span>Nominal: 20 min</span>
              <span>250 min</span>
            </div>
          </div>
        </div>

        {/* Run Scenario Button */}
        <button
          onClick={handleRunWhatIf}
          disabled={runningWhatIf}
          className="w-full py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 border border-blue-500/30"
        >
          {runningWhatIf ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Sliders className="w-4 h-4 text-cyan-300" />
          )}
          <span>RUN HYPOTHETICAL WHAT-IF SCENARIO</span>
        </button>

        {/* WHAT-IF RESULT COMPARISON VIEW */}
        {whatIfResult && (
          <div className="space-y-5 p-5 bg-white border border-slate-300 rounded-xl shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <h4 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider font-mono">
                CURRENT STATE VS. HYPOTHETICAL SIMULATED STATE
              </h4>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                MODEL-ESTIMATED SIMULATED OUTCOME (ISOLATED SANDBOX)
              </span>
            </div>

            {/* Side-by-Side Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Current State */}
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-2 shadow-xs">
                <div className="text-[11px] font-extrabold text-slate-600 uppercase font-sans">CURRENT MACHINE STATE</div>
                <div className="text-2xl font-extrabold text-slate-900">
                  Health: {whatIfResult.current_state.health_score.toFixed(1)}%
                </div>
                <div className="text-slate-800 font-bold">
                  Failure Risk: {(whatIfResult.current_state.failure_risk * 100).toFixed(1)}% ({whatIfResult.current_state.risk_level})
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <span className="text-slate-600 font-sans text-[11px] font-bold">Condition:</span>
                  <StatusBadge status={whatIfResult.current_state.condition} type="health" />
                </div>
              </div>

              {/* Simulated State */}
              <div className="p-4 bg-blue-50/80 border border-blue-300 rounded-xl space-y-2 shadow-xs">
                <div className="text-[11px] font-extrabold text-blue-800 uppercase font-sans">HYPOTHETICAL SIMULATED STATE</div>
                <div className="text-2xl font-extrabold text-blue-900">
                  Health: {whatIfResult.simulated_state.health_score.toFixed(1)}%
                </div>
                <div className="text-blue-950 font-bold">
                  Failure Risk: {(whatIfResult.simulated_state.failure_risk * 100).toFixed(1)}% ({whatIfResult.simulated_state.risk_level})
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <span className="text-slate-600 font-sans text-[11px] font-bold">Simulated Condition:</span>
                  <StatusBadge status={whatIfResult.simulated_state.condition} type="health" />
                </div>
              </div>
            </div>

            {/* Assessment & Recommendation */}
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-2 text-xs font-sans shadow-xs">
              <div className="font-extrabold text-slate-900 flex items-center space-x-2 font-mono">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>SCENARIO MODEL ASSESSMENT</span>
              </div>
              <p className="text-slate-800 font-medium leading-relaxed">{whatIfResult.scenario_assessment}</p>
              <div className="pt-2 text-blue-900 font-semibold">
                <span className="font-extrabold text-slate-900">Recommended Operational Action: </span>
                {whatIfResult.recommended_action}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

