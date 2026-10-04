import React, { useEffect, useState } from 'react';
import { Bell, Filter, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { Alert } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statusTab, setStatusTab] = useState<'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ALL'>('OPEN');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadAlerts = () => {
    setLoading(true);
    api.getAlerts(severityFilter === 'ALL' ? undefined : severityFilter, statusTab === 'ALL' ? undefined : statusTab)
      .then(setAlerts)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAlerts();
  }, [severityFilter, statusTab]);

  const handleAcknowledge = (alertId: number) => {
    api.acknowledgeAlert(alertId, 'Operations Operator')
      .then(() => loadAlerts())
      .catch(console.error);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 panel-card card-header-blue p-6 md:p-8">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 font-mono flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-blue-600" />
            ALERT MANAGEMENT CENTER
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
            Automated anomaly detection alerts and operational acknowledgement workflow
          </p>
        </div>
        <button
          onClick={loadAlerts}
          className="inline-flex items-center px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2 text-blue-600" />
          Refresh Alerts
        </button>
      </div>

      {/* Tabs & Filter Controls */}
      <div className="panel-card p-6 flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-200/80 p-1.5 rounded-xl border border-slate-300/80 text-xs font-mono">
          {(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'ALL'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-4 py-2 rounded-lg font-extrabold transition-all cursor-pointer ${
                statusTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
              }`}
            >
              {tab === 'OPEN' ? 'Open Alerts' : tab === 'ACKNOWLEDGED' ? 'Acknowledged' : tab === 'RESOLVED' ? 'Resolved' : 'All Alerts'}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-slate-700 font-extrabold">Severity:</span>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="py-2 px-3.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-extrabold focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="WARNING">WARNING</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="panel-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-200/90 text-slate-900 uppercase tracking-wider font-extrabold border-b border-slate-300 font-mono text-[11px]">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Machine ID</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Reason / Operational Event</th>
                <th className="px-6 py-4">Recommended Operational Action</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-600 text-xs font-mono">
                    Loading telemetry alerts...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-600 text-xs font-mono">
                    No alerts matching the selected status or severity filter.
                  </td>
                </tr>
              ) : (
                alerts.map(a => (
                  <tr key={a.alert_id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-700 font-mono font-semibold text-[11px]">
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-extrabold font-mono text-slate-900 text-sm">{a.machine_id}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={a.severity} type="severity" />
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-900 max-w-xs">{a.reason}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium max-w-sm leading-relaxed">{a.recommended_action}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={a.status} type="status" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {a.status === 'OPEN' ? (
                        <button
                          onClick={() => handleAcknowledge(a.alert_id)}
                          className="px-4 py-2 text-xs font-extrabold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-xs cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-600 font-mono font-bold">
                          Ack'd by {a.acknowledged_by || 'Operator'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


