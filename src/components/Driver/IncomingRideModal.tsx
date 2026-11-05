import React, { useEffect, useState } from 'react';
import { Navigation, MapPin, Check, X, ShieldAlert, Star } from 'lucide-react';
import { ActiveTrip } from '../../types';
import { sounds } from '../../utils/sound';

interface IncomingRideModalProps {
  trip: ActiveTrip;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingRideModal: React.FC<IncomingRideModalProps> = ({
  trip,
  onAccept,
  onDecline,
}) => {
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    sounds.playDriverAccepted();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDecline]);

  const percentage = (timeLeft / 15) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-emerald-500 p-6 space-y-4">
        {/* Countdown Ring & Offer Title */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              New Trip Dispatch
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {trip.tier.name}
            </h3>
          </div>

          {/* Circular Countdown Progress */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-200 dark:text-slate-800"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                className="text-emerald-500 transition-all duration-1000"
                fill="none"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 - (125.6 * percentage) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs font-bold text-slate-900 dark:text-white tabular-nums">
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Estimated Earnings Card */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center">
          <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">Estimated Net Fare</div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            ${trip.totalFare.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
            {trip.distanceMiles} miles · ~{trip.durationMinutes} mins total
          </div>
        </div>

        {/* Pickup & Destination Details */}
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-black dark:bg-white mt-1 shrink-0" />
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">{trip.pickup.name}</div>
              <div className="text-[11px] text-slate-500">{trip.pickup.address}</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Navigation className="w-3 h-3 text-emerald-500 mt-1 shrink-0" />
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">{trip.destination.name}</div>
              <div className="text-[11px] text-slate-500">{trip.destination.address}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Accept / Decline */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              onDecline();
            }}
            className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Decline</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playDriverAccepted();
              onAccept();
            }}
            className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Accept Trip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
