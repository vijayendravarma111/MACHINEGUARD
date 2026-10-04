import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'health' | 'status' | 'severity' | 'anomaly' | 'risk';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status' }) => {
  const s = (status || '').toUpperCase();

  let styleClass = 'bg-slate-100 text-slate-700 border-slate-200';

  if (type === 'health' || type === 'status') {
    if (['ONLINE', 'HEALTHY', 'COMPLETED', 'NORMAL', 'RESOLVED', 'NONE'].includes(s)) {
      styleClass = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-extrabold shadow-xs';
    } else if (['WATCH', 'WARNING', 'INSPECTION RECOMMENDED', 'MONITORING REQUIRED', 'IN_PROGRESS', 'SCHEDULED'].includes(s)) {
      styleClass = 'bg-amber-50 text-amber-800 border-amber-200 font-extrabold shadow-xs';
    } else if (['CRITICAL', 'CRITICAL MAINTENANCE DUE', 'OFFLINE', 'ABNORMAL', 'HIGH', 'UNDER MAINTENANCE'].includes(s)) {
      styleClass = 'bg-rose-50 text-rose-800 border-rose-200 font-extrabold shadow-xs';
    } else if (['STANDBY'].includes(s)) {
      styleClass = 'bg-blue-50 text-blue-800 border-blue-200 font-extrabold shadow-xs';
    }
  } else if (type === 'severity') {
    if (s === 'CRITICAL') styleClass = 'bg-rose-100/90 text-rose-900 border-rose-300 font-extrabold shadow-xs';
    else if (s === 'HIGH') styleClass = 'bg-orange-100/90 text-orange-900 border-orange-300 font-bold shadow-xs';
    else if (s === 'WARNING') styleClass = 'bg-amber-100/90 text-amber-900 border-amber-300 font-bold shadow-xs';
    else styleClass = 'bg-sky-100/90 text-sky-900 border-sky-300 font-bold shadow-xs';
  } else if (type === 'risk') {
    if (s === 'CRITICAL') styleClass = 'bg-rose-100/90 text-rose-900 border-rose-300 font-extrabold shadow-xs';
    else if (s === 'HIGH') styleClass = 'bg-orange-100/90 text-orange-900 border-orange-300 font-bold shadow-xs';
    else if (s === 'MEDIUM') styleClass = 'bg-amber-100/90 text-amber-900 border-amber-300 font-bold shadow-xs';
    else styleClass = 'bg-emerald-100/90 text-emerald-900 border-emerald-300 font-bold shadow-xs';
  } else if (type === 'anomaly') {
    if (s === 'ABNORMAL') styleClass = 'bg-rose-100/90 text-rose-900 border-rose-300 font-extrabold shadow-xs';
    else styleClass = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-extrabold shadow-xs';
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-mono border ${styleClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        styleClass.includes('emerald') ? 'bg-emerald-500 animate-pulse' :
        styleClass.includes('amber') ? 'bg-amber-500' :
        styleClass.includes('orange') ? 'bg-orange-500' :
        styleClass.includes('rose') ? 'bg-rose-500 animate-pulse' :
        styleClass.includes('blue') ? 'bg-blue-500' : 'bg-slate-400'
      }`} />
      {status}
    </span>
  );
};



