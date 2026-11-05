import React from 'react';
import {
  Power,
  Flame,
  Star,
  Clock,
  Compass,
  ArrowUpRight,
  TrendingUp,
  Shield,
  Play,
} from 'lucide-react';
import { sounds } from '../../utils/sound';

interface DriverDashboardProps {
  isOnline: boolean;
  onToggleOnline: () => void;
  showSurge: boolean;
  onToggleSurge: () => void;
  todayEarnings: number;
  tripsCount: number;
  onSimulateIncomingRide: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  isOnline,
  onToggleOnline,
  showSurge,
  onToggleSurge,
  todayEarnings,
  tripsCount,
  onSimulateIncomingRide,
}) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
      {/* Top Status & Online Switch */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isOnline ? 'Online & Searching for Trips' : 'Offline'}
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Driver Partner Command
          </h2>
        </div>

        {/* Master Go Online / Offline Toggle */}
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onToggleOnline();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs transition-all shadow-md active:scale-95 ${
            isOnline
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{isOnline ? 'Go Offline' : 'Go Online'}</span>
        </button>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-center">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Today's Earnings</div>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
            ${todayEarnings.toFixed(2)}
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-center">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Trips Done</div>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
            {tripsCount}
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-center">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Driver Rating</div>
          <div className="text-lg font-extrabold text-amber-500 flex items-center justify-center gap-0.5 mt-0.5">
            <Star className="w-4 h-4 fill-amber-400 inline" />
            <span className="tabular-nums">4.98</span>
          </div>
        </div>
      </div>

      {/* Controls & Heatmap toggle */}
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <Flame className="w-5 h-5 text-red-500" />
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Surge Heatmap Layer</div>
            <div className="text-[11px] text-slate-500">Show high-demand bonus zones (+1.3x to 1.8x)</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onToggleSurge();
          }}
          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
            showSurge ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
              showSurge ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {/* Simulation Trigger Button */}
      {isOnline && (
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onSimulateIncomingRide();
          }}
          className="w-full py-3 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Simulate Incoming Rider Request Now</span>
        </button>
      )}

      {!isOnline && (
        <p className="text-center text-xs text-slate-400">
          Tap "Go Online" above to start streaming GPS location and receiving rider dispatches.
        </p>
      )}
    </div>
  );
};
