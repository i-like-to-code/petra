import { Router, Request, Response } from 'express';
import { brandService } from '../services/brand.service';
import { authenticateJwt, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();
const adminRouter = Router();

// ==========================================
// USER / MOBILE APP BRAND ROUTES
// Base URL: /api/brands
// ==========================================

// Get all active brands for user app (or all with active flag)
router.get('/', async (req: Request, res: Response) => {
  try {
    const includeAll = req.query.all === 'true';
    const brands = await brandService.getAllBrands(includeAll);
    res.json({
      success: true,
      data: brands,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const brand = await brandService.getBrandById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    res.json({ success: true, data: brand });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// ADMIN BRAND ROUTES
// Base URL: /api/admin/brands
// ==========================================
adminRouter.use(authenticateJwt, authorizeAdmin);

// Get all brands (including inactive ones)
adminRouter.get('/', async (req: Request, res: Response) => {
  try {
    const brands = await brandService.getAllBrands(true);
    res.json({ success: true, data: brands });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle brand visibility
adminRouter.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { active } = req.body;
    const brand = await brandService.toggleBrandVisibility(req.params.id, active);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    res.json({
      success: true,
      message: `Brand ${brand.name} visibility updated to ${brand.active ? 'Active' : 'Hidden'}`,
      data: brand,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update brand metadata
adminRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const brand = await brandService.updateBrand(req.params.id, req.body);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    res.json({ success: true, data: brand });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create new brand
adminRouter.post('/', async (req: Request, res: Response) => {
  try {
    const brand = await brandService.createBrand(req.body);
    res.status(201).json({ success: true, data: brand });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
export { adminRouter as adminBrandRoutes };
