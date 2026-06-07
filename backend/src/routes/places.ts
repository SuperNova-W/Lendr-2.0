import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/error';
import { placesNearbySchema } from '../schemas';

const router = Router();
router.use(requireAuth);

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places';
const FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.location';

interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
}

// GET /places/nearby?lat=&lng=&q=
// Proxies Google Places (New) so the API key never ships to clients and the same
// call works on web and native. Without `q` it returns popular spots near the
// point; with `q` it runs a text search biased to that point. Authed so the
// Places quota can't be burned by anonymous callers.
router.get('/nearby', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) {
      // Soft failure: the "share current location" path still works without a key;
      // the client uses this code to show a friendly "search unavailable" state.
      res.status(503).json({ error: 'Place search is not configured', code: 'PLACES_UNCONFIGURED' });
      return;
    }

    const { lat, lng, q } = placesNearbySchema.parse(req.query);

    const useText = !!q;
    const body = useText
      ? {
          textQuery: q,
          maxResultCount: 20,
          locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 2000 } },
        }
      : {
          maxResultCount: 20,
          rankPreference: 'POPULARITY',
          locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 1500 } },
        };

    const googleRes = await fetch(`${PLACES_ENDPOINT}:${useText ? 'searchText' : 'searchNearby'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!googleRes.ok) {
      const detail = await googleRes.text().catch(() => '');
      console.error('Google Places error', googleRes.status, detail);
      throw new AppError(502, 'Place search failed');
    }

    const data = (await googleRes.json()) as { places?: GooglePlace[] };
    const places = (data.places ?? [])
      .filter((p) => p.location?.latitude != null && p.location?.longitude != null)
      .map((p) => ({
        id: p.id ?? '',
        name: p.displayName?.text ?? 'Unnamed place',
        address: p.formattedAddress ?? '',
        lat: p.location!.latitude!,
        lng: p.location!.longitude!,
      }));

    res.json(places);
  } catch (err) { next(err); }
});

export { router as placesRouter };
