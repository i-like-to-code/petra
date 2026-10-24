import { Response, NextFunction } from 'express';
import { homeService } from '../services/home.service';
import { AuthenticatedRequest } from '../types/auth.types';
import { ProductQuery } from '../types/home.types';

export class HomeController {
  /**
   * GET /api/home
   * Aggregated home page payload (Authenticated via JWT)
   */
  async getHomeScreen(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const homeData = await homeService.getHomeScreenData(userId);

      res.status(200).json({
        success: true,
        message: 'Home page data retrieved successfully.',
        data: homeData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/home/banners
   * Fetch active promotional banners
   */
  async getBanners(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const banners = await homeService.getActiveBanners();

      res.status(200).json({
        success: true,
        message: 'Active banners retrieved successfully.',
        data: {
          banners,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/home/categories
   * Fetch active product categories
   */
  async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await homeService.getActiveCategories();

      res.status(200).json({
        success: true,
        message: 'Active categories retrieved successfully.',
        data: {
          categories,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/home/products
   * Fetch active products with pagination & filtering
   * Query params: page, limit, search, category, featured
   */
  async getProducts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: ProductQuery = req.query as any;
      const paginatedResult = await homeService.getActiveProducts(query);

      res.status(200).json({
        success: true,
        message: 'Active products retrieved successfully.',
        data: paginatedResult,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const homeController = new HomeController();
