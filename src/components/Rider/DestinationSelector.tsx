import React, { useState } from 'react';
import { Search, MapPin, Navigation, Clock, Building, Plane, Landmark, Hotel, ChevronRight } from 'lucide-react';
import { CityData, CityDestination } from '../../types';
import { sounds } from '../../utils/sound';

interface DestinationSelectorProps {
  city: CityData;
  pickup: CityDestination | null;
  destination: CityDestination | null;
  onSelectPickup: (dest: CityDestination) => void;
  onSelectDestination: (dest: CityDestination) => void;
  onClearDestination: () => void;
}

export const DestinationSelector: React.FC<DestinationSelectorProps> = ({
  city,
  pickup,
  destination,
  onSelectPickup,
  onSelectDestination,
  onClearDestination,
}) => {
  const [isEditingPickup, setIsEditingPickup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const allDestinations = [...city.pickupHotspots, ...city.destinations];

  const filtered = searchQuery.trim() === ''
    ? allDestinations
    : allDestinations.filter(
        (d) =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.address.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'airport':
        return <Plane className="w-4 h-4 text-sky-500" />;
      case 'landmark':
        return <Landmark className="w-4 h-4 text-amber-500" />;
      case 'hotel':
        return <Hotel className="w-4 h-4 text-purple-500" />;
      case 'transit':
        return <Building className="w-4 h-4 text-emerald-500" />;
      default:
        return <MapPin className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-4 transition-all">
      {/* Pickup & Destination Inputs */}
      <div className="space-y-3 relative">
        {/* Connecting Line between pickup and dropoff */}
        <div className="absolute left-[17px] top-[28px] bottom-[28px] w-0.5 bg-slate-300 dark:bg-slate-700 pointer-events-none" />

        {/* Pickup Row */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 z-10">
            <div className="w-2.5 h-2.5 rounded-full bg-black dark:bg-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pickup Location</span>
              <button
                type="button"
                onClick={() => {
                  sounds.playTap();
                  setIsEditingPickup(!isEditingPickup);
                }}
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-medium"
              >
                {isEditingPickup ? 'Done' : 'Change'}
              </button>
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {pickup ? pickup.name : 'Select pickup point'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {pickup?.address || 'Current GPS position'}
            </div>
          </div>
        </div>

        {/* Dropdown for Pickup Change */}
        {isEditingPickup && (
          <div className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-2 py-1">Popular Pickup Spots:</div>
            {city.pickupHotspots.map((hotspot) => (
              <button
                key={hotspot.id}
                type="button"
                onClick={() => {
                  sounds.playTap();
                  onSelectPickup(hotspot);
                  setIsEditingPickup(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                  pickup?.id === hotspot.id
                    ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                    : 'hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{hotspot.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 dark:border-slate-800/60" />

        {/* Destination Row */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center shrink-0 z-10 text-emerald-600 dark:text-emerald-400">
            <Navigation className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Where to?</span>
            {destination ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{destination.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{destination.address}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playTap();
                    onClearDestination();
                    setIsExpanded(true);
                  }}
                  className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-medium shrink-0 transition-colors"
                >
                  Edit
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="w-full text-left py-1 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-between"
              >
                <span>Search destination in {city.name}...</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Destination Autocomplete Drawer / Suggestions */}
      {(!destination || isExpanded) && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search landmarks, airports, hotels in ${city.name}...`}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white border border-transparent"
            />
          </div>

          {/* Quick Destination Suggestions */}
          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {filtered.map((dest) => (
              <button
                key={dest.id}
                type="button"
                onClick={() => {
                  sounds.playTap();
                  onSelectDestination(dest);
                  setIsExpanded(false);
                  setSearchQuery('');
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700">
                  {getCategoryIcon(dest.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {dest.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {dest.address}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
