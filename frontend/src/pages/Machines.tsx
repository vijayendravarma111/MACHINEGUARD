import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Search, Filter, RefreshCw, ArrowRight, Activity, Wrench } from 'lucide-react';
import { api } from '../api/client';
import { Machine } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const Machines: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [maintFilter, setMaintFilter] = useState('ALL');

  const loadMachines = () => {
    setLoading(true);
    api.getMachines()
      .then(setMachines)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMachines();
  }, []);

  const getConditionCategory = (health: number) => {
    if (health >= 80) return 'HEALTHY';
    if (health >= 60) return 'WATCH';
    if (health >= 40) return 'WARNING';
    return 'CRITICAL';
  };

  const filteredMachines = machines.filter((m) => {
    const matchesSearch =
      m.machine_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.machine_type.toLowerCase().includes(searchTerm.toLowerCase());

    const condCategory = getConditionCategory(m.current_health);
    const matchesCondition = conditionFilter === 'ALL' || condCategory === conditionFilter;

    const matchesMaint =
      maintFilter === 'ALL' ||
      (maintFilter === 'SCHEDULED' && ['SCHEDULED', 'IN_PROGRESS'].includes(m.maintenance_status)) ||
      (maintFilter === 'NORMAL' && m.maintenance_status === 'NORMAL');

    return matchesSearch && matchesCondition && matchesMaint;
  });

  if (loading && machines.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-600" />
        Loading Machine Fleet Directory...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 panel-card card-header-blue p-6 md:p-8">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 font-mono flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-blue-600" />
              FLEET MACHINE TWINS DIRECTORY
            </h2>
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold bg-blue-100/80 text-blue-800 border border-blue-200 shadow-xs">
              {filteredMachines.length} / {machines.length} TWINS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Centralized inventory of simulated industrial rotating machine twins and active health parameters across 8 operational assets
          </p>
        </div>

        <button
          onClick={loadMachines}
          className="inline-flex items-center px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2 text-blue-600" />
          Refresh Fleet Data
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="panel-card p-6 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, Name, or Equipment Type (e.g. Pump, Spindle, Compressor)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-mono shadow-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-600 font-bold">Condition:</span>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="py-2 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 shadow-xs"
            >
              <option value="ALL">All Conditions ({machines.length})</option>
              <option value="HEALTHY">HEALTHY (≥80%)</option>
              <option value="WATCH">WATCH (60-79%)</option>
              <option value="WARNING">WARNING (40-59%)</option>
              <option value="CRITICAL">CRITICAL (&lt;40%)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-600 font-bold">Maintenance:</span>
            <select
              value={maintFilter}
              onChange={(e) => setMaintFilter(e.target.value)}
              className="py-2 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 shadow-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled / Active</option>
              <option value="NORMAL">Normal / None</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMachines.length === 0 ? (
          <div className="col-span-full panel-card p-12 text-center text-slate-500 text-xs font-mono">
            No machine twins match the search query or active filter criteria.
          </div>
        ) : (
          filteredMachines.map((m) => {
            const condCat = getConditionCategory(m.current_health);
            const isCritical = condCat === 'CRITICAL';
            const isWarning = condCat === 'WARNING' || condCat === 'WATCH';

            return (
              <div
                key={m.machine_id}
                className={`panel-card-interactive p-6 flex flex-col justify-between space-y-5 ${
                  isCritical
                    ? 'border-rose-300 bg-gradient-to-b from-white via-white to-rose-50/40'
                    : isWarning
                    ? 'border-amber-300 bg-gradient-to-b from-white via-white to-amber-50/40'
                    : 'bg-white'
                }`}
              >
                {/* Machine Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 font-mono">{m.machine_id}</h3>
                    <p className="text-xs text-slate-700 font-semibold">{m.name}</p>
                    <span className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] bg-slate-100 text-slate-600 font-mono font-semibold border border-slate-200">
                      {m.machine_type}
                    </span>
                  </div>
                  <StatusBadge status={m.operating_status} type="status" />
                </div>

                {/* Machine Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/90 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Health Score</span>
                    <span className={`font-extrabold text-sm ${isCritical ? 'text-rose-700' : isWarning ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {m.current_health.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Failure Risk</span>
                    <span className="font-extrabold text-sm text-slate-900">
                      {(m.current_risk * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Anomaly State</span>
                    <StatusBadge status={m.current_anomaly_state} type="anomaly" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Condition</span>
                    <span className={`font-extrabold ${isCritical ? 'text-rose-700' : isWarning ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {condCat}
                    </span>
                  </div>
                </div>

                {/* Maintenance Status Bar */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <Wrench className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500 text-[11px] font-medium">Maint Status:</span>
                  </div>
                  <StatusBadge status={m.maintenance_status} type="health" />
                </div>

                {/* Action Button */}
                <Link
                  to={`/machines/${m.machine_id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-blue-700 font-extrabold text-xs rounded-xl transition-all shadow-xs"
                >
                  <Activity className="w-3.5 h-3.5 mr-2" />
                  Inspect Twin &amp; Investigation <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


