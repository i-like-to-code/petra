import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authenticateJwt, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();
const adminRouter = Router();

/**
 * USER ORDER ROUTES: /api/orders
 */
router.use(authenticateJwt);
router.post('/', (req, res, next) => orderController.createOrder(req, res, next));
router.get('/', (req, res, next) => orderController.getUserOrders(req, res, next));
router.get('/:id', (req, res, next) => orderController.getOrderById(req, res, next));
router.put('/:id/cancel', (req, res, next) => orderController.cancelOrder(req, res, next));

/**
 * ADMIN ORDER ROUTES: /api/admin/orders
 */
adminRouter.use(authenticateJwt, authorizeAdmin);
adminRouter.get('/', (req, res, next) => orderController.getAdminOrders(req, res, next));
adminRouter.get('/:id', (req, res, next) => orderController.getOrderById(req, res, next));
adminRouter.put('/:id/status', (req, res, next) => orderController.updateOrderStatus(req, res, next));

export default router;
export { router as orderRoutes, adminRouter as adminOrderRoutes };
