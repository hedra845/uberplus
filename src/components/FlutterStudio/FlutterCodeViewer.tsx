import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  FileCode,
  FolderTree,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  BookOpen,
  Layers,
  Cpu,
} from 'lucide-react';
import { FLUTTER_PROJECT_FILES, FlutterFile } from '../../data/flutterCode';
import { sounds } from '../../utils/sound';

export const FlutterCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FlutterFile>(FLUTTER_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'architecture' | 'setup_guide'>('code');

  const handleCopy = () => {
    sounds.playTap();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(selectedFile.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadZip = async () => {
    sounds.playTap();
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add all project files into zip structure
      FLUTTER_PROJECT_FILES.forEach((f) => {
        zip.file(f.path, f.code);
      });

      // Add a helpful README.md
      zip.file(
        'README.md',
        `# Uber Clone in Flutter & BLoC
Production-ready Flutter starter architecture for on-demand ride hailing.

## Features
- Google Maps SDK & interactive route polyline rendering
- BLoC (Business Logic Component) state machine
- Background GPS tracking & location stream
- Rider booking & Driver Partner HUD screens
- Android & iOS location permissions configuration

## Getting Started
1. Run \`flutter pub get\` to install dependencies
2. Add your Google Maps API Key to:
   - \`android/app/src/main/AndroidManifest.xml\`
   - \`ios/Runner/AppDelegate.swift\`
3. Run on your simulator or device:
   \`flutter run\`
`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'uber_clone_flutter_project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 animate-in fade-in">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
              Flutter 3.x + Dart
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              BLoC Pattern
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Flutter Codebase &amp; Architecture Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Complete, runnable Flutter code modules with Google Maps, Geolocator, and real-time state machine.
          </p>
        </div>

        {/* Action Button: Download ZIP */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs sm:text-sm shadow-xl hover:opacity-90 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isZipping ? 'Packaging Project...' : 'Download Full Flutter Project (.ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'code'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Source Code Files</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'architecture'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>System Architecture &amp; State Machine</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('setup_guide')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'setup_guide'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Setup &amp; Deployment Guide</span>
        </button>
      </div>

      {/* TAB 1: CODE EXPLORER */}
      {activeTab === 'code' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* File Tree Explorer (3 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
              <FolderTree className="w-4 h-4" />
              <span>Project Structure</span>
            </div>

            <div className="space-y-1">
              {FLUTTER_PROJECT_FILES.map((file) => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      setSelectedFile(file);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                      isSelected
                        ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-sm'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileCode className="w-4 h-4 shrink-0 text-sky-400" />
                      <span className="text-xs font-mono truncate">{file.name}</span>
                    </div>
                    <span className="text-[10px] uppercase opacity-60 ml-2">{file.language}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Viewer (8 cols) */}
          <div className="lg:col-span-8 bg-slate-950 text-slate-100 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
            {/* Code Header Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-800">
              <div>
                <div className="text-xs font-mono font-bold text-white">{selectedFile.path}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{selectedFile.description}</div>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* Code Content */}
            <div className="p-4 overflow-x-auto max-h-[580px] overflow-y-auto font-mono text-xs leading-relaxed text-slate-300 select-text">
              <pre>
                <code>{selectedFile.code}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ARCHITECTURE SPECIFICATION */}
      {activeTab === 'architecture' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Uber Flutter Architecture &amp; Real-Time Data Pipeline
            </h3>
            <p className="text-xs text-slate-500">
              High-throughput reactive design separating UI presentation, BLoC state machines, and streaming location feeds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase">1. Presentation Layer</div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Google Maps &amp; Sheets</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Flutter views use \`GoogleMap\` widget with custom Bitmaps for vehicle rotation and animated polylines decoded using \`flutter_polyline_points\`.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">2. State Layer (BLoC)</div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Ride State Machine</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Guarantees immutable state transitions: Initial → Searching → Matched → En Route → On Trip → Completed with error boundaries.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">3. Real-Time Sync</div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">WebSocket / Firestore</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Drivers stream lat/lng and heading bearing every 2 seconds. Linear interpolation (\`Tween\`) prevents jumping on the rider map.
              </p>
            </div>
          </div>

          {/* Firestore Schema Snippet */}
          <div className="p-4 bg-slate-950 text-slate-200 rounded-2xl font-mono text-xs space-y-2">
            <div className="text-slate-400 text-[11px]">{`// Firestore /rides/{rideId} Document Schema`}</div>
            <pre className="text-emerald-400">
{`{
  "rideId": "rd_98412",
  "riderId": "usr_441",
  "driverId": "drv_882",
  "status": "IN_TRANSIT", // SEARCHING | ACCEPTED | ARRIVED | IN_TRANSIT | COMPLETED
  "pickup": { "lat": 37.7879, "lng": -122.4075, "address": "Union Square" },
  "destination": { "lat": 37.6213, "lng": -122.3790, "address": "SFO Airport" },
  "driverLocation": { "lat": 37.7850, "lng": -122.4050, "bearing": 42.0 },
  "safetyPin": "4892",
  "tier": "uberx",
  "fare": 32.50,
  "createdAt": 1729012384
}`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: SETUP GUIDE */}
      {activeTab === 'setup_guide' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            How to Run in Flutter &amp; Android Studio / VS Code
          </h3>

          <ol className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 list-decimal list-inside">
            <li className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <strong>Download the Project ZIP:</strong> Click the "Download Full Flutter Project (.ZIP)" button above and extract it into your workspace folder.
            </li>
            <li className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <strong>Fetch Dependencies:</strong> In terminal, navigate to the folder and run:
              <code className="block mt-1 font-mono p-2 bg-slate-950 text-emerald-400 rounded-lg">
                flutter pub get
              </code>
            </li>
            <li className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <strong>Configure Google Maps API Key:</strong> In Google Cloud Console, enable "Maps SDK for Android", "Maps SDK for iOS", and "Directions API". Add your key to <code className="font-mono text-sky-500">AndroidManifest.xml</code> and <code className="font-mono text-sky-500">AppDelegate.swift</code>.
            </li>
            <li className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <strong>Launch Simulator:</strong> Run the application on iOS Simulator or Android Emulator:
              <code className="block mt-1 font-mono p-2 bg-slate-950 text-emerald-400 rounded-lg">
                flutter run
              </code>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};
