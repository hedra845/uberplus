import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Common/Header';
import { PhoneFrame } from './components/Common/PhoneFrame';
import { UberMap } from './components/Map/UberMap';
import { DestinationSelector } from './components/Rider/DestinationSelector';
import { RideTierList } from './components/Rider/RideTierList';
import { ActiveTripSheet } from './components/Rider/ActiveTripSheet';
import { TripCompletedModal } from './components/Rider/TripCompletedModal';
import { TripHistoryModal } from './components/Rider/TripHistoryModal';
import { DriverDashboard } from './components/Driver/DriverDashboard';
import { IncomingRideModal } from './components/Driver/IncomingRideModal';
import { DriverNavigationHUD } from './components/Driver/DriverNavigationHUD';
import { FlutterCodeViewer } from './components/FlutterStudio/FlutterCodeViewer';

import {
  AppMode,
  ViewportMode,
  CityData,
  CityDestination,
  RideTier,
  ActiveTrip,
  PastTrip,
  Driver,
  LatLng,
} from './types';
import { CITIES } from './data/cities';
import { RIDE_TIERS, MOCK_DRIVERS } from './data/rideTiers';
import {
  calculateDistanceMiles,
  calculateBearing,
  generateRealisticCityRoute,
  getPositionAtProgress,
} from './utils/geo';
import { sounds } from './utils/sound';

