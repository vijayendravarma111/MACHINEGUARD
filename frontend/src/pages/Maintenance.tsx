import React, { useEffect, useState } from 'react';
import { Wrench, RefreshCw, Plus } from 'lucide-react';
import { api } from '../api/client';
import { MaintenanceRecord, Machine } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const MaintenancePage: React.FC = () => {
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [targetMachineId, setTargetMachineId] = useState('MOTOR-001');
  const [maintType, setMaintType] = useState('PREVENTIVE');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintTech, setMaintTech] = useState('Mechanical Maintenance Team');
  const [maintDate, setMaintDate] = useState('2026-09-25T10:00');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getMaintenance(),
      api.getMachines()
    ]).then(([mList, macList]) => {
      setMaintenance(mList);
      setMachines(macList);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);
    setModalSuccess(null);

    api.createMaintenance({
      machine_id: targetMachineId,
      scheduled_date: new Date(maintDate).toISOString(),
      maintenance_type: maintType as any,
      description: maintDesc || 'Routine preventive maintenance inspection.',
      technician: maintTech,
      status: 'SCHEDULED'
    })
      .then(() => {
        setModalSuccess('Maintenance work order successfully created and persisted.');
        setTimeout(() => {
          setShowModal(false);
          setModalSuccess(null);
          loadData();
        }, 1200);
      })
      .catch((err) => {
        setModalError(err.message || 'Failed to create maintenance work order.');
      })
      .finally(() => setSubmitting(false));
  };

  const handleComplete = (recordId: number) => {
    api.completeMaintenance(recordId)
      .then(() => loadData())
      .catch(console.error);
  };

  const filteredMaintenance = maintenance.filter((m) => {
    if (filterTab === 'ACTIVE') return ['SCHEDULED', 'IN_PROGRESS'].includes(m.status);
    if (filterTab === 'COMPLETED') return m.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 panel-card card-header-amber p-6 md:p-8">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 font-mono flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-amber-600" />
            HUMAN OPERATOR MAINTENANCE MANAGEMENT
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
            Human-in-the-loop work order scheduling, assignment, and database tracking log
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Schedule Work Order
          </button>
          <button
            onClick={loadData}
            className="inline-flex items-center px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2 text-blue-600" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="panel-card p-6 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 bg-slate-200/80 p-1.5 rounded-xl border border-slate-300/80 text-xs font-mono">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-4 py-2 rounded-lg font-extrabold transition-all cursor-pointer ${
              filterTab === 'ALL' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
            }`}
          >
            All Work Orders ({maintenance.length})
          </button>
          <button
            onClick={() => setFilterTab('ACTIVE')}
            className={`px-4 py-2 rounded-lg font-extrabold transition-all cursor-pointer ${
              filterTab === 'ACTIVE' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
            }`}
          >
            Scheduled / Active ({maintenance.filter(m => ['SCHEDULED', 'IN_PROGRESS'].includes(m.status)).length})
          </button>
          <button
            onClick={() => setFilterTab('COMPLETED')}
            className={`px-4 py-2 rounded-lg font-extrabold transition-all cursor-pointer ${
              filterTab === 'COMPLETED' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
            }`}
          >
            Completed ({maintenance.filter(m => m.status === 'COMPLETED').length})
          </button>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="panel-card rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-200/90 text-slate-900 uppercase tracking-wider font-extrabold border-b border-slate-300 font-mono text-[11px]">
              <tr>
                <th className="px-6 py-4">Scheduled Date</th>
                <th className="px-6 py-4">Machine ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Assigned Team / Technician</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-600 text-xs font-mono">
                    Loading maintenance records...
                  </td>
                </tr>
              ) : filteredMaintenance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-600 text-xs font-mono">
                    No maintenance records found matching the active filter tab.
                  </td>
                </tr>
              ) : (
                filteredMaintenance.map((m) => (
                  <tr key={m.record_id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-6 py-4 text-slate-700 font-mono text-[11px] font-semibold">
                      {new Date(m.scheduled_date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-extrabold font-mono text-slate-900 text-sm">{m.machine_id}</td>
                    <td className="px-6 py-4 font-mono text-xs text-blue-700 font-extrabold">{m.maintenance_type}</td>
                    <td className="px-6 py-4 text-slate-900 font-semibold max-w-sm">{m.description}</td>
                    <td className="px-6 py-4 text-slate-700 font-bold">{m.technician}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={m.status} type="status" />
                    </td>
                    <td className="px-6 py-4">
                      {m.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => handleComplete(m.record_id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-extrabold text-[11px] rounded-lg shadow-xs transition-all cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400 font-bold">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* CREATE WORK ORDER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-100 border border-slate-300 max-w-lg w-full p-7 rounded-2xl shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
              <h3 className="text-base font-extrabold text-slate-900 font-mono flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>SCHEDULE MAINTENANCE WORK ORDER</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-900 text-lg font-bold cursor-pointer">✕</button>
            </div>

            {modalError && (
              <div className="p-3.5 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl text-xs font-mono font-bold">
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-mono font-bold">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Target Machine ID</label>
                <select value={targetMachineId} onChange={(e) => setTargetMachineId(e.target.value)} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 shadow-xs">
                  {machines.map(m => (
                    <option key={m.machine_id} value={m.machine_id}>{m.machine_id} — {m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Maintenance Type</label>
                <select value={maintType} onChange={(e) => setMaintType(e.target.value)} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 shadow-xs">
                  <option value="PREVENTIVE">PREVENTIVE INSPECTION</option>
                  <option value="CORRECTIVE">CORRECTIVE REPAIR</option>
                  <option value="INSPECTION">ROUTINE SENSOR CALIBRATION</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Scheduled Date &amp; Time</label>
                <input type="datetime-local" value={maintDate} onChange={(e) => setMaintDate(e.target.value)} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 shadow-xs" />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Assigned Team / Technician</label>
                <input type="text" value={maintTech} onChange={(e) => setMaintTech(e.target.value)} className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 shadow-xs" />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1">Description &amp; Work Order Notes</label>
                <textarea rows={3} value={maintDesc} onChange={(e) => setMaintDesc(e.target.value)} placeholder="Enter work order instructions..." className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-medium focus:outline-none focus:border-blue-500 shadow-xs" />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-800 font-bold hover:bg-slate-200 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold rounded-xl transition-all shadow-md cursor-pointer">
                  {submitting ? 'Persisting...' : 'Confirm Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


