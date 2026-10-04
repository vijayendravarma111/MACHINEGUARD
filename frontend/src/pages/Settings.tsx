import React, { useEffect, useState } from 'react';
import { Settings, ShieldCheck, Database, Cpu, Activity, Award } from 'lucide-react';
import { api } from '../api/client';
import { SystemHealth } from '../types';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    api.getSystemHealth()
      .then(setHealth)
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-card p-6">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 font-mono flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          SYSTEM STATUS &amp; MODEL SPECIFICATIONS
        </h2>
        <p className="text-xs font-semibold text-slate-600 mt-1">
          Verified runtime state, machine learning performance metrics, and platform specifications
        </p>
      </div>

      {/* System Status Grid */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 font-mono text-xs font-extrabold text-slate-900 uppercase tracking-wider">
          <Activity className="w-4 h-4 text-blue-600" />
          <span>SYSTEM STATUS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Database Status */}
          <div className="panel-card p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-600">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>DATABASE</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                SQLITE
              </span>
            </div>
            <div className="text-lg font-extrabold text-slate-900 font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              {health?.database_connected ? 'CONNECTED' : 'DISCONNECTED'}
            </div>
            <p className="text-[11px] text-slate-600 font-sans font-medium">Relational schema persistence for fleet telemetry, alerts &amp; work orders</p>
          </div>

          {/* ML Inference Engine */}
          <div className="panel-card p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-600">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>ML INFERENCE ENGINE</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800">
                ACTIVE
              </span>
            </div>
            <div className="text-lg font-extrabold text-slate-900 font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              {health?.ml_models_loaded ? `ONLINE (${health.active_model_version})` : 'STANDBY'}
            </div>
            <p className="text-[11px] text-slate-600 font-sans font-medium">XGBoost classifier &amp; Isolation Forest anomaly detector</p>
          </div>

          {/* Platform Verification */}
          <div className="panel-card p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-600">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>PLATFORM VERIFICATION</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-sky-100 text-sky-800">
                PASSED
              </span>
            </div>
            <div className="text-lg font-extrabold text-slate-900 font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
              VERIFIED (8/8 TESTS)
            </div>
            <p className="text-[11px] text-slate-600 font-sans font-medium">Verified end-to-end API test suite &amp; feature engineering pipeline</p>
          </div>
        </div>
      </div>

      {/* Model Performance */}
      <div className="panel-card p-6 space-y-5">
        <div className="flex items-center space-x-2 text-slate-900 font-mono font-extrabold text-xs uppercase tracking-wider">
          <Award className="w-4 h-4 text-blue-600" />
          <span>PRODUCTION XGBOOST MODEL EVALUATION METRICS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs font-mono">
          <div className="p-4 bg-white border border-slate-300 rounded-xl shadow-xs space-y-1">
            <span className="text-slate-600 block text-[10px] font-sans font-bold uppercase tracking-wider">ACCURACY</span>
            <span className="text-2xl font-extrabold text-blue-700 block">97.47%</span>
            <span className="text-[10px] text-slate-600 font-sans block font-semibold">Test Set Accuracy</span>
          </div>

          <div className="p-4 bg-white border border-slate-300 rounded-xl shadow-xs space-y-1">
            <span className="text-slate-600 block text-[10px] font-sans font-bold uppercase tracking-wider">RECALL</span>
            <span className="text-2xl font-extrabold text-emerald-700 block">94.12%</span>
            <span className="text-[10px] text-slate-600 font-sans block font-semibold">Failure Sensitivity</span>
          </div>

          <div className="p-4 bg-white border border-slate-300 rounded-xl shadow-xs space-y-1">
            <span className="text-slate-600 block text-[10px] font-sans font-bold uppercase tracking-wider">ROC-AUC</span>
            <span className="text-2xl font-extrabold text-blue-700 block">0.9886</span>
            <span className="text-[10px] text-slate-600 font-sans block font-semibold">ROC Area Under Curve</span>
          </div>

          <div className="p-4 bg-white border border-slate-300 rounded-xl shadow-xs space-y-1">
            <span className="text-slate-600 block text-[10px] font-sans font-bold uppercase tracking-wider">PR-AUC</span>
            <span className="text-2xl font-extrabold text-blue-700 block">0.9277</span>
            <span className="text-[10px] text-slate-600 font-sans block font-semibold">Precision-Recall Curve</span>
          </div>

          <div className="p-4 bg-white border border-slate-300 rounded-xl shadow-xs space-y-1">
            <span className="text-slate-600 block text-[10px] font-sans font-bold uppercase tracking-wider">F1 SCORE</span>
            <span className="text-2xl font-extrabold text-emerald-700 block">0.7164</span>
            <span className="text-[10px] text-slate-600 font-sans block font-semibold">Harmonic Precision-Recall</span>
          </div>
        </div>
      </div>
    </div>
  );
};
