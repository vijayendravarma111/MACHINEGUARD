import React, { useEffect, useState } from 'react';
import { BarChart3, CheckCircle } from 'lucide-react';
import { api } from '../api/client';

export const ModelInsights: React.FC = () => {
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getModelMetadata()
      .then(setMeta)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="panel-card p-12 text-center text-slate-500 text-sm">Loading model metadata &amp; benchmarks...</div>;
  }

  const metrics = meta?.metrics || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="panel-card p-6 md:p-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-extrabold text-slate-900 font-mono flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Machine Learning Model Insights &amp; Benchmarks
            </h2>
            <span className="font-mono text-xs bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full border border-blue-200 shadow-xs">
              ACTIVE VERSION: {meta?.active_version || 'v1.0.0'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Academic evaluation report, baseline comparison, and feature importance breakdown trained on {meta?.dataset_size || 10000} samples
          </p>
        </div>
      </div>

      {/* Model Overview Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="panel-card p-6">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Production Model</span>
          <span className="text-base font-extrabold text-slate-900 mt-1 block">{meta?.production_model || 'XGBoost'}</span>
        </div>
        <div className="panel-card p-6">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">ROC-AUC Score</span>
          <span className="text-2xl font-extrabold text-emerald-600 font-mono mt-1 block">
            {metrics['XGBoost (Production)']?.roc_auc || 0.9886}
          </span>
        </div>
        <div className="panel-card p-6">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">PR-AUC Score</span>
          <span className="text-2xl font-extrabold text-blue-600 font-mono mt-1 block">
            {metrics['XGBoost (Production)']?.pr_auc || 0.9277}
          </span>
        </div>
        <div className="panel-card p-6">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Failure Recall</span>
          <span className="text-2xl font-extrabold text-purple-600 font-mono mt-1 block">
            {((metrics['XGBoost (Production)']?.recall || 0.9412) * 100.0).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Comparative Evaluation Table */}
      <div className="panel-card overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">Baseline vs Production Model Evaluation Metrics (Test Set)</h3>
          <p className="text-xs text-slate-500 mt-1">Evaluated on 1,500 test set samples (3.39% failure class ratio preserved)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 text-[11px] font-mono">
              <tr>
                <th className="px-6 py-4">Model Architecture</th>
                <th className="px-6 py-4">Accuracy</th>
                <th className="px-6 py-4">Precision</th>
                <th className="px-6 py-4">Recall (Sensitivity)</th>
                <th className="px-6 py-4">F1-Score</th>
                <th className="px-6 py-4">ROC-AUC</th>
                <th className="px-6 py-4">PR-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {Object.entries(metrics).map(([modelName, m]: [string, any]) => (
                <tr key={modelName} className={modelName.includes('Production') ? 'bg-blue-50/50 font-bold' : 'hover:bg-slate-50/60'}>
                  <td className="px-6 py-4 font-sans font-bold text-slate-900 flex items-center">
                    {modelName.includes('Production') && <CheckCircle className="w-4 h-4 mr-2 text-blue-600 shrink-0" />}
                    {modelName}
                  </td>
                  <td className="px-6 py-4 text-slate-800">{m.accuracy}</td>
                  <td className="px-6 py-4 text-slate-800">{m.precision}</td>
                  <td className="px-6 py-4 text-purple-700 font-extrabold">{m.recall}</td>
                  <td className="px-6 py-4 text-slate-800">{m.f1_score}</td>
                  <td className="px-6 py-4 text-emerald-700 font-extrabold">{m.roc_auc}</td>
                  <td className="px-6 py-4 text-blue-700 font-extrabold">{m.pr_auc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Importance Breakdown */}
      <div className="panel-card p-6 md:p-8 space-y-6">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider font-mono">
          Global Feature Importance Attributions (XGBoost)
        </h3>

        <div className="space-y-4">
          {meta?.feature_importances && Object.entries(meta.feature_importances)
            .sort((a: any, b: any) => b[1] - a[1])
            .map(([col, imp]: [string, any]) => (
              <div key={col} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-800">{col}</span>
                  <span className="text-slate-600 font-bold">{(imp * 100.0).toFixed(2)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${imp * 100.0}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

