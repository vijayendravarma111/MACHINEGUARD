import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  statusColor?: 'neutral' | 'emerald' | 'amber' | 'rose' | 'cyan';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  statusColor = 'neutral'
}) => {
  const iconColorClass = {
    neutral: 'text-slate-700 bg-slate-100 border-slate-200/90 shadow-xs',
    emerald: 'text-emerald-700 bg-emerald-100/70 border-emerald-200 shadow-xs',
    amber: 'text-amber-700 bg-amber-100/70 border-amber-200 shadow-xs',
    rose: 'text-rose-700 bg-rose-100/70 border-rose-200 shadow-xs',
    cyan: 'text-blue-700 bg-blue-100/70 border-blue-200 shadow-xs',
  }[statusColor];

  const cardGradientClass = {
    neutral: 'hover:border-slate-300',
    emerald: 'bg-gradient-to-br from-white via-white to-emerald-50/40 border-emerald-200/80 hover:border-emerald-400',
    amber: 'bg-gradient-to-br from-white via-white to-amber-50/40 border-amber-200/80 hover:border-amber-400',
    rose: 'bg-gradient-to-br from-white via-white to-rose-50/40 border-rose-200/80 hover:border-rose-400',
    cyan: 'bg-gradient-to-br from-white via-white to-blue-50/40 border-blue-200/80 hover:border-blue-400',
  }[statusColor];

  return (
    <div className={`panel-card-interactive p-6 flex items-start justify-between relative overflow-hidden ${cardGradientClass}`}>
      <div className="z-10">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">{title}</p>
        <h3 className="text-2xl font-extrabold text-slate-900 mt-2 font-mono tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
        {trend && <p className="text-xs text-slate-700 font-semibold mt-2.5 flex items-center gap-1.5">{trend}</p>}
      </div>
      <div className={`p-3 rounded-2xl border ${iconColorClass} z-10 shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};



