import { Router } from 'express';
import { homeController } from '../controllers/home.controller';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/home
 * @desc    Get aggregated home page dashboard data
 * @access  Private (JWT Protected)
 */
router.get('/', authenticateJwt, (req, res, next) => homeController.getHomeScreen(req, res, next));

/**
 * @route   GET /api/home/banners
 * @desc    Get active promotional banners
 * @access  Public
 */
router.get('/banners', (req, res, next) => homeController.getBanners(req, res, next));

/**
 * @route   GET /api/home/categories
 * @desc    Get active product categories
 * @access  Public
 */
router.get('/categories', (req, res, next) => homeController.getCategories(req, res, next));

/**
 * @route   GET /api/home/products
 * @desc    Get active products with pagination and filters (search, category, featured)
 * @access  Public
 */
router.get('/products', (req, res, next) => homeController.getProducts(req, res, next));

export default router;
