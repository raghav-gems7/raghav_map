// How often the customer's and owner's map check for the delivery boy's newest location
export const TRACKING_INTERVAL = 5000;

// How often the delivery boy's phone checks his own GPS location
export const BG_TRACKING_INTERVAL = 20000;

// How far (in meters) he needs to move before we bother sending an update
export const MIN_DISTANCE_METERS = 10;

// If we haven't heard from a delivery boy in this long, we show him as "Offline"
export const STALE_LOCATION_THRESHOLD_MS = 30000;

// Assumed average speed, used to guess arrival time (etaService.js)
export const AVG_DELIVERY_SPEED_KMH = 20;

// Free map service used to fetch the road path (feature not turned on yet)
export const OSRM_BASE_URL =
    'https://router.project-osrm.org/route/v1/driving';

export const DEFAULT_REGION = {
    latitude: 22.6883883,
    longitude: 75.8291816,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};