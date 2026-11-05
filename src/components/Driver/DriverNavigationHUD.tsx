import React, { useState } from 'react';
import {
  Navigation,
  CornerUpRight,
  ShieldCheck,
  CheckCircle,
  Gauge,
  MapPin,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ActiveTrip } from '../../types';
import { sounds } from '../../utils/sound';

interface DriverNavigationHUDProps {
  trip: ActiveTrip;
  simSpeed: number;
  onSetSimSpeed: (speed: number) => void;
  onDriverArrived: () => void;
  onVerifyPinAndStart: (pin: string) => boolean;
  onCompleteTrip: () => void;
}

export const DriverNavigationHUD: React.FC<DriverNavigationHUDProps> = ({
  trip,
  simSpeed,
  onSetSimSpeed,
  onDriverArrived,
  onVerifyPinAndStart,
  onCompleteTrip,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playTap();
    const success = onVerifyPinAndStart(pinInput.trim());
    if (!success) {
      setPinError(true);
    } else {
      setPinError(false);
    }
  };

  const isNavigatingToPickup = trip.status === 'arriving' || trip.status === 'accepted';
  const isAtPickup = trip.status === 'arrived';
  const isInTrip = trip.status === 'in_progress';

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      {/* Turn-by-Turn Instruction Banner */}
      <div className="p-3.5 bg-black dark:bg-slate-800 text-white rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <CornerUpRight className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-bold truncate">
              {isNavigatingToPickup
                ? 'Head north towards Pickup'
                : isAtPickup
                ? 'Rider Pickup Point'
                : 'Follow route to Destination'}
            </div>
            <div className="text-xs text-slate-300">
              {isNavigatingToPickup
                ? `Arriving at ${trip.pickup.name}`
                : isAtPickup
                ? 'Waiting for rider to enter vehicle'
                : `Next turn in 400 ft on Market St`}
            </div>
          </div>
        </div>

        {/* Voice navigation toggle */}
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            setVoiceMuted(!voiceMuted);
          }}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
          title="Toggle Navigation Voice"
        >
          {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>

      {/* Speedometer & Progress Strip */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <div className="text-[10px] text-slate-500 font-semibold uppercase">Speed</div>
          <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
            {isInTrip ? '32 mph' : '26 mph'}
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <div className="text-[10px] text-slate-500 font-semibold uppercase">Limit</div>
          <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
            35 mph
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <div className="text-[10px] text-slate-500 font-semibold uppercase">Remaining</div>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
            {isNavigatingToPickup ? `${trip.driverEtaMinutes} min` : `${trip.tripEtaMinutes} min`}
          </div>
        </div>
      </div>

      {/* Simulation Speed Pill */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Simulation Navigation Speed:</span>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[1, 3, 6].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => {
                sounds.playTap();
                onSetSimSpeed(spd);
              }}
              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg transition-colors ${
                simSpeed === spd
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* STAGE 1: Navigating to Pickup -> "I have arrived" */}
      {isNavigatingToPickup && (
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onDriverArrived();
          }}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.99]"
        >
          Confirm Arrival at Pickup Spot
        </button>
      )}

      {/* STAGE 2: At Pickup -> Verify PIN and Start Trip */}
      {isAtPickup && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Verify Rider Pickup PIN</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Ask rider for their 4-digit PIN (shown in rider app: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{trip.pin}</span>)
          </p>

          <form onSubmit={handleVerify} className="flex gap-2">
            <input
              type="text"
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              placeholder="Enter PIN (e.g. 4892)"
              className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-center font-mono font-bold tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              Start Trip
            </button>
          </form>
          {pinError && <p className="text-[11px] text-red-500 font-medium">Incorrect PIN. Please re-check.</p>}
        </div>
      )}

      {/* STAGE 3: In Transit -> Complete Trip */}
      {isInTrip && (
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onCompleteTrip();
          }}
          className="w-full py-3.5 bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-[0.99]"
        >
          Complete Trip &amp; Collect Fare (${trip.totalFare.toFixed(2)})
        </button>
      )}
    </div>
  );
};
