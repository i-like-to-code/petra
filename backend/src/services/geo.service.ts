import { cityService } from './city.service';

/**
 * OpenStreetMap (Nominatim) address lookups for the mobile checkout.
 * Nominatim's usage policy requires an identifying User-Agent and at most 1 request per second,
 * so requests are serialised with a minimum gap and results are cached in memory.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const MIN_REQUEST_GAP_MS = 1100;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
// Rough Tamil Nadu bounding box (lon/lat), used to bias search results towards the service area
const TAMIL_NADU_VIEWBOX = '76.2,13.6,80.4,8.0';

export interface GeoAddress {
  displayName: string;
  addressLine: string;
  area: string;
  city: string;
  matchedCity: string | null; // name of an active City in our database, if one matches
  pincode: string;
  state: string;
  lat: number;
  lon: number;
}

const cache = new Map<string, { data: any; expires: number }>();
let queue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

async function nominatimFetch(path: string): Promise<any> {
  const cached = cache.get(path);
  if (cached && cached.expires > Date.now()) return cached.data;

  const run = async () => {
    const wait = lastRequestAt + MIN_REQUEST_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();

    const res = await fetch(`${NOMINATIM_BASE}${path}`, {
      headers: {
        'User-Agent': process.env.NOMINATIM_USER_AGENT || 'PetraCements-Backend/1.0',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw createHttpError(502, `Map lookup failed (${res.status}).`);
    return res.json();
  };

  // Chain onto the queue so only one request is in flight at a time
  const result = queue.then(run, run);
  queue = result.catch(() => undefined);
  const data = await result;

  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(path, { data, expires: Date.now() + CACHE_TTL_MS });
  return data;
}

async function toGeoAddress(item: any): Promise<GeoAddress> {
  const a = item.address || {};
  const cityCandidates = [a.city, a.town, a.municipality, a.city_district, a.village, a.county, a.state_district, a.suburb]
    .filter(Boolean)
    .map((c: string) => c.replace(/\s+(district|taluk|corporation)$/i, '').trim());

  let matchedCity: string | null = null;
  for (const candidate of cityCandidates) {
    const city = await cityService.findActiveCity(candidate);
    if (city) {
      matchedCity = city.name;
      break;
    }
  }

  const street = [a.house_number, a.road].filter(Boolean).join(' ');
  const area = a.neighbourhood || a.suburb || a.quarter || a.hamlet || '';
  return {
    displayName: item.display_name || '',
    addressLine: [a.building || a.amenity, street, area].filter(Boolean).join(', '),
    area,
    city: cityCandidates[0] || '',
    matchedCity,
    pincode: (a.postcode || '').replace(/\s/g, ''),
    state: a.state || '',
    lat: Number(item.lat),
    lon: Number(item.lon),
  };
}

export class GeoService {
  async reverse(lat: number, lon: number): Promise<GeoAddress> {
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      throw createHttpError(400, 'Valid latitude and longitude are required.');
    }
    // Round to ~10 m so nearby requests share a cache entry
    const path = `/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
    const data = await nominatimFetch(path);
    if (!data || data.error) throw createHttpError(404, 'No address found for this location.');
    return toGeoAddress(data);
  }

  async search(query: string): Promise<GeoAddress[]> {
    const q = (query || '').trim();
    if (q.length < 3) return [];
    const path = `/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=in&viewbox=${TAMIL_NADU_VIEWBOX}&q=${encodeURIComponent(q.slice(0, 120))}`;
    const data = await nominatimFetch(path);
    if (!Array.isArray(data)) return [];
    return Promise.all(data.map(toGeoAddress));
  }
}

export const geoService = new GeoService();
