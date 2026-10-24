import { Router, Request, Response, NextFunction } from 'express';
import { geoService } from '../services/geo.service';
import { authenticateJwt } from '../middleware/auth.middleware';

/**
 * OpenStreetMap address lookups for signed-in users: /api/geo
 * (Authenticated so the backend can't be used as an open Nominatim proxy.)
 */
const router = Router();
router.use(authenticateJwt);

function handleError(error: any, res: Response, next: NextFunction) {
  if (error?.statusCode) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
    res.status(504).json({ success: false, message: 'Map lookup timed out. Please try again.' });
    return;
  }
  next(error);
}

// GET /api/geo/reverse?lat=13.08&lon=80.27 - address for a GPS position
router.get('/reverse', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const address = await geoService.reverse(Number(req.query.lat), Number(req.query.lon));
    res.status(200).json({ success: true, data: address });
  } catch (error) {
    handleError(error, res, next);
  }
});

// GET /api/geo/search?q=Anna Nagar Chennai - address suggestions
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await geoService.search(String(req.query.q || ''));
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    handleError(error, res, next);
  }
});

export default router;
