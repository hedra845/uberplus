import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LatLng, CityDestination, Driver, SurgeZone } from '../../types';

interface UberMapProps {
  center: LatLng;
  zoom: number;
  pickup?: CityDestination | null;
  destination?: CityDestination | null;
  routeCoordinates?: LatLng[];
  activeDriver?: Driver | null;
  idleDrivers?: Driver[];
  showSurge?: boolean;
  surgeZones?: SurgeZone[];
  isDarkTheme?: boolean;
  onMapClick?: (coords: LatLng) => void;
  onSelectHotspot?: (hotspot: CityDestination) => void;
}

export const UberMap: React.FC<UberMapProps> = ({
  center,
  zoom,
  pickup,
  destination,
  routeCoordinates,
  activeDriver,
  idleDrivers = [],
  showSurge = false,
  surgeZones = [],
  isDarkTheme = true,
  onMapClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer groups for clean updates without flickering
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const activeDriverMarkerRef = useRef<L.Marker | null>(null);
  const idleDriverMarkersRef = useRef<L.Marker[]>([]);
  const surgeLayersRef = useRef<L.Circle[]>([]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: true,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    // Invalidate size on resize or transition
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Handle theme switch (Dark Matter vs Positron)
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const tileUrl = isDarkTheme
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png';

    const layer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    });

    layer.addTo(mapRef.current);
    tileLayerRef.current = layer;
  }, [isDarkTheme]);

  // 3. Update Map Center when city changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([center.lat, center.lng], zoom, { animate: true });
  }, [center.lat, center.lng, zoom]);

  // 4. Render Surge Zones
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old surge circles
    surgeLayersRef.current.forEach((circle) => circle.remove());
    surgeLayersRef.current = [];

    if (showSurge && surgeZones.length > 0) {
      surgeZones.forEach((sz) => {
        const circle = L.circle([sz.center.lat, sz.center.lng], {
          radius: sz.radiusMeters,
          color: '#ef4444',
          weight: 1.5,
          fillColor: '#ef4444',
          fillOpacity: 0.18,
          dashArray: '4, 6',
        }).addTo(mapRef.current!);

        circle.bindTooltip(
          `<div class="font-bold text-xs text-red-600 bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-md border border-red-200">${sz.name} · ${sz.multiplier}x Surge</div>`,
          { permanent: true, direction: 'center', className: 'surge-tooltip' }
        );

        surgeLayersRef.current.push(circle);
      });
    }
  }, [showSurge, surgeZones]);

  // 5. Update Pickup & Destination Markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Pickup Marker
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }

    if (pickup) {
      const pickupIcon = L.divIcon({
        className: 'custom-pickup-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-7 h-7 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xl ring-4 ring-black/20 dark:ring-white/30 transition-transform">
              <div class="w-2.5 h-2.5 bg-white dark:bg-black rounded-sm"></div>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      pickupMarkerRef.current = L.marker([pickup.coords.lat, pickup.coords.lng], {
        icon: pickupIcon,
        zIndexOffset: 100,
      }).addTo(mapRef.current);
    }

    // Destination Marker
    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }

    if (destination) {
      const destIcon = L.divIcon({
        className: 'custom-dest-pin',
        html: `
          <div class="relative flex flex-col items-center">
            <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xl ring-4 ring-emerald-500/20">
              <div class="w-3 h-3 bg-white rounded-none"></div>
            </div>
            <div class="w-1.5 h-2 bg-emerald-700"></div>
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
      });

      destMarkerRef.current = L.marker([destination.coords.lat, destination.coords.lng], {
        icon: destIcon,
        zIndexOffset: 100,
      }).addTo(mapRef.current);
    }
  }, [pickup, destination]);

  // 6. Draw Polyline Route
  useEffect(() => {
    if (!mapRef.current) return;

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 1) {
      const latlngs: [number, number][] = routeCoordinates.map((c) => [c.lat, c.lng]);

      const polyline = L.polyline(latlngs, {
        color: isDarkTheme ? '#38bdf8' : '#0f172a',
        weight: 5,
        opacity: 0.95,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(mapRef.current);

      routeLayerRef.current = polyline;

      // Fit bounds with comfortable padding so the full trip is in view
      const bounds = L.latLngBounds(latlngs);
      mapRef.current.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 16,
        animate: true,
      });
    }
  }, [routeCoordinates, isDarkTheme]);

  // 7. Idle Drivers (wandering around city)
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear previous idle markers
    idleDriverMarkersRef.current.forEach((m) => m.remove());
    idleDriverMarkersRef.current = [];

    // Only show idle drivers when no active trip or during search
    if (!activeDriver) {
      idleDrivers.forEach((driver) => {
        const carIcon = L.divIcon({
          className: 'custom-idle-car',
          html: `
            <div style="transform: rotate(${driver.bearing}deg); transition: transform 0.3s ease;" class="relative w-8 h-8 flex items-center justify-center drop-shadow-md">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="7" y="3" width="10" height="18" rx="3" fill="${isDarkTheme ? '#ffffff' : '#0f172a'}" stroke="#000000" stroke-width="1.2"/>
                <!-- Windshields -->
                <rect x="8.5" y="6" width="7" height="3" rx="1" fill="#38bdf8" fill-opacity="0.9"/>
                <rect x="8.5" y="15" width="7" height="2" rx="0.5" fill="#38bdf8" fill-opacity="0.7"/>
                <!-- Headlights -->
                <circle cx="8" cy="4" r="1" fill="#fef08a"/>
                <circle cx="16" cy="4" r="1" fill="#fef08a"/>
              </svg>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([driver.coords.lat, driver.coords.lng], {
          icon: carIcon,
          zIndexOffset: 50,
        }).addTo(mapRef.current!);

        idleDriverMarkersRef.current.push(marker);
      });
    }
  }, [idleDrivers, activeDriver, isDarkTheme]);

  // 8. Active Driver Car Marker with Live Smooth Tracking & Heading
  useEffect(() => {
    if (!mapRef.current) return;

    if (!activeDriver) {
      if (activeDriverMarkerRef.current) {
        activeDriverMarkerRef.current.remove();
        activeDriverMarkerRef.current = null;
      }
      return;
    }

    const coords = activeDriver.coords;
    const bearing = activeDriver.bearing || 0;

    const activeCarIcon = L.divIcon({
      className: 'custom-active-car',
      html: `
        <div class="relative flex items-center justify-center">
          <!-- Pulse wave ring around active car -->
          <div class="absolute w-12 h-12 rounded-full bg-sky-400/25 radar-ring pointer-events-none"></div>
          <div style="transform: rotate(${bearing}deg); transition: transform 0.25s linear;" class="relative w-9 h-9 flex items-center justify-center drop-shadow-2xl">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <!-- Vehicle chassis -->
              <rect x="6.5" y="2.5" width="11" height="19" rx="3.5" fill="#06c167" stroke="#ffffff" stroke-width="1.5"/>
              <!-- Front Windshield -->
              <rect x="8" y="6" width="8" height="3.5" rx="1" fill="#0f172a"/>
              <!-- Rear Window -->
              <rect x="8" y="15" width="8" height="2.5" rx="0.5" fill="#0f172a"/>
              <!-- Side mirrors -->
              <rect x="4.5" y="6.5" width="2" height="3" rx="0.5" fill="#ffffff"/>
              <rect x="17.5" y="6.5" width="2" height="3" rx="0.5" fill="#ffffff"/>
              <!-- Headlights beam -->
              <circle cx="8" cy="3.5" r="1.2" fill="#fef08a"/>
              <circle cx="16" cy="3.5" r="1.2" fill="#fef08a"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (!activeDriverMarkerRef.current) {
      activeDriverMarkerRef.current = L.marker([coords.lat, coords.lng], {
        icon: activeCarIcon,
        zIndexOffset: 300,
      }).addTo(mapRef.current);
    } else {
      activeDriverMarkerRef.current.setLatLng([coords.lat, coords.lng]);
      activeDriverMarkerRef.current.setIcon(activeCarIcon);
    }
  }, [activeDriver?.coords.lat, activeDriver?.coords.lng, activeDriver?.bearing]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
