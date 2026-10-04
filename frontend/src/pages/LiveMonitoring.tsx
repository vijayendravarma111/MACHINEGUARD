import React, { useEffect, useState } from 'react';
import { Activity, Play, Pause, RefreshCw, Zap, ShieldAlert, RotateCcw } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../api/client';
import { Machine, SensorReading } from '../types';

export const LiveMonitoring: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState('MOTOR-001');
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [activeScenario, setActiveScenario] = useState('NORMAL');

  const fetchAndStep = async () => {
    try {
      if (isStreaming) {
        // Generate a new simulated telemetry tick in backend state engine
        await api.stepSimulation(selectedMachineId);
      }
      const [mList, rList] = await Promise.all([
        api.getMachines(),
        api.getMachineReadings(selectedMachineId, 30)
      ]);
      setMachines(mList);
      setReadings(rList.reverse());
    } catch (err) {
      console.error("Live telemetry stream error:", err);
    }
  };

  useEffect(() => {
    fetchAndStep();
    const interval = setInterval(fetchAndStep, 2000);
    return () => clearInterval(interval);
  }, [selectedMachineId, isStreaming]);

  const handleScenarioChange = (scenario: string) => {
    setActiveScenario(scenario);
    if (scenario === 'RESET') {
      api.resetSimulation(selectedMachineId).then(() => fetchAndStep());
    } else {
      api.injectFault(selectedMachineId, scenario).then(() => fetchAndStep());
    }
  };

  const selectedMachine = machines.find(m => m.machine_id === selectedMachineId);
  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="panel-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 font-mono flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-blue-600" />
            LIVE TELEMETRY OPERATIONS CONSOLE
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
            Real-time machine twin sensor stream and live failure risk monitoring console
          </p>
        </div>

        {/* Machine Target Selector & Streaming Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-slate-700 font-bold">Select Machine:</span>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="py-2 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500 shadow-xs"
            >
              {machines.map(m => (
                <option key={m.machine_id} value={m.machine_id}>
                  {m.machine_id} ({m.name})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer ${
              isStreaming
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5 mr-1.5" />
                Pause Stream
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-1.5" />
                Resume Stream
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Scenario Injector Bar */}
      <div className="panel-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-300">
        <div className="text-xs font-mono">
          <span className="font-extrabold text-slate-900 block">SIMULATION LOAD REGIME:</span>
          <span className="text-slate-600 text-[11px] font-sans font-medium">Inject operational workloads to see live telemetry waveform responses</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={() => handleScenarioChange('NORMAL')}
            className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
              activeScenario === 'NORMAL'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
            }`}
          >
            Nominal Load
          </button>
          <button
            onClick={() => handleScenarioChange('HIGH_LOAD')}
            className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
              activeScenario === 'HIGH_LOAD'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5 inline mr-1" />
            High Load
          </button>
          <button
            onClick={() => handleScenarioChange('DEGRADATION')}
            className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
              activeScenario === 'DEGRADATION'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 inline mr-1" />
            Degradation
          </button>
          <button
            onClick={() => handleScenarioChange('RESET')}
            className="px-3 py-1.5 rounded-lg font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 inline mr-1 text-slate-600" />
            Reset Twin
          </button>
        </div>
      </div>

      {/* Top Metric Panels */}
      {selectedMachine && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="panel-card p-5 font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-600 font-sans tracking-wide">Health Score</div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">{selectedMachine.current_health.toFixed(1)}%</div>
          </div>

          <div className="panel-card p-5 font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-600 font-sans tracking-wide">Failure Risk</div>
            <div className="text-xl font-extrabold text-slate-900 mt-1">{(selectedMachine.current_risk * 100).toFixed(1)}%</div>
          </div>

          <div className="panel-card p-5 font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-600 font-sans tracking-wide">Process Temp</div>
            <div className="text-xl font-extrabold text-blue-700 mt-1">{latestReading ? latestReading.process_temperature_k.toFixed(1) : 308.0} K</div>
          </div>

          <div className="panel-card p-5 font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-600 font-sans tracking-wide">Rotational Speed</div>
            <div className="text-xl font-extrabold text-sky-700 mt-1">{latestReading ? latestReading.rotational_speed_rpm.toFixed(0) : 1500} RPM</div>
          </div>

          <div className="panel-card p-5 font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-600 font-sans tracking-wide">Motor Torque</div>
            <div className="text-xl font-extrabold text-amber-700 mt-1">{latestReading ? latestReading.torque_nm.toFixed(1) : 40.0} Nm</div>
          </div>

          <div className="panel-card p-5 font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-600 font-sans tracking-wide">Tool Wear</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-1">{latestReading ? latestReading.tool_wear_min : 20} min</div>
          </div>
        </div>
      )}

      {/* Main Live Telemetry Stream Chart */}
      <div className="panel-card p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-2 font-mono">
            <Activity className="w-4.5 h-4.5 text-blue-600" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              REAL-TIME SPEED (RPM) &amp; TORQUE (Nm) STREAM
            </h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold border flex items-center gap-2 ${
            isStreaming
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
              : 'bg-amber-100 text-amber-900 border-amber-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {isStreaming ? '● LIVE STREAM ACTIVE' : 'PAUSED'}
          </span>
        </div>

        <div className="h-96 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={readings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="timestamp" stroke="#64748b" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} />
              <YAxis yAxisId="left" stroke="#0284c7" domain={['auto', 'auto']} />
              <YAxis yAxisId="right" orientation="right" stroke="#d97706" domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: '#0f172a' }} />
              <Line yAxisId="left" type="monotone" dataKey="rotational_speed_rpm" stroke="#0284c7" name="Speed (RPM)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" dataKey="torque_nm" stroke="#d97706" name="Torque (Nm)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
