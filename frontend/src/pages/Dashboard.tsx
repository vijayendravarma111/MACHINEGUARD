import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, CheckCircle2, AlertTriangle, AlertOctagon, ArrowRight, RefreshCw, Bell, Activity } from 'lucide-react';
import { api } from '../api/client';
import { DashboardSummary, Alert } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getDashboardSummary(),
      api.getAlerts(undefined, 'OPEN')
    ]).then(([sum, al]) => {
      setData(sum);
      setRecentAlerts(al.slice(0, 6));
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-600" />
        Connecting to MachineGuard Software Twin...
      </div>
    );
  }

  const attentionMachines = data?.machines.filter(m => m.current_health < 80.0) || [];

  return (
    <div className="space-y-8">
      {/* Command Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 panel-card card-header-blue p-7 md:p-8">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 font-mono">
              MACHINE HEALTH COMMAND CENTER
            </h2>
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold bg-blue-100/80 text-blue-800 border border-blue-200 shadow-xs">
              8 MONITORED TWINS
            </span>
          </div>
          <p className="text-xs text-slate-600 flex items-center gap-2 mt-2 font-medium">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
            Continuous Machine Twin Telemetry Stream — {data?.total_machines || 8} Monitored Industrial Rotating Machine Twins
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="inline-flex items-center px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2 text-blue-600" />
            Refresh Telemetry
          </button>
          <Link
            to="/simulation"
            className="inline-flex items-center px-4.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            <Activity className="w-3.5 h-3.5 mr-2" />
            Simulation &amp; What-If Lab
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Monitored Twins"
          value={data?.total_machines || 8}
          subtitle="Rotating Machine Twins"
          icon={Cpu}
          statusColor="cyan"
        />
        <MetricCard
          title="Healthy Machines"
          value={data?.healthy_machines || 0}
          subtitle="Health score ≥ 80%"
          icon={CheckCircle2}
          statusColor="emerald"
        />
        <MetricCard
          title="Needs Attention"
          value={data?.warning_machines || 0}
          subtitle="Health score 40–79.99%"
          icon={AlertTriangle}
          statusColor="amber"
        />
        <MetricCard
          title="Critical Risk"
          value={data?.critical_machines || 0}
          subtitle="Health score < 40%"
          icon={AlertOctagon}
          statusColor="rose"
        />
      </div>

      {/* Main Content Grid: Machines Requiring Attention + Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Machines Requiring Attention Table */}
        <div className="lg:col-span-2 panel-card overflow-hidden">
          <div className="px-7 py-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">Machines Requiring Attention</h3>
              <p className="text-xs text-slate-500 mt-1">Units operating with Health &lt; 80% or active maintenance</p>
            </div>
            <Link to="/machines" className="text-xs text-blue-600 font-bold hover:underline flex items-center">
              Full Fleet Directory <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/90 font-mono text-[11px]">
                <tr>
                  <th className="px-7 py-4">Machine ID</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Health Score</th>
                  <th className="px-6 py-4">Failure Risk</th>
                  <th className="px-6 py-4">Maintenance Status</th>
                  <th className="px-7 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {attentionMachines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-7 py-10 text-center text-slate-500 text-xs">
                      All machine twins are operating within healthy parameters (≥ 80% Health).
                    </td>
                  </tr>
                ) : (
                  attentionMachines.map((m) => (
                    <tr key={m.machine_id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-7 py-4 font-bold text-slate-900">
                        <Link to={`/machines/${m.machine_id}`} className="hover:text-blue-600 font-mono">
                          {m.machine_id}
                        </Link>
                        <div className="text-[11px] font-sans font-medium text-slate-500">{m.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={m.operating_status} type="status" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${
                                m.current_health >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${m.current_health}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-900">{m.current_health.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {(m.current_risk * 100.0).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={m.maintenance_status} type="health" />
                      </td>
                      <td className="px-7 py-4 text-right font-sans">
                        <Link
                          to={`/machines/${m.machine_id}`}
                          className="px-3.5 py-1.5 text-xs font-bold text-blue-700 border border-blue-200 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all shadow-xs"
                        >
                          Investigate
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Open Alerts Panel */}
        <div className="panel-card p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono flex items-center">
              <Bell className="w-4 h-4 mr-2 text-blue-600" /> Recent Open Alerts
            </h3>
            <Link to="/alerts" className="text-xs text-blue-600 font-bold hover:underline">
              Alert Center
            </Link>
          </div>

          {recentAlerts.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No active open alerts requiring attention.</p>
          ) : (
            <div className="space-y-3.5">
              {recentAlerts.map(a => (
                <div key={a.alert_id} className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-1.5 hover:border-blue-300 transition-all shadow-xs">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={a.severity} type="severity" />
                    <span className="text-[11px] font-mono text-slate-600 font-bold">{a.machine_id}</span>
                  </div>
                  <p className="font-bold text-slate-900 text-xs leading-snug">{a.reason}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{a.recommended_action}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


