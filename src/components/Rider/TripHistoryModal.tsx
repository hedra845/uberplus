import React from 'react';
import { X, Clock, MapPin, Navigation, Star, RotateCcw } from 'lucide-react';
import { PastTrip } from '../../types';
import { sounds } from '../../utils/sound';

interface TripHistoryModalProps {
  history: PastTrip[];
  onClose: () => void;
  onRebook: (trip: PastTrip) => void;
}

export const TripHistoryModal: React.FC<TripHistoryModalProps> = ({ history, onClose, onRebook }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Trip History</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-black dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Trips List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {history.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No previous trips yet. Request your first ride!
            </div>
          ) : (
            history.map((trip) => (
              <div
                key={trip.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-2 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">{trip.date}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">${trip.fare.toFixed(2)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                      {trip.tierName}
                    </span>
                  </div>
                </div>

                {/* Pickup & Destination */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-black dark:bg-white shrink-0" />
                    <span className="truncate">{trip.pickup}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                    <Navigation className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{trip.destination}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/50 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span>{trip.driverName}</span>
                    <span>·</span>
                    <span className="flex items-center text-amber-500 font-medium">
                      <Star className="w-3 h-3 fill-amber-400 inline mr-0.5" />
                      {trip.rating}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      onRebook(trip);
                    }}
                    className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Rebook</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
