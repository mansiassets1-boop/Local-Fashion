import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Request location permissions and return the current position.
 */
export async function getCurrentLocation(): Promise<Coordinates> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied. Please enable location access in Settings.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy ?? undefined,
  };
}

/**
 * Request background location permission (needed for delivery tracking while app is backgrounded).
 */
export async function requestBackgroundPermission(): Promise<boolean> {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Start watching position. Returns an unsubscribe function.
 * onUpdate is called with the latest coordinates whenever they change.
 */
export async function watchLocation(
  onUpdate: (coords: Coordinates) => void,
  options?: Location.LocationOptions,
): Promise<Location.LocationSubscription> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied.');
  }

  const subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,    // at least every 5s
      distanceInterval: 10,  // or every 10 metres
      ...options,
    },
    (position) => {
      onUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
      });
    },
  );

  return subscription;
}

/**
 * Calculate straight-line distance between two coordinates in kilometres.
 */
export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Build a Google Maps directions URL for navigation.
 */
export function buildGoogleMapsUrl(destination: Coordinates, label?: string): string {
  const dest = `${destination.latitude},${destination.longitude}`;
  const labelParam = label ? `&q=${encodeURIComponent(label)}` : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}${labelParam}&travelmode=driving`;
}
