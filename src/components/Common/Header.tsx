import React from 'react';
import { AppMode, ViewportMode, CityData } from '../../types';
import { CITIES } from '../../data/cities';
import { sounds } from '../../utils/sound';
import { Moon, Sun, Smartphone, Monitor, Volume2, VolumeX, History, MapPin } from 'lucide-react';

interface HeaderProps {
  appMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  selectedCity: CityData;
  onSelectCity: (city: CityData) => void;
  viewportMode: ViewportMode;
  onToggleViewport: () => void;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  onOpenHistory: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appMode,
  onSelectMode,
  selectedCity,
  onSelectCity,
  viewportMode,
  onToggleViewport,
  isDarkTheme,
  onToggleTheme,
  onOpenHistory,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="flex items-center justify-between gap-6 px-4 sm:px-8 py-3.5 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-30 shrink-0">
      {/* Zone 1: Single Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/"
          className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          Uber<span className="text-emerald-500">Pulse</span>
        </a>

        {/* City Switcher Dropdown */}
        <div className="relative hidden sm:flex items-center">
          <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
          <select
            value={selectedCity.id}
            onChange={(e) => {
              sounds.playTap();
              const found = CITIES.find((c) => c.id === e.target.value);
              if (found) onSelectCity(found);
            }}
            aria-label="Select City"
            className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-1 px-2.5 rounded-lg border-none focus:ring-1 focus:ring-black cursor-pointer"
          >
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Zone 2: 4-5 Clean Single-Line Navigation Links */}
      <nav className="flex items-center gap-2 sm:gap-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onSelectMode('rider');
          }}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-colors ${
            appMode === 'rider'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Rider Mode
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onSelectMode('driver');
          }}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-colors ${
            appMode === 'driver'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Driver Partner
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onSelectMode('flutter_studio');
          }}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-colors ${
            appMode === 'flutter_studio'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Flutter Studio
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onOpenHistory();
          }}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          <span>Trip History</span>
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action Area (Viewport & Theme toggles) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Sound FX Toggle */}
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onToggleSound();
          }}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Viewport Mode: Phone Frame vs Full Desktop */}
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onToggleViewport();
          }}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors hidden sm:flex items-center gap-1 text-xs font-semibold"
          title="Toggle Mobile Phone vs Desktop Layout"
        >
          {viewportMode === 'mobile' ? (
            <>
              <Monitor className="w-4 h-4" />
              <span className="hidden lg:inline">Desktop</span>
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4" />
              <span className="hidden lg:inline">Mobile Frame</span>
            </>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            onToggleTheme();
          }}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          title="Toggle Dark / Light Theme"
        >
          {isDarkTheme ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </div>
    </header>
  );
};
