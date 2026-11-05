import React from 'react';
import { ViewportMode } from '../../types';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

interface PhoneFrameProps {
  mode: ViewportMode;
  children: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ mode, children }) => {
  if (mode === 'desktop') {
    return <div className="w-full h-full flex flex-col">{children}</div>;
  }

  // Current time for the status bar
  const now = new Date();
  const timeString = `${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* Smartphone Outer Chassis */}
      <div className="relative w-full max-w-[420px] h-[92vh] max-h-[860px] bg-black rounded-[48px] p-3 shadow-2xl ring-1 ring-slate-800 flex flex-col overflow-hidden">
        {/* Phone Speaker & Dynamic Island Pill */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
        </div>

        {/* Inner Screen Bezel */}
        <div className="relative w-full h-full bg-white dark:bg-slate-900 rounded-[38px] overflow-hidden flex flex-col">
          {/* Mobile Status Bar */}
          <div className="h-8 px-6 flex items-center justify-between text-[11px] font-semibold text-slate-900 dark:text-white shrink-0 z-30 select-none">
            <span>{timeString}</span>
            <div className="flex items-center gap-1.5 opacity-80">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <BatteryMedium className="w-4 h-4" />
            </div>
          </div>

          {/* Screen Body */}
          <div className="flex-1 w-full relative overflow-hidden flex flex-col">
            {children}
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="h-4 w-full flex items-center justify-center shrink-0 z-30 pointer-events-none">
            <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
