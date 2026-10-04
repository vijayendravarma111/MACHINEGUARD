import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Activity,
  Bell,
  Wrench,
  PlaySquare,
  Settings
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Machines', path: '/machines', icon: Cpu },
  { name: 'Live Monitoring', path: '/live', icon: Activity },
  { name: 'Alerts', path: '/alerts', icon: Bell },
  { name: 'Maintenance', path: '/maintenance', icon: Wrench },
  { name: 'Simulation Lab', path: '/simulation', icon: PlaySquare },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-slate-200 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-65px)] transition-all duration-300 shadow-xl">
      <div className="py-6 px-4">
        <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 font-mono">
          PRIMARY NAVIGATION
        </p>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 border-l-4 border-cyan-400'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white hover:translate-x-1'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-5 border-t border-slate-800/80 text-[11px] text-slate-300 bg-slate-950/80">
        <p className="font-bold text-white flex items-center gap-2 font-sans">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm animate-pulse" />
          Software Twin Core
        </p>
        <p className="mt-1 text-slate-400 text-[10px]">AI4I Predictive Telemetry</p>
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-400">ML Model:</span>
          <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">XGBoost Active</span>
        </div>
      </div>
    </aside>
  );
};




