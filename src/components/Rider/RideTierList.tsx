import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  CreditCard,
  Tag,
  ChevronDown,
  Sparkles,
  Zap,
  Leaf,
  Sliders,
  Check,
} from 'lucide-react';
import { RideTier, SurgeZone } from '../../types';
import { RIDE_TIERS } from '../../data/rideTiers';
import { sounds } from '../../utils/sound';

interface RideTierListProps {
  distanceMiles: number;
  durationMinutes: number;
  activeSurge: SurgeZone | null;
  selectedTier: RideTier;
  onSelectTier: (tier: RideTier) => void;
  onRequestRide: (details: {
    tier: RideTier;
    totalFare: number;
    baseFare: number;
    discount: number;
    surgeMultiplier: number;
    preferences: { quietRide: boolean; temperature: 'normal' | 'cool' | 'warm'; luggage: boolean };
    paymentMethod: { type: 'apple_pay' | 'visa' | 'uber_cash' | 'google_pay' | 'cash'; label: string };
  }) => void;
}

export const RideTierList: React.FC<RideTierListProps> = ({
  distanceMiles,
  durationMinutes,
  activeSurge,
  selectedTier,
  onSelectTier,
  onRequestRide,
}) => {
  const [showPreferences, setShowPreferences] = useState(false);
  const [quietRide, setQuietRide] = useState(false);
  const [temperature, setTemperature] = useState<'normal' | 'cool' | 'warm'>('normal');
  const [luggage, setLuggage] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<{
    type: 'apple_pay' | 'visa' | 'uber_cash' | 'google_pay' | 'cash';
    label: string;
  }>({
    type: 'apple_pay',
    label: 'Apple Pay',
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(null);
  const [promoError, setPromoError] = useState('');

  const surgeMultiplier = activeSurge ? activeSurge.multiplier : 1.0;

  const calculateFare = (tier: RideTier): { subtotal: number; finalFare: number; discountAmt: number } => {
    const raw = tier.basePrice + tier.perMileRate * distanceMiles + tier.perMinuteRate * durationMinutes;
    const withSurge = raw * surgeMultiplier;
    const discountAmt = appliedPromo ? withSurge * (appliedPromo.discountPercent / 100) : 0;
    const finalFare = Math.max(tier.basePrice, withSurge - discountAmt);
    return {
      subtotal: Math.round(withSurge * 100) / 100,
      finalFare: Math.round(finalFare * 100) / 100,
      discountAmt: Math.round(discountAmt * 100) / 100,
    };
  };

  const currentFareData = calculateFare(selectedTier);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playTap();
    const clean = promoCode.trim().toUpperCase();
    if (clean === 'RIDE50') {
      setAppliedPromo({ code: 'RIDE50', discountPercent: 50 });
      setPromoError('');
    } else if (clean === 'UBER20' || clean === 'FIRST') {
      setAppliedPromo({ code: clean, discountPercent: 20 });
      setPromoError('');
    } else {
      setPromoError('Invalid code. Try "RIDE50" for 50% off');
    }
  };

  const handleConfirm = () => {
    sounds.playTap();
    onRequestRide({
      tier: selectedTier,
      totalFare: currentFareData.finalFare,
      baseFare: currentFareData.subtotal,
      discount: currentFareData.discountAmt,
      surgeMultiplier,
      preferences: { quietRide, temperature, luggage },
      paymentMethod,
    });
  };

  const getTierIcon = (id: string) => {
    switch (id) {
      case 'uber_green':
        return <Leaf className="w-5 h-5 text-emerald-500" />;
      case 'uber_black':
        return <ShieldCheck className="w-5 h-5 text-amber-400" />;
      case 'comfort':
        return <Sparkles className="w-5 h-5 text-sky-400" />;
      case 'uberxl':
        return <Users className="w-5 h-5 text-indigo-400" />;
      default:
        return <Zap className="w-5 h-5 text-slate-700 dark:text-slate-300" />;
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-4">
      {/* Header with Distance & Estimated Duration */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Choose a ride</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{distanceMiles} miles</span>
            <span>·</span>
            <span>~{durationMinutes} min trip</span>
          </div>
        </div>

        {activeSurge && (
          <div className="text-right">
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
              {activeSurge.multiplier}x Surge Pricing
            </span>
            <div className="text-[10px] text-slate-500">High demand in area</div>
          </div>
        )}
      </div>

      {/* Ride Tiers List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {RIDE_TIERS.map((tier) => {
          const isSelected = selectedTier.id === tier.id;
          const fare = calculateFare(tier);

          return (
            <div
              key={tier.id}
              onClick={() => {
                sounds.playTap();
                onSelectTier(tier);
              }}
              className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-slate-100/90 dark:bg-slate-800 border-black dark:border-white shadow-sm ring-1 ring-black/5'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200/60 dark:border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {getTierIcon(tier.id)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{tier.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                      <Users className="w-3 h-3 inline" /> {tier.capacity}
                    </span>
                    {tier.badge && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        {tier.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {tier.etaMinutes} min away · {tier.description}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                  ${fare.finalFare.toFixed(2)}
                </div>
                {appliedPromo && (
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 line-through tabular-nums">
                    ${fare.subtotal.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ride Preferences (Comfort, Quiet, Luggage) Toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            setShowPreferences(!showPreferences);
          }}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-1"
        >
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            <span>Ride Preferences &amp; Luggage</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showPreferences ? 'rotate-180' : ''}`}
          />
        </button>

        {showPreferences && (
          <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl space-y-2.5 border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Quiet ride preference</span>
              <button
                type="button"
                onClick={() => setQuietRide(!quietRide)}
                className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
                  quietRide ? 'bg-black dark:bg-white' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div
                  className={`bg-white dark:bg-black w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                    quietRide ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Cabin temperature</span>
              <div className="flex items-center gap-1">
                {(['cool', 'normal', 'warm'] as const).map((temp) => (
                  <button
                    key={temp}
                    type="button"
                    onClick={() => setTemperature(temp)}
                    className={`px-2 py-0.5 rounded capitalize ${
                      temperature === temp
                        ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {temp}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Traveling with luggage</span>
              <button
                type="button"
                onClick={() => setLuggage(!luggage)}
                className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
                  luggage ? 'bg-black dark:bg-white' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div
                  className={`bg-white dark:bg-black w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                    luggage ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Method & Promo Code Bar */}
      <div className="flex items-center justify-between text-xs pt-1">
        <button
          type="button"
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition-colors"
        >
          <CreditCard className="w-3.5 h-3.5 text-slate-500" />
          <span>{paymentMethod.label}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {appliedPromo ? (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <Tag className="w-3 h-3" />
            <span>{appliedPromo.code} (-{appliedPromo.discountPercent}%)</span>
            <button
              type="button"
              onClick={() => setAppliedPromo(null)}
              className="text-slate-400 hover:text-red-500 ml-1"
            >
              ×
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyPromo} className="flex items-center gap-1">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Promo (RIDE50)"
              className="w-24 px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white uppercase placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              type="submit"
              className="px-2 py-1 text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg"
            >
              Apply
            </button>
          </form>
        )}
      </div>
      {promoError && <p className="text-[11px] text-red-500">{promoError}</p>}

      {/* Payment Selection Modal */}
      {showPaymentModal && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
          <div className="text-xs font-bold text-slate-900 dark:text-white">Select Payment Method</div>
          {[
            { type: 'apple_pay', label: 'Apple Pay' },
            { type: 'visa', label: 'Visa •••• 4242' },
            { type: 'uber_cash', label: 'Uber Cash ($45.00)' },
            { type: 'google_pay', label: 'Google Pay' },
            { type: 'cash', label: 'Cash on drop-off' },
          ].map((pm) => (
            <button
              key={pm.type}
              type="button"
              onClick={() => {
                sounds.playTap();
                setPaymentMethod(pm as unknown as { type: 'apple_pay' | 'visa' | 'uber_cash' | 'google_pay' | 'cash'; label: string });
                setShowPaymentModal(false);
              }}
              className="w-full flex items-center justify-between p-2 rounded-lg text-xs hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
            >
              <span>{pm.label}</span>
              {paymentMethod.type === pm.type && <Check className="w-3.5 h-3.5 text-emerald-500" />}
            </button>
          ))}
        </div>
      )}

      {/* Big Tactile Request CTA Button */}
      <button
        type="button"
        onClick={handleConfirm}
        className="w-full h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm sm:text-base flex items-center justify-between px-5 shadow-lg shadow-black/10 hover:opacity-95 active:scale-[0.99] transition-all"
      >
        <span>Request {selectedTier.name}</span>
        <span className="tabular-nums">${currentFareData.finalFare.toFixed(2)}</span>
      </button>
    </div>
  );
};
