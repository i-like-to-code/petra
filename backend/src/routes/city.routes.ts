import { Router, Request, Response, NextFunction } from 'express';
import { cityService } from '../services/city.service';
import { authenticateJwt, authorizeAdmin } from '../middleware/auth.middleware';

// Sends errors that carry a statusCode (validation, conflicts) back to the client as-is
function handleError(error: any, res: Response, next: NextFunction) {
  if (error?.statusCode) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  next(error);
}

/**
 * @route   GET /api/cities
 * @desc    Active delivery cities (used by the mobile checkout and agent forms)
 * @access  Public
 */
const router = Router();
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cities = await cityService.listCities(false);
    res.status(200).json({ success: true, data: cities.map((c) => cityService.sanitize(c)) });
  } catch (error) {
    handleError(error, res, next);
  }
});

/**
 * Admin city management: /api/admin/cities
 */
const adminRouter = Router();
adminRouter.use(authenticateJwt, authorizeAdmin);

adminRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cities = await cityService.listCities(true);
    res.status(200).json({ success: true, data: cities.map((c) => cityService.sanitize(c)) });
  } catch (error) {
    handleError(error, res, next);
  }
});

adminRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const city = await cityService.createCity(req.body || {});
    res.status(201).json({ success: true, message: 'City added.', data: cityService.sanitize(city) });
  } catch (error) {
    handleError(error, res, next);
  }
});

adminRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const city = await cityService.updateCity(req.params.id, req.body || {});
    res.status(200).json({ success: true, message: 'City updated.', data: cityService.sanitize(city) });
  } catch (error) {
    handleError(error, res, next);
  }
});

adminRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await cityService.deleteCity(req.params.id);
    res.status(200).json({ success: true, message: 'City deleted.' });
  } catch (error) {
    handleError(error, res, next);
  }
});

export { router as cityRoutes, adminRouter as adminCityRoutes };
