import { LatLng } from '../types';

/**
 * Calculate distance between two GPS coordinates in miles using Haversine formula
 */
export function calculateDistanceMiles(coord1: LatLng, coord2: LatLng): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculate compass bearing between two points (in degrees 0-360)
 */
export function calculateBearing(start: LatLng, end: LatLng): number {
  const startLat = toRad(start.lat);
  const startLng = toRad(start.lng);
  const endLat = toRad(end.lat);
  const endLng = toRad(end.lng);

  const dLng = endLng - startLng;

  const y = Math.sin(dLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  let brng = toDeg(Math.atan2(y, x));
  brng = (brng + 360) % 360;
  return Math.round(brng);
}

/**
 * Generate intermediate grid-based street waypoints between two coordinates
 * to simulate city street turns rather than an unrealistic straight line bird flight.
 */
export function generateRealisticCityRoute(start: LatLng, end: LatLng, steps: number = 24): LatLng[] {
  const route: LatLng[] = [start];

  // Street grid corner points
  const midLat = start.lat + (end.lat - start.lat) * 0.45;
  const midLng = start.lng + (end.lng - start.lng) * 0.55;

  const corner1: LatLng = { lat: start.lat, lng: midLng };
  const corner2: LatLng = { lat: midLat, lng: midLng };
  const corner3: LatLng = { lat: midLat, lng: end.lng };

  const keyPoints = [start, corner1, corner2, corner3, end];
  
  // Interpolate smoothly between key points
  for (let i = 0; i < keyPoints.length - 1; i++) {
    const p1 = keyPoints[i];
    const p2 = keyPoints[i + 1];
    const segmentSteps = Math.max(3, Math.floor(steps / (keyPoints.length - 1)));

    for (let s = 1; s <= segmentSteps; s++) {
      const t = s / segmentSteps;
      // Add subtle street curvature jitter
      const jitterLat = Math.sin(t * Math.PI) * 0.00015 * ((i % 2 === 0) ? 1 : -1);
      const jitterLng = Math.cos(t * Math.PI) * 0.00015 * ((i % 2 === 0) ? -1 : 1);

      route.push({
        lat: p1.lat + (p2.lat - p1.lat) * t + jitterLat,
        lng: p1.lng + (p2.lng - p1.lng) * t + jitterLng,
      });
    }
  }

  route.push(end);
  return route;
}

/**
 * Interpolate coordinate along a polyline given a progress fraction (0.0 to 1.0)
 */
export function getPositionAtProgress(waypoints: LatLng[], progress: number): { position: LatLng; bearing: number; currentIndex: number } {
  if (waypoints.length === 0) {
    return { position: { lat: 0, lng: 0 }, bearing: 0, currentIndex: 0 };
  }
  if (waypoints.length === 1 || progress <= 0) {
    return { position: waypoints[0], bearing: 0, currentIndex: 0 };
  }
  if (progress >= 1) {
    const last = waypoints[waypoints.length - 1];
    const secondLast = waypoints[waypoints.length - 2];
    return {
      position: last,
      bearing: calculateBearing(secondLast, last),
      currentIndex: waypoints.length - 1,
    };
  }

  const totalSegments = waypoints.length - 1;
  const scaledProgress = progress * totalSegments;
  const currentIndex = Math.min(Math.floor(scaledProgress), totalSegments - 1);
  const segmentProgress = scaledProgress - currentIndex;

  const p1 = waypoints[currentIndex];
  const p2 = waypoints[currentIndex + 1];

  const currentLat = p1.lat + (p2.lat - p1.lat) * segmentProgress;
  const currentLng = p1.lng + (p2.lng - p1.lng) * segmentProgress;
  const bearing = calculateBearing(p1, p2);

  return {
    position: { lat: currentLat, lng: currentLng },
    bearing,
    currentIndex,
  };
}
