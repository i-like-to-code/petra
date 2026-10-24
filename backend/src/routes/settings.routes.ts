import { Router, Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings.service';
import { authenticateJwt, authorizeAdmin } from '../middleware/auth.middleware';

// Sends validation errors (statusCode) back to the client as-is
function handleError(error: any, res: Response, next: NextFunction) {
  if (error?.statusCode) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  next(error);
}

/**
 * Admin settings: /api/admin/settings
 */
const router = Router();
router.use(authenticateJwt, authorizeAdmin);

// GET /api/admin/settings/commission - current agent commission rule
router.get('/commission', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await settingsService.getCommissionSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    handleError(error, res, next);
  }
});

// PUT /api/admin/settings/commission - { type: 'percent' | 'per_bag', value: number }
router.put('/commission', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await settingsService.updateCommissionSettings(req.body || {});
    res.status(200).json({ success: true, message: 'Commission settings saved.', data: settings });
  } catch (error) {
    handleError(error, res, next);
  }
});

// GET /api/admin/settings/home-banner - mobile Home screen banner text
router.get('/home-banner', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banner = await settingsService.getHomeBanner();
    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    handleError(error, res, next);
  }
});

// PUT /api/admin/settings/home-banner - { badge, title, buttonText }
router.put('/home-banner', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banner = await settingsService.updateHomeBanner(req.body || {});
    res.status(200).json({ success: true, message: 'Home banner saved.', data: banner });
  } catch (error) {
    handleError(error, res, next);
  }
});

/**
 * Public settings read by the mobile app: /api/settings
 */
const publicRouter = Router();

// GET /api/settings/home-banner
publicRouter.get('/home-banner', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const banner = await settingsService.getHomeBanner();
    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    handleError(error, res, next);
  }
});

export { publicRouter as publicSettingsRoutes };
export default router;
