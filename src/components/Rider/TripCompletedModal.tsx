import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, CheckCircle, ShieldCheck, Heart } from 'lucide-react';
import { ActiveTrip } from '../../types';
import { sounds } from '../../utils/sound';

interface TripCompletedModalProps {
  trip: ActiveTrip;
  onFinish: (ratedTrip: { rating: number; tip: number; compliments: string[] }) => void;
}

export const TripCompletedModal: React.FC<TripCompletedModalProps> = ({ trip, onFinish }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTip, setSelectedTip] = useState<number>(3);
  const [customTip, setCustomTip] = useState('');
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>(['Smooth driving', 'Clean car']);

  useEffect(() => {
    sounds.playCompleted();
    // Confetti celebration
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.65 },
    });
  }, []);

  const complimentOptions = [
    'Smooth driving',
    'Clean car',
    'Great music',
    'Friendly conversation',
    'Expert navigation',
    'Comfortable ride',
  ];

  const toggleCompliment = (comp: string) => {
    sounds.playTap();
    if (selectedCompliments.includes(comp)) {
      setSelectedCompliments(selectedCompliments.filter((c) => c !== comp));
    } else {
      setSelectedCompliments([...selectedCompliments, comp]);
    }
  };

  const finalTipAmount = customTip ? parseFloat(customTip) || 0 : selectedTip;
  const finalTotalCharge = trip.totalFare + finalTipAmount;

  const handleSubmit = () => {
    sounds.playTap();
    onFinish({
      rating,
      tip: finalTipAmount,
      compliments: selectedCompliments,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">You have arrived!</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dropped off at {trip.destination.name}
          </p>
        </div>

        {/* Fare Receipt Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Base Fare &amp; Distance ({trip.distanceMiles} mi)</span>
            <span className="tabular-nums">${trip.baseFare.toFixed(2)}</span>
          </div>

          {trip.surgeMultiplier > 1 && (
            <div className="flex items-center justify-between text-xs text-red-500 font-medium">
              <span>High Demand Surge ({trip.surgeMultiplier}x)</span>
              <span>Included</span>
            </div>
          )}

          {trip.discount > 0 && (
            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Promotion Discount</span>
              <span className="tabular-nums">-${trip.discount.toFixed(2)}</span>
            </div>
          )}

          {finalTipAmount > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
              <span>Driver Tip</span>
              <span className="tabular-nums">+${finalTipAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Total Charged</span>
              <div className="text-[11px] text-slate-400">Paid via {trip.paymentMethod.label}</div>
            </div>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
              ${finalTotalCharge.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Rate Driver Section */}
        {trip.driver && (
          <div className="text-center space-y-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              How was your trip with {trip.driver.name}?
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => {
                    sounds.playTap();
                    setRating(star);
                  }}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Compliment Badges */}
            <div className="flex flex-wrap gap-1.5 justify-center pt-1">
              {complimentOptions.map((comp) => {
                const isSelected = selectedCompliments.includes(comp);
                return (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => toggleCompliment(comp)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                      isSelected
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {comp}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Add a Tip Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Add a tip for the driver</span>
            <span className="text-[11px] text-emerald-600 flex items-center gap-1">
              <Heart className="w-3 h-3 fill-emerald-500 text-emerald-500" /> 100% goes to driver
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 3, 5].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setSelectedTip(amt);
                  setCustomTip('');
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedTip === amt && !customTip
                    ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/50 hover:bg-slate-200'
                }`}
              >
                {amt === 0 ? 'No tip' : `$${amt}`}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm shadow-xl hover:opacity-95 active:scale-[0.99] transition-all"
        >
          Done &amp; Book Another Ride
        </button>
      </div>
    </div>
  );
};
