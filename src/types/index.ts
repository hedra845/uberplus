export type AppMode = 'rider' | 'driver' | 'flutter_studio';

export type ViewportMode = 'mobile' | 'desktop';

export type TripStatus =
  | 'idle'
  | 'searching'
  | 'accepted'
  | 'arriving'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface CityDestination {
  id: string;
  name: string;
  address: string;
  coords: LatLng;
  category: 'airport' | 'landmark' | 'transit' | 'hotel' | 'shopping' | 'neighborhood';
  icon: string;
}

export interface CityData {
  id: string;
  name: string;
  country: string;
  center: LatLng;
  zoom: number;
  pickupHotspots: CityDestination[];
  destinations: CityDestination[];
  surgeZones: SurgeZone[];
}

export interface SurgeZone {
  id: string;
  name: string;
  center: LatLng;
  radiusMeters: number;
  multiplier: number;
  color: string;
}

export interface RideTier {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  perMileRate: number;
  perMinuteRate: number;
  capacity: number;
  etaMinutes: number;
  carModels: string[];
  features: string[];
  tag?: string;
  badge?: string;
}

export interface Driver {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  carModel: string;
  carColor: string;
  licensePlate: string;
  phone: string;
  coords: LatLng;
  bearing: number;
  status: 'idle' | 'assigned' | 'en_route_pickup' | 'on_trip';
}

export interface ActiveTrip {
  id: string;
  riderName: string;
  pickup: CityDestination;
  destination: CityDestination;
  tier: RideTier;
  driver?: Driver;
  status: TripStatus;
  distanceMiles: number;
  durationMinutes: number;
  baseFare: number;
  surgeMultiplier: number;
  discount: number;
  totalFare: number;
  pin: string;
  currentProgress: number; // 0.0 to 1.0
  routeWaypoints: LatLng[];
  currentDriverCoords?: LatLng;
  driverBearing?: number;
  driverEtaMinutes: number;
  tripEtaMinutes: number;
  createdAt: number;
  preferences: {
    quietRide: boolean;
    temperature: 'normal' | 'cool' | 'warm';
    luggage: boolean;
  };
  paymentMethod: {
    type: 'apple_pay' | 'visa' | 'uber_cash' | 'google_pay' | 'cash';
    label: string;
    last4?: string;
  };
  tip: number;
  rating?: number;
  compliments?: string[];
}

export interface PastTrip {
  id: string;
  date: string;
  pickup: string;
  destination: string;
  tierName: string;
  carModel: string;
  driverName: string;
  fare: number;
  rating: number;
  distance: string;
}

export interface TurnManeuver {
  instruction: string;
  distanceRemaining: string;
  icon: 'straight' | 'turn_right' | 'turn_left' | 'slight_right' | 'slight_left' | 'arrive';
}
