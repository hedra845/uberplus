import React, { useState } from 'react';
import {
  Phone,
  MessageSquare,
  Shield,
  Share2,
  AlertTriangle,
  X,
  Send,
  Navigation,
  Compass,
} from 'lucide-react';
import { ActiveTrip } from '../../types';
import { sounds } from '../../utils/sound';

interface ActiveTripSheetProps {
  trip: ActiveTrip;
  simSpeed: number;
  onSetSimSpeed: (speed: number) => void;
  onCancelTrip: () => void;
  onBoardVehicle: () => void;
}

export const ActiveTripSheet: React.FC<ActiveTripSheetProps> = ({
  trip,
  simSpeed,
  onSetSimSpeed,
  onCancelTrip,
  onBoardVehicle,
}) => {
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'rider' | 'driver'; text: string; time: string }>>([
    { sender: 'driver', text: "Hello! I'm on my way to your pickup location.", time: 'Just now' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sounds.playTap();
    const newMsg = { sender: 'rider' as const, text: chatInput.trim(), time: 'Just now' };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    // Simulated driver auto-response after 1.5s
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'driver', text: 'Got it, thanks! Arriving shortly.', time: 'Just now' },
      ]);
    }, 1500);
  };

  const handleShareTrip = () => {
    sounds.playTap();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`Track my Uber trip to ${trip.destination.name}: https://uber.com/track/${trip.id}`);
    }
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2500);
  };

  // 1. Searching State View
  if (trip.status === 'searching') {
    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in fade-in duration-300">
        <div className="flex flex-col items-center justify-center py-4 space-y-3">
          <div className="relative flex items-center justify-center">
            {/* Pulsing sonar rings */}
            <div className="w-20 h-20 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg">
                <Navigation className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <div className="absolute w-28 h-28 rounded-full border-2 border-black/20 dark:border-white/20 radar-ring pointer-events-none" />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Connecting to nearby drivers...</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Confirming best vehicle match for {trip.tier.name}
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl flex items-center justify-between border border-slate-200/60 dark:border-slate-700/60">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Pickup Location</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
              {trip.pickup.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">Estimated Fare</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
              ${trip.totalFare.toFixed(2)}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onCancelTrip();
          }}
          className="w-full py-3 rounded-xl bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-700 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 text-xs font-semibold transition-colors"
        >
          Cancel Ride Request
        </button>
      </div>
    );
  }

  // 2. Driver Matched / Arriving / In Transit View
  const driver = trip.driver;

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      {/* Top Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {trip.status === 'arriving' || trip.status === 'accepted'
                ? `Driver arriving in ${trip.driverEtaMinutes} min`
                : trip.status === 'arrived'
                ? 'Driver has arrived!'
                : `Heading to ${trip.destination.name}`}
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {trip.status === 'in_progress' ? `ETA: ${trip.tripEtaMinutes} min remaining` : `${driver?.carModel}`}
          </h2>
        </div>

        {/* Speed Multiplier Pill for simulation preview */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[1, 3, 6].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => {
                sounds.playTap();
                onSetSimSpeed(spd);
              }}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-colors ${
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

      {/* Progress Bar for Trip */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.round(trip.currentProgress * 100)}%` }}
        />
      </div>

      {/* Safety PIN Banner (Required by Uber safety protocol) */}
      {(trip.status === 'arriving' || trip.status === 'arrived') && (
        <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200">Safety PIN Verification</div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300">
                Share this PIN with driver before entering
              </div>
            </div>
          </div>
          <div className="text-lg font-mono font-extrabold tracking-widest px-3 py-1 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 rounded-lg shadow-sm border border-amber-200 dark:border-amber-700">
            {trip.pin}
          </div>
        </div>
      )}

      {/* If driver has arrived, provide rider "Board Vehicle" button */}
      {trip.status === 'arrived' && (
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onBoardVehicle();
          }}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.99]"
        >
          I am in the car · Start Trip
        </button>
      )}

      {/* Driver & Vehicle Information Card */}
      {driver && (
        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={driver.avatar}
                alt={driver.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-black/10 dark:ring-white/10"
              />
              <div className="absolute -bottom-1 -right-1 bg-black text-white text-[9px] font-bold px-1 rounded-full">
                ★ {driver.rating}
              </div>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                {driver.name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {driver.carModel} · <span className="font-mono font-semibold">{driver.licensePlate}</span>
              </div>
              <div className="text-[10px] text-slate-400">{driver.totalTrips.toLocaleString()} trips completed</div>
            </div>
          </div>

          {/* Action Buttons: Message / Call */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playTap();
                setShowChat(true);
              }}
              className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors relative"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <a
              href={`tel:${driver.phone}`}
              onClick={() => sounds.playTap()}
              className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Safety & Action Quick Strip */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={handleShareTrip}
          className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-1"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{shareSuccess ? 'Link copied!' : 'Share trip status'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowSosModal(true)}
          className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:underline py-1"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Safety &amp; 911 Assistance</span>
        </button>
      </div>

      {/* In-Trip Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                  {driver?.name[0]}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{driver?.name}</div>
                  <div className="text-[11px] text-emerald-600">Online · In Transit</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChat(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-black dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Canned Responses */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {["I'm at the entrance", 'Be there in 1 min', 'Wearing black jacket'].map((canned) => (
                <button
                  key={canned}
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    setChatMessages((prev) => [
                      ...prev,
                      { sender: 'rider', text: canned, time: 'Just now' },
                    ]);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full whitespace-nowrap"
                >
                  {canned}
                </button>
              ))}
            </div>

            {/* Message History */}
            <div className="h-48 overflow-y-auto space-y-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === 'rider' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${
                      msg.sender === 'rider'
                        ? 'bg-black text-white dark:bg-white dark:text-black rounded-tr-none'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 px-1 mt-0.5">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message driver..."
                className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black"
              />
              <button
                type="submit"
                className="w-8 h-8 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SOS Safety Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Emergency Safety Toolkit</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your current GPS location is being streamed: {trip.pickup.name} to {trip.destination.name}.
              </p>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  alert('Dialing Emergency 911 Services with automated trip coordinates...');
                  setShowSosModal(false);
                }}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Call 911 Emergency Services
              </button>
              <button
                type="button"
                onClick={() => setShowSosModal(false)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
