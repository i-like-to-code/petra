import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticateJwt, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();
const adminRouter = Router();
const adminCategoryRouter = Router();

/**
 * ==========================================
 * USER / MOBILE PRODUCT ROUTES
 * Base URL: /api/products
 * ==========================================
 */
router.get('/', (req, res, next) => productController.getProducts(req, res, next));
router.get('/search', (req, res, next) => productController.searchProducts(req, res, next));
router.get('/categories', (req, res, next) => productController.getCategories(req, res, next));
router.get('/types', (req, res, next) => productController.getCementTypes(req, res, next));
router.get('/:id', (req, res, next) => productController.getProductById(req, res, next));

/**
 * ==========================================
 * ADMIN PRODUCT ROUTES
 * Base URL: /api/admin/products
 * ==========================================
 */
adminRouter.use(authenticateJwt, authorizeAdmin);
adminRouter.get('/types', (req, res, next) => productController.getCementTypes(req, res, next));
adminRouter.patch('/types/toggle', (req, res, next) => productController.toggleCementType(req, res, next));
adminRouter.patch('/:id/toggle', (req, res, next) => productController.toggleProduct(req, res, next));
adminRouter.get('/', (req, res, next) => productController.getAdminProducts(req, res, next));
adminRouter.post('/', (req, res, next) => productController.createProduct(req, res, next));
adminRouter.put('/:id', (req, res, next) => productController.updateProduct(req, res, next));
adminRouter.delete('/:id', (req, res, next) => productController.deleteProduct(req, res, next));

/**
 * ==========================================
 * ADMIN CATEGORY ROUTES
 * Base URL: /api/admin/categories
 * ==========================================
 */
adminCategoryRouter.use(authenticateJwt, authorizeAdmin);
adminCategoryRouter.get('/', (req, res, next) => productController.getAdminCategories(req, res, next));
adminCategoryRouter.post('/', (req, res, next) => productController.createCategory(req, res, next));
adminCategoryRouter.put('/:id', (req, res, next) => productController.updateCategory(req, res, next));
adminCategoryRouter.delete('/:id', (req, res, next) => productController.deleteCategory(req, res, next));

export default router;
export { 
  router as productRoutes, 
  adminRouter as adminProductRoutes, 
  adminCategoryRouter as adminCategoryRoutes 
};
