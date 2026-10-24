import { Router } from 'express';
import { cartController } from '../controllers/cart.controller';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

// Protect all Cart routes with JWT authentication middleware
router.use(authenticateJwt);

/**
 * @route   GET /api/cart
 * @desc    Get currently authenticated user's cart
 * @access  Private
 */
router.get('/', (req, res, next) => cartController.getCart(req, res, next));

/**
 * @route   POST /api/cart/items
 * @desc    Add a product to user's cart (or increment quantity)
 * @access  Private
 */
router.post('/items', (req, res, next) => cartController.addItem(req, res, next));

/**
 * @route   PUT /api/cart/items/:itemId
 * @desc    Update quantity for a specific cart item
 * @access  Private
 */
router.put('/items/:itemId', (req, res, next) => cartController.updateItemQuantity(req, res, next));

/**
 * @route   DELETE /api/cart/items/:itemId
 * @desc    Remove an item from user's cart
 * @access  Private
 */
router.delete('/items/:itemId', (req, res, next) => cartController.removeItem(req, res, next));

/**
 * @route   DELETE /api/cart
 * @desc    Clear all items from user's cart
 * @access  Private
 */
router.delete('/', (req, res, next) => cartController.clearCart(req, res, next));

export default router;