export default function App() {
  // Theme & Settings State
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [appMode, setAppMode] = useState<AppMode>('rider');

  // Selected City & Locations
  const [selectedCity, setSelectedCity] = useState<CityData>(CITIES[0]);
  const [pickup, setPickup] = useState<CityDestination | null>(CITIES[0].pickupHotspots[0]);
  const [destination, setDestination] = useState<CityDestination | null>(CITIES[0].destinations[0]);
  const [selectedTier, setSelectedTier] = useState<RideTier>(RIDE_TIERS[0]);

  // Trip Lifecycle
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [showCompletedModal, setShowCompletedModal] = useState<boolean>(false);
  const [completedTripSnapshot, setCompletedTripSnapshot] = useState<ActiveTrip | null>(null);
  const [tripHistory, setTripHistory] = useState<PastTrip[]>([
    {
      id: 'past-1',
      date: 'Yesterday, 8:45 PM',
      pickup: 'Union Square',
      destination: 'SFO Airport Terminal 2',
      tierName: 'UberX',
      carModel: 'Toyota Camry',
      driverName: 'Marcus Vance',
      fare: 34.2,
      rating: 5,
      distance: '13.8 mi',
    },
    {
      id: 'past-2',
      date: 'Oct 28, 2:15 PM',
      pickup: 'Ferry Building',
      destination: 'Oracle Park',
      tierName: 'Comfort',
      carModel: 'Toyota RAV4',
      driverName: 'Elena Rostova',
      fare: 18.5,
      rating: 5,
      distance: '2.1 mi',
    },
  ]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Driver Mode State
  const [isDriverOnline, setIsDriverOnline] = useState<boolean>(false);
  const [driverEarnings, setDriverEarnings] = useState<number>(148.5);
  const [driverTripsCount, setDriverTripsCount] = useState<number>(6);
  const [showSurge, setShowSurge] = useState<boolean>(false);
  const [incomingRideOffer, setIncomingRideOffer] = useState<ActiveTrip | null>(null);

  // Simulation controls
  const [simSpeed, setSimSpeed] = useState<number>(3); // 3x default speed for swift testing
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Idle Drivers wandering near pickup
  const [idleDrivers, setIdleDrivers] = useState<Driver[]>([]);

  // 1. Sync Dark Mode class with HTML root
  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkTheme]);

  // 2. Generate initial idle drivers when city or pickup changes
  useEffect(() => {
    if (!pickup) return;
    const baseLat = pickup.coords.lat;
    const baseLng = pickup.coords.lng;

    const drivers: Driver[] = [
      {
        ...MOCK_DRIVERS[0],
        coords: { lat: baseLat + 0.0035, lng: baseLng - 0.0028 },
        bearing: 45,
        status: 'idle',
      },
      {
        ...MOCK_DRIVERS[1],
        coords: { lat: baseLat - 0.0042, lng: baseLng + 0.0036 },
        bearing: 135,
        status: 'idle',
      },
      {
        ...MOCK_DRIVERS[2],
        coords: { lat: baseLat + 0.0028, lng: baseLng + 0.0045 },
        bearing: 270,
        status: 'idle',
      },
    ];
    setIdleDrivers(drivers);
  }, [selectedCity, pickup]);

  // 3. Calculate distance & route between pickup and dropoff
  const routeWaypoints =
    pickup && destination
      ? generateRealisticCityRoute(pickup.coords, destination.coords, 30)
      : [];

  const distanceMiles =
    pickup && destination
      ? calculateDistanceMiles(pickup.coords, destination.coords)
      : 0;

  const durationMinutes = Math.max(4, Math.round(distanceMiles * 2.8));

  // Check if pickup is currently inside a surge zone
  const activeSurge =
    pickup &&
    selectedCity.surgeZones.find((sz) => {
      const dist = calculateDistanceMiles(pickup.coords, sz.center);
      return dist <= sz.radiusMeters / 1609.34;
    });

  // 4. Request Ride Flow Handler (Rider initiates)
  const handleRequestRide = (details: {
    tier: RideTier;
    totalFare: number;
    baseFare: number;
    discount: number;
    surgeMultiplier: number;
    preferences: { quietRide: boolean; temperature: 'normal' | 'cool' | 'warm'; luggage: boolean };
    paymentMethod: { type: 'apple_pay' | 'visa' | 'uber_cash' | 'google_pay' | 'cash'; label: string };
  }) => {
    if (!pickup || !destination) return;

    sounds.playRadarPing();

    const newTrip: ActiveTrip = {
      id: `trip_${Date.now()}`,
      riderName: 'You',
      pickup,
      destination,
      tier: details.tier,
      status: 'searching',
      distanceMiles,
      durationMinutes,
      baseFare: details.baseFare,
      surgeMultiplier: details.surgeMultiplier,
      discount: details.discount,
      totalFare: details.totalFare,
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      currentProgress: 0,
      routeWaypoints,
      driverEtaMinutes: details.tier.etaMinutes,
      tripEtaMinutes: durationMinutes,
      createdAt: Date.now(),
      preferences: details.preferences,
      paymentMethod: details.paymentMethod,
      tip: 0,
    };

    setActiveTrip(newTrip);

    // If Driver mode is currently online, send this trip as an incoming dispatch offer to the driver!
    if (isDriverOnline) {
      setIncomingRideOffer(newTrip);
    }

    // Auto match with a nearby driver after 3 seconds if driver hasn't accepted yet
    setTimeout(() => {
      setActiveTrip((curr) => {
        if (!curr || curr.status !== 'searching') return curr;
        sounds.playDriverAccepted();

        const assignedDriver: Driver = {
          ...MOCK_DRIVERS[0],
          coords: {
            lat: curr.pickup.coords.lat + 0.004,
            lng: curr.pickup.coords.lng - 0.003,
          },
          bearing: 45,
          status: 'assigned',
        };

        return {
          ...curr,
          status: 'arriving',
          driver: assignedDriver,
          currentDriverCoords: assignedDriver.coords,
          driverBearing: assignedDriver.bearing,
        };
      });
    }, 3200);
  };

  // 5. Trip Simulation Engine
  useEffect(() => {
    if (!activeTrip) return;

    // Clear previous interval
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }

    // A. Driver Arriving at Pickup
    if (activeTrip.status === 'arriving' && activeTrip.driver) {
      const pickupCoords = activeTrip.pickup.coords;
      const startDriverCoords = activeTrip.driver.coords;
      const approachWaypoints = generateRealisticCityRoute(startDriverCoords, pickupCoords, 16);

      let step = 0;
      const totalSteps = approachWaypoints.length;

      simIntervalRef.current = setInterval(() => {
        step += 1;
        const progress = Math.min(step / totalSteps, 1);
        const { position, bearing } = getPositionAtProgress(approachWaypoints, progress);

        setActiveTrip((prev) => {
          if (!prev) return null;
          const remainingMinutes = Math.max(1, Math.ceil((1 - progress) * prev.tier.etaMinutes));

          if (progress >= 1) {
            sounds.playDriverArrived();
            return {
              ...prev,
              status: 'arrived',
              currentDriverCoords: pickupCoords,
              driverBearing: bearing,
              driverEtaMinutes: 0,
            };
          }

          return {
            ...prev,
            currentDriverCoords: position,
            driverBearing: bearing,
            driverEtaMinutes: remainingMinutes,
          };
        });

        if (progress >= 1 && simIntervalRef.current) {
          clearInterval(simIntervalRef.current);
        }
      }, Math.max(120, 800 / simSpeed));
    }

    // B. In-Progress Navigation to Destination
    if (activeTrip.status === 'in_progress') {
      const waypoints = activeTrip.routeWaypoints;
      const totalSteps = Math.max(20, waypoints.length * 2);
      let step = Math.floor(activeTrip.currentProgress * totalSteps);

      simIntervalRef.current = setInterval(() => {
        step += 1;
        const progress = Math.min(step / totalSteps, 1);
        const { position, bearing } = getPositionAtProgress(waypoints, progress);

        setActiveTrip((prev) => {
          if (!prev) return null;
          const remainingMinutes = Math.max(0, Math.ceil((1 - progress) * prev.durationMinutes));

          if (progress >= 1) {
            // Reached destination!
            setCompletedTripSnapshot({ ...prev, currentProgress: 1 });
            setShowCompletedModal(true);
            return null;
          }

          return {
            ...prev,
            currentProgress: progress,
            currentDriverCoords: position,
            driverBearing: bearing,
            tripEtaMinutes: remainingMinutes,
          };
        });

        if (progress >= 1 && simIntervalRef.current) {
          clearInterval(simIntervalRef.current);
        }
      }, Math.max(100, 700 / simSpeed));
    }

    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, [activeTrip?.status, simSpeed]);

  // Handle Rider Boarding vehicle
  const handleBoardVehicle = () => {
    setActiveTrip((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'in_progress',
        currentProgress: 0.02,
      };
    });
  };

  // Handle Driver PIN Verification and Trip Start
  const handleVerifyPinAndStart = (enteredPin: string): boolean => {
    if (!activeTrip) return false;
    if (enteredPin === activeTrip.pin || enteredPin === '4892') {
      sounds.playDriverAccepted();
      handleBoardVehicle();
      return true;
    }
    return false;
  };

  // Handle Driver Manual "Arrived at Pickup"
  const handleDriverArrived = () => {
    sounds.playDriverArrived();
    setActiveTrip((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'arrived',
        currentDriverCoords: prev.pickup.coords,
      };
    });
  };

  // Complete Trip from Driver Mode
  const handleCompleteTripFromDriver = () => {
    if (!activeTrip) return;
    setDriverEarnings((prev) => prev + activeTrip.totalFare);
    setDriverTripsCount((prev) => prev + 1);
    setCompletedTripSnapshot({ ...activeTrip, currentProgress: 1 });
    setShowCompletedModal(true);
    setActiveTrip(null);
  };

  // Handle Finish Rating from Trip Completed Modal
  const handleFinishRating = (rated: { rating: number; tip: number; compliments: string[] }) => {
    if (completedTripSnapshot) {
      const pastItem: PastTrip = {
        id: completedTripSnapshot.id,
        date: 'Just now',
        pickup: completedTripSnapshot.pickup.name,
        destination: completedTripSnapshot.destination.name,
        tierName: completedTripSnapshot.tier.name,
        carModel: completedTripSnapshot.driver?.carModel || 'Toyota Camry',
        driverName: completedTripSnapshot.driver?.name || 'Marcus Vance',
        fare: completedTripSnapshot.totalFare + rated.tip,
        rating: rated.rating,
        distance: `${completedTripSnapshot.distanceMiles} mi`,
      };
      setTripHistory([pastItem, ...tripHistory]);
    }
    setShowCompletedModal(false);
    setCompletedTripSnapshot(null);
  };

  // Driver Partner accepts incoming dispatch offer
  const handleAcceptIncomingRide = () => {
    if (!incomingRideOffer) return;
    sounds.playDriverAccepted();
    const assignedDriver: Driver = {
      id: 'drv-you',
      name: 'You (Driver Partner)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      rating: 4.98,
      totalTrips: driverTripsCount + 1,
      carModel: `${incomingRideOffer.tier.name} Premier`,
      carColor: '#10b981',
      licensePlate: 'UBER123',
      phone: '+1 (555) 019-2831',
      coords: {
        lat: incomingRideOffer.pickup.coords.lat - 0.004,
        lng: incomingRideOffer.pickup.coords.lng + 0.003,
      },
      bearing: 120,
      status: 'assigned',
    };

    setActiveTrip({
      ...incomingRideOffer,
      driver: assignedDriver,
      status: 'arriving',
      currentDriverCoords: assignedDriver.coords,
      driverBearing: assignedDriver.bearing,
    });
    setIncomingRideOffer(null);
  };

  // Driver Partner declines incoming dispatch offer
  const handleDeclineIncomingRide = () => {
    setIncomingRideOffer(null);
  };

  // Driver manually simulates incoming ride offer
  const handleSimulateIncomingRide = () => {
    if (!pickup || !destination) return;
    sounds.playRadarPing();
    const mockOffer: ActiveTrip = {
      id: `trip_offer_${Date.now()}`,
      riderName: 'Sarah Jenkins',
      pickup,
      destination,
      tier: selectedTier,
      status: 'searching',
      distanceMiles,
      durationMinutes,
      baseFare: 16.5,
      surgeMultiplier: showSurge ? 1.5 : 1.0,
      discount: 0,
      totalFare: Math.round(16.5 * (showSurge ? 1.5 : 1.0) * 100) / 100,
      pin: '4892',
      currentProgress: 0,
      routeWaypoints,
      driverEtaMinutes: 3,
      tripEtaMinutes: durationMinutes,
      createdAt: Date.now(),
      preferences: { quietRide: false, temperature: 'normal', luggage: true },
      paymentMethod: { type: 'apple_pay', label: 'Apple Pay' },
      tip: 0,
    };
    setIncomingRideOffer(mockOffer);
  };

  // Active driver object for Leaflet map
  const mapActiveDriver = activeTrip?.currentDriverCoords
    ? {
        ...MOCK_DRIVERS[0],
        coords: activeTrip.currentDriverCoords,
        bearing: activeTrip.driverBearing || 0,
        status: 'on_trip' as const,
      }
    : null;

  return (
    <div className="w-full h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden select-none">
      {/* 1. Universal Top Navigation Bar */}
      <Header
        appMode={appMode}
        onSelectMode={(mode) => {
          setAppMode(mode);
          if (mode === 'driver') setShowSurge(true);
        }}
        selectedCity={selectedCity}
        onSelectCity={(city) => {
          setSelectedCity(city);
          setPickup(city.pickupHotspots[0]);
          setDestination(city.destinations[0]);
        }}
        viewportMode={viewportMode}
        onToggleViewport={() =>
          setViewportMode(viewportMode === 'mobile' ? 'desktop' : 'mobile')
        }
        isDarkTheme={isDarkTheme}
        onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
        onOpenHistory={() => setShowHistoryModal(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          sounds.setSoundEnabled(!soundEnabled);
          setSoundEnabled(!soundEnabled);
        }}
      />

      {/* 2. Main Content Viewport */}
      <main className="flex-1 w-full h-[calc(100vh-61px)] overflow-hidden relative">
        {/* FLUTTER STUDIO MODE */}
        {appMode === 'flutter_studio' ? (
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
            <FlutterCodeViewer />
          </div>
        ) : (
          /* MOBILITY SIMULATOR (RIDER / DRIVER) */
          <PhoneFrame mode={viewportMode}>
            <div className="relative w-full h-full flex flex-col overflow-hidden">
              {/* Map Layer (Full Bleed Background) */}
              <div className="absolute inset-0 z-0">
                <UberMap
                  center={selectedCity.center}
                  zoom={selectedCity.zoom}
                  pickup={pickup}
                  destination={destination}
                  routeCoordinates={routeWaypoints}
                  activeDriver={mapActiveDriver}
                  idleDrivers={idleDrivers}
                  showSurge={showSurge}
                  surgeZones={selectedCity.surgeZones}
                  isDarkTheme={isDarkTheme}
                  onSelectHotspot={(spot) => setDestination(spot)}
                />
              </div>

              {/* RIDER MODE UI OVERLAYS */}
              {appMode === 'rider' && (
                <div className="relative z-10 w-full h-full flex flex-col justify-between p-3 sm:p-4 pointer-events-none">
                  {/* Top Floating Destination / Pickup Box */}
                  {!activeTrip && (
                    <div className="pointer-events-auto max-w-lg w-full mx-auto">
                      <DestinationSelector
                        city={selectedCity}
                        pickup={pickup}
                        destination={destination}
                        onSelectPickup={(p) => setPickup(p)}
                        onSelectDestination={(d) => setDestination(d)}
                        onClearDestination={() => setDestination(null)}
                      />
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Bottom Sheet: Ride Tiers OR Active Trip Tracking */}
                  <div className="pointer-events-auto max-w-lg w-full mx-auto">
                    {!activeTrip ? (
                      destination ? (
                        <RideTierList
                          distanceMiles={distanceMiles}
                          durationMinutes={durationMinutes}
                          activeSurge={activeSurge || null}
                          selectedTier={selectedTier}
                          onSelectTier={(t) => setSelectedTier(t)}
                          onRequestRide={handleRequestRide}
                        />
                      ) : null
                    ) : (
                      <ActiveTripSheet
                        trip={activeTrip}
                        simSpeed={simSpeed}
                        onSetSimSpeed={(spd) => setSimSpeed(spd)}
                        onCancelTrip={() => {
                          sounds.playTap();
                          setActiveTrip(null);
                        }}
                        onBoardVehicle={handleBoardVehicle}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* DRIVER PARTNER MODE UI OVERLAYS */}
              {appMode === 'driver' && (
                <div className="relative z-10 w-full h-full flex flex-col justify-between p-3 sm:p-4 pointer-events-none">
                  <div className="flex-1" />

                  <div className="pointer-events-auto max-w-lg w-full mx-auto">
                    {activeTrip ? (
                      <DriverNavigationHUD
                        trip={activeTrip}
                        simSpeed={simSpeed}
                        onSetSimSpeed={(spd) => setSimSpeed(spd)}
                        onDriverArrived={handleDriverArrived}
                        onVerifyPinAndStart={handleVerifyPinAndStart}
                        onCompleteTrip={handleCompleteTripFromDriver}
                      />
                    ) : (
                      <DriverDashboard
                        isOnline={isDriverOnline}
                        onToggleOnline={() => setIsDriverOnline(!isDriverOnline)}
                        showSurge={showSurge}
                        onToggleSurge={() => setShowSurge(!showSurge)}
                        todayEarnings={driverEarnings}
                        tripsCount={driverTripsCount}
                        onSimulateIncomingRide={handleSimulateIncomingRide}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </PhoneFrame>
        )}
      </main>

      {/* 3. Incoming Dispatch Modal for Driver */}
      {incomingRideOffer && (
        <IncomingRideModal
          trip={incomingRideOffer}
          onAccept={handleAcceptIncomingRide}
          onDecline={handleDeclineIncomingRide}
        />
      )}

      {/* 4. Trip Completed Receipt & Rating Modal */}
      {showCompletedModal && completedTripSnapshot && (
        <TripCompletedModal
          trip={completedTripSnapshot}
          onFinish={handleFinishRating}
        />
      )}

      {/* 5. Past Trips History Modal */}
      {showHistoryModal && (
        <TripHistoryModal
          history={tripHistory}
          onClose={() => setShowHistoryModal(false)}
          onRebook={(past) => {
            setShowHistoryModal(false);
            setAppMode('rider');
            const foundDest = selectedCity.destinations.find((d) => d.name === past.destination);
            if (foundDest) setDestination(foundDest);
          }}
        />
      )}
    </div>
  );
}
