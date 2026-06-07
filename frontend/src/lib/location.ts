import * as Location from 'expo-location';

// A meetup spot shared inside a chat message. `name`/`address` are present when
// the user picked a Google place; "share current location" sends just coords.
export interface SharedLocation {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

// SOH control-char sentinel (U+0001). It never appears in real typed text,
// survives JSON.stringify transport and the server's body.trim(), so it's a safe
// in-band flag for a location message — no message schema change needed. Written
// as an escape so the source stays ASCII-clean.
const LOCATION_PREFIX = '\u0001loc\u0001';

export function encodeLocationMessage(loc: SharedLocation): string {
  return LOCATION_PREFIX + JSON.stringify(loc);
}

// Returns the decoded location for a location message, or null for plain text.
export function parseLocationMessage(body: string): SharedLocation | null {
  if (!body.startsWith(LOCATION_PREFIX)) return null;
  try {
    const loc = JSON.parse(body.slice(LOCATION_PREFIX.length));
    if (typeof loc?.lat === 'number' && typeof loc?.lng === 'number') {
      return loc as SharedLocation;
    }
  } catch {
    // malformed payload — treat as plain text
  }
  return null;
}

export class LocationPermissionError extends Error {
  constructor() {
    super('Location permission denied');
    this.name = 'LocationPermissionError';
  }
}

// Prompts for foreground permission (browser geolocation on web) and returns the
// current coordinates. Throws LocationPermissionError if the user declines.
export async function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new LocationPermissionError();
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

// Universal Maps link: opens the Maps app on iOS/Android and the web map in a
// browser. Uses exact coordinates so the pin lands precisely.
export function mapsUrl(loc: SharedLocation): string {
  return `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
}

// Great-circle distance in miles, for showing "0.2 mi" next to picker results.
export function haversineMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8; // Earth radius, miles
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
