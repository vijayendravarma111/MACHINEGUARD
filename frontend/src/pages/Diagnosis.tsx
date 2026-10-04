import React, { useEffect, useState } from 'react';
import { Stethoscope, CheckCircle, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import { Machine } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const Diagnosis: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedId, setSelectedId] = useState<string>('MOTOR-004');
  const [diagData, setDiagData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMachines().then(res => {
      setMachines(res);
      if (res.length > 0 && !selectedId) {
        setSelectedId(res[0].machine_id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    api.getMachineDiagnosis(selectedId)
      .then(setDiagData)
      .finally(() => setLoading(false));
  }, [selectedId]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="panel-card p-6 md:p-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-mono flex items-center gap-2.5">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            Explainable Fault Diagnosis &amp; Root Cause Engine
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Translates model outputs into plain English operational factors and technical feature attributions
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-600 font-medium">Select Machine Twin:</span>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="py-2 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
          >
            {machines.map(m => (
              <option key={m.machine_id} value={m.machine_id}>
                {m.machine_id} — {m.name} ({m.current_health.toFixed(0)}% Health)
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="panel-card p-12 text-center text-slate-500 text-sm">Evaluating diagnostic parameters...</div>
      ) : diagData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Diagnosis Summary Card */}
          <div className="lg:col-span-2 panel-card p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Machine Condition Assessment</span>
                <h3 className="text-lg font-bold text-slate-900 font-mono mt-0.5">{diagData.name} ({diagData.machine_id})</h3>
              </div>
              <StatusBadge status={diagData.risk_level} type="risk" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Health Score:</span>
                <span className="font-bold text-slate-900 text-sm">{diagData.current_health.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Estimated Risk:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{(diagData.current_risk * 100.0).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Anomaly State:</span>
                <StatusBadge status={diagData.anomaly_state} type="anomaly" />
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Active Model:</span>
                <span className="font-mono text-slate-700 font-semibold">{diagData.model_version}</span>
              </div>
            </div>

            {/* Probable Condition Section */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Probable Machine Condition</h4>
              <div className={`p-4 rounded-xl border flex items-start space-x-3.5 ${
                diagData.risk_level === 'CRITICAL' || diagData.risk_level === 'HIGH'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                {diagData.risk_level === 'CRITICAL' || diagData.risk_level === 'HIGH' ? (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h5 className="text-sm font-bold">{diagData.probable_fault}</h5>
                  <p className="text-xs mt-1 leading-relaxed">
                    {diagData.risk_level === 'CRITICAL'
                      ? 'Multiple abnormal operational parameters exceed baseline safety thresholds. Immediate component inspection recommended.'
                      : diagData.risk_level === 'HIGH'
                      ? 'Machine is exhibiting abnormal operating characteristics outside its trained baseline model.'
                      : 'Operating parameters are within expected baseline limits.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contributing Operational Factors */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Top Contributing Operational Factors</h4>
              <div className="space-y-3">
                {diagData.contributing_factors.map((factor: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center font-mono">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-mono text-[10px] font-extrabold flex items-center justify-center mr-2">
                          {idx + 1}
                        </span>
                        {factor.factor_name}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        factor.impact_level === 'HIGH' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        factor.impact_level === 'MODERATE' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {factor.impact_level} IMPACT
                      </span>
                    </div>
                    <p className="text-slate-700 pl-7 leading-relaxed">{factor.human_explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Research & Technical Details Panel */}
          <div className="panel-card p-6 md:p-8 space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider">
              Technical Explainability
            </h3>

            <div className="text-xs text-slate-600 space-y-4">
              <p className="leading-relaxed">
                Explainable reasoning translates global XGBoost feature importances and local decision tree feature attributions into direct operational feedback.
              </p>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] space-y-1.5 shadow-sm">
                <div className="text-blue-400 font-semibold">// Feature Attribution Baseline</div>
                <div>Rotational Speed: ~32.9%</div>
                <div>Mechanical Power: ~18.3%</div>
                <div>Tool Wear Duration: ~18.2%</div>
                <div>Motor Torque: ~16.0%</div>
                <div>Thermal Delta: ~6.3%</div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-1.5">
                <h5 className="font-bold text-slate-800 text-xs">Methodological Integrity:</h5>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Calculations enforce target leakage prevention. All explanations reflect deterministic model feature weights trained exclusively on normal vs failure operational distributions.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

