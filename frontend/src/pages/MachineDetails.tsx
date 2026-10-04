import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Cpu,
  Activity,
  Wrench,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../api/client';
import { Machine, SensorReading, FailureInvestigationResponse, Alert, MaintenanceRecord } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { MotorSchematic } from '../components/common/MotorSchematic';

export const MachineDetails: React.FC = () => {
  const { machine_id } = useParams<{ machine_id: string }>();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [investigation, setInvestigation] = useState<FailureInvestigationResponse | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Maintenance Modal State
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintType, setMaintType] = useState('PREVENTIVE');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintTech, setMaintTech] = useState('Mechanical Maintenance Team');
  const [maintDate, setMaintDate] = useState('2026-09-25T10:00');
  const [maintError, setMaintError] = useState<string | null>(null);
  const [maintSuccess, setMaintSuccess] = useState<string | null>(null);
  const [submittingMaint, setSubmittingMaint] = useState(false);

  // Technical Model Details Collapse State
  const [showTechDetails, setShowTechDetails] = useState(false);

  const loadAllData = () => {
    if (!machine_id) return;
    setLoading(true);
    Promise.all([
      api.getMachine(machine_id),
      api.getMachineReadings(machine_id, 30),
      api.getFailureInvestigation(machine_id),
      api.getMachineAlerts(machine_id),
      api.getMachineMaintenance(machine_id)
    ])
      .then(([m, r, inv, al, mt]) => {
        setMachine(m);
        setReadings(r.reverse());
        setInvestigation(inv);
        setAlerts(al);
        setMaintenance(mt);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 10000);
    return () => clearInterval(interval);
  }, [machine_id]);

  const handleScheduleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!machine_id) return;
    setSubmittingMaint(true);
    setMaintError(null);
    setMaintSuccess(null);

    api.createMaintenance({
      machine_id,
      scheduled_date: new Date(maintDate).toISOString(),
      maintenance_type: maintType as any,
      description: maintDesc || 'Routine preventive inspection following condition assessment.',
      technician: maintTech,
      status: 'SCHEDULED'
    })
      .then(() => {
        setMaintSuccess('Maintenance work order successfully scheduled and persisted in database.');
        setTimeout(() => {
          setShowMaintModal(false);
          setMaintSuccess(null);
          loadAllData();
        }, 1500);
      })
      .catch((err) => {
        setMaintError(err.message || 'Failed to schedule maintenance order.');
      })
      .finally(() => setSubmittingMaint(false));
  };

  if (loading && !machine) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-700 text-sm font-extrabold font-mono">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-600" />
        Loading Machine Twin Intelligence Workspace...
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="panel-card p-8 text-center text-slate-800 space-y-4">
        <p className="font-extrabold">Machine twin '{machine_id}' was not found in database registry.</p>
        <Link to="/machines" className="text-blue-700 hover:underline text-xs font-bold">
          Return to Fleet Directory
        </Link>
      </div>
    );
  }

  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 panel-card p-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/machines"
            className="p-2 rounded-xl bg-white text-slate-700 hover:text-slate-900 border border-slate-300 transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 font-mono">{machine.machine_id}</h2>
              <StatusBadge status={machine.operating_status} type="status" />
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-bold">{machine.name} — {machine.machine_type}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowMaintModal(true)}
            className="inline-flex items-center px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-xl shadow-md transition-all border border-amber-600/30"
          >
            <Wrench className="w-3.5 h-3.5 mr-2" />
            Schedule Maintenance
          </button>

          <Link
            to="/simulation"
            className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all border border-blue-500/30"
          >
            <Sliders className="w-3.5 h-3.5 mr-2 text-cyan-300" />
            What-If Simulator Lab
          </Link>
        </div>
      </div>

      {/* Top Twin Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="panel-card p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 font-mono">Health Score</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{machine.current_health.toFixed(1)}%</div>
          </div>
          <StatusBadge status={machine.current_health >= 80 ? 'HEALTHY' : machine.current_health >= 40 ? 'WARNING' : 'CRITICAL'} type="health" />
        </div>

        <div className="panel-card p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 font-mono">Estimated Risk</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{(machine.current_risk * 100).toFixed(1)}%</div>
          </div>
          <StatusBadge status={machine.current_risk > 0.5 ? 'HIGH' : 'LOW'} type="risk" />
        </div>

        <div className="panel-card p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 font-mono">Anomaly State</div>
            <div className="text-base font-extrabold text-slate-900 mt-1 font-mono">{machine.current_anomaly_state}</div>
          </div>
          <StatusBadge status={machine.current_anomaly_state} type="anomaly" />
        </div>

        <div className="panel-card p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 font-mono">Maintenance Status</div>
            <div className="text-xs font-extrabold text-slate-900 mt-1 font-mono">{machine.maintenance_status}</div>
          </div>
          <StatusBadge status={machine.maintenance_status} type="status" />
        </div>
      </div>

      {/* 2D Digital Twin Schematic Component */}
      <MotorSchematic
        healthScore={machine.current_health}
        condition={investigation?.condition || 'HEALTHY'}
        processTempK={latestReading?.process_temperature_k}
        speedRpm={latestReading?.rotational_speed_rpm}
        torqueNm={latestReading?.torque_nm}
        toolWearMin={latestReading?.tool_wear_min}
        powerW={latestReading?.power_w}
      />

      {/* FAILURE INVESTIGATION WORKSPACE */}
      <div className="panel-card p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-300/80 pb-3.5">
          <Activity className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-mono uppercase tracking-wider">
              FAILURE INVESTIGATION WORKSPACE
            </h3>
            <p className="text-xs font-semibold text-slate-600">Model-explainable parameter deviations and contributing operational factors</p>
          </div>
        </div>

        {/* WHAT CHANGED? Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider font-mono">
            1. WHAT CHANGED? (BASELINE COMPARISON)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {investigation?.what_changed.map((delta, i) => {
              const isUp = delta.direction === 'UP';
              const isDown = delta.direction === 'DOWN';
              return (
                <div key={i} className="p-4 bg-white border border-slate-300 rounded-xl space-y-1.5 font-mono shadow-xs">
                  <div className="text-[11px] font-sans font-bold text-slate-700 flex items-center justify-between">
                    <span>{delta.parameter}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${isUp ? 'text-amber-900 bg-amber-100 border border-amber-300' : isDown ? 'text-blue-900 bg-blue-100 border border-blue-300' : 'text-slate-700 bg-slate-200'}`}>
                      {delta.direction}
                    </span>
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 flex items-center justify-between">
                    <span>{delta.current_val.toFixed(1)} {delta.unit}</span>
                    <span className={`text-xs font-extrabold flex items-center ${isUp ? 'text-amber-700' : isDown ? 'text-blue-700' : 'text-slate-500'}`}>
                      {isUp ? <ArrowUp className="w-3.5 h-3.5 mr-0.5" /> : isDown ? <ArrowDown className="w-3.5 h-3.5 mr-0.5" /> : <Minus className="w-3.5 h-3.5 mr-0.5" />}
                      {delta.delta > 0 ? `+${delta.delta}` : delta.delta} {delta.unit}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans font-semibold">Baseline Nominal: {delta.baseline_val} {delta.unit}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CONTRIBUTING FACTORS Section */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider font-mono">
            2. CONTRIBUTING OPERATIONAL FACTORS
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {investigation?.contributing_factors.map((factor, i) => (
              <div key={i} className="p-4 bg-white border border-slate-300 rounded-xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-extrabold text-slate-900">{factor.factor_name}</span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                    factor.impact_level === 'HIGH' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                    factor.impact_level === 'MODERATE' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                    'bg-slate-200 text-slate-800 border border-slate-300'
                  }`}>
                    {factor.impact_level} IMPACT (Score: {factor.attribution_score.toFixed(2)})
                  </span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-sans font-medium">{factor.human_explanation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CONDITION ASSESSMENT & RECOMMENDED ACTION */}
        <div className="p-4 bg-white border border-slate-300 rounded-xl space-y-3 font-sans shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider font-mono">
              3. CONDITION ASSESSMENT &amp; OPERATIONAL RECOMMENDATION
            </h4>
            <StatusBadge status={investigation?.condition || 'HEALTHY'} type="health" />
          </div>
          <p className="text-xs text-slate-800 leading-relaxed font-medium">{investigation?.condition_assessment}</p>
          <div className="p-3.5 bg-blue-50/80 border border-blue-300 rounded-xl flex items-start space-x-2.5 text-xs text-blue-950 font-medium">
            <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-slate-900">Recommended Action: </span>
              {investigation?.recommended_action}
            </div>
          </div>
        </div>
      </div>

      {/* MACHINE CONDITION STORY (COMPACT TIMELINE) */}
      <div className="panel-card p-5 space-y-3">
        <h4 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider font-mono">
          MACHINE CONDITION STORY &amp; EVENT TIMELINE
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center text-xs">
          <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1 shadow-xs">
            <div className="text-[10px] font-mono text-blue-700 font-extrabold">1. NORMAL</div>
            <div className="text-[11px] font-extrabold text-slate-900">Baseline Verified</div>
          </div>
          <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1 shadow-xs">
            <div className="text-[10px] font-mono text-blue-700 font-extrabold">2. CHANGE</div>
            <div className="text-[11px] font-extrabold text-slate-900">Operating Shift</div>
          </div>
          <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1 shadow-xs">
            <div className="text-[10px] font-mono text-blue-700 font-extrabold">3. DEVIATION</div>
            <div className="text-[11px] font-extrabold text-slate-900">Anomaly Flagged</div>
          </div>
          <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1 shadow-xs">
            <div className="text-[10px] font-mono text-blue-700 font-extrabold">4. RISK</div>
            <div className="text-[11px] font-extrabold text-slate-900">XGBoost Estimated</div>
          </div>
          <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1 shadow-xs">
            <div className="text-[10px] font-mono text-blue-700 font-extrabold">5. ALERT</div>
            <div className="text-[11px] font-extrabold text-slate-900">Engine Dispatched</div>
          </div>
          <div className="p-3 bg-white border border-slate-300 rounded-xl space-y-1 shadow-xs">
            <div className="text-[10px] font-mono text-blue-700 font-extrabold">6. REVIEW</div>
            <div className="text-[11px] font-extrabold text-slate-900">Operator Decision</div>
          </div>
        </div>
      </div>

      {/* SENSOR TREND CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Trend */}
        <div className="panel-card p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-mono">
            Process &amp; Ambient Temperature History (K)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" strokeOpacity={0.5} />
                <XAxis dataKey="timestamp" stroke="#64748b" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                <YAxis domain={['auto', 'auto']} stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="process_temperature_k" stroke="#e11d48" name="Process Temp (K)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="air_temperature_k" stroke="#0284c7" name="Air Temp (K)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Speed & Torque Trend */}
        <div className="panel-card p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-mono">
            Rotational Speed (RPM) &amp; Torque (Nm)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" strokeOpacity={0.5} />
                <XAxis dataKey="timestamp" stroke="#64748b" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                <YAxis yAxisId="left" stroke="#0284c7" />
                <YAxis yAxisId="right" orientation="right" stroke="#d97706" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Line yAxisId="left" type="monotone" dataKey="rotational_speed_rpm" stroke="#0284c7" name="Speed (RPM)" strokeWidth={2.5} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="torque_nm" stroke="#d97706" name="Torque (Nm)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE TECHNICAL MODEL DETAILS */}
      <div className="panel-card overflow-hidden">
        <button
          onClick={() => setShowTechDetails(!showTechDetails)}
          className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-mono font-extrabold text-slate-800 transition-all border-b border-slate-200"
        >
          <span className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>TECHNICAL MODEL SPECIFICATIONS &amp; BENCHMARKS</span>
          </span>
          {showTechDetails ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {showTechDetails && (
          <div className="p-6 space-y-3 text-xs text-slate-800 font-mono bg-white">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div><span className="text-slate-500 block text-[10px] font-sans">Classifier:</span> XGBoost Production</div>
              <div><span className="text-slate-500 block text-[10px] font-sans">ROC-AUC:</span> 0.9886</div>
              <div><span className="text-slate-500 block text-[10px] font-sans">PR-AUC:</span> 0.9277</div>
              <div><span className="text-slate-500 block text-[10px] font-sans">Recall:</span> 0.9412</div>
            </div>
            <p className="text-[11px] text-slate-600 font-sans pt-2 font-medium">
              Model inputs map dataset telemetry excluding direct failure mode target leakage. Risk is evaluated as continuous probability estimate.
            </p>
          </div>
        )}
      </div>

      {/* SCHEDULE MAINTENANCE MODAL */}
      {showMaintModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-100 border border-slate-300 max-w-lg w-full p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-300 pb-3.5">
              <h3 className="text-base font-extrabold text-slate-900 font-mono flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>HUMAN OPERATOR MAINTENANCE APPROVAL</span>
              </h3>
              <button onClick={() => setShowMaintModal(false)} className="text-slate-500 hover:text-slate-900 font-bold">✕</button>
            </div>

            {maintError && (
              <div className="p-3.5 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl text-xs font-mono font-bold">
                {maintError}
              </div>
            )}

            {maintSuccess && (
              <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-mono font-bold">
                {maintSuccess}
              </div>
            )}

            <form onSubmit={handleScheduleMaintenanceSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Target Machine ID</label>
                <input type="text" readOnly value={machine.machine_id} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold shadow-xs" />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Maintenance Type</label>
                <select value={maintType} onChange={(e) => setMaintType(e.target.value)} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold shadow-xs">
                  <option value="PREVENTIVE">PREVENTIVE INSPECTION</option>
                  <option value="CORRECTIVE">CORRECTIVE REPAIR</option>
                  <option value="INSPECTION">ROUTINE SENSOR CALIBRATION</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Scheduled Date &amp; Time</label>
                <input type="datetime-local" value={maintDate} onChange={(e) => setMaintDate(e.target.value)} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold shadow-xs" />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Assigned Team / Technician</label>
                <input type="text" value={maintTech} onChange={(e) => setMaintTech(e.target.value)} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold shadow-xs" />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Description &amp; Work Order Notes</label>
                <textarea rows={3} value={maintDesc} onChange={(e) => setMaintDesc(e.target.value)} placeholder="Enter work order instructions..." className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold shadow-xs" />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowMaintModal(false)} className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-800 font-extrabold hover:bg-slate-200">
                  Cancel
                </button>
                <button type="submit" disabled={submittingMaint} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold rounded-xl transition-all shadow-md">
                  {submittingMaint ? 'Persisting...' : 'Confirm Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

