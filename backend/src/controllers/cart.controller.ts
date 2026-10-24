import { Response, NextFunction } from 'express';
import { cartService } from '../services/cart.service';
import { AuthenticatedRequest } from '../types/auth.types';
import { AddToCartDto, UpdateCartItemDto } from '../types/cart.types';

export class CartController {
  /**
   * GET /api/cart
   * Get currently authenticated user's cart with calculated subtotals
   */
  async getCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const cart = await cartService.getCartByUserId(userId);

      res.status(200).json({
        success: true,
        message: 'User cart fetched successfully.',
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/cart/items
   * Add a product to the user's cart
   */
  async addItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { productId, quantity }: AddToCartDto = req.body;

      if (!productId || !productId.trim()) {
        res.status(400).json({ success: false, message: 'Product ID is required.' });
        return;
      }

      const qty = quantity !== undefined ? Number(quantity) : 1;
      if (isNaN(qty) || qty < 1) {
        res.status(400).json({ success: false, message: 'Quantity must be a positive integer greater than 0.' });
        return;
      }

      const updatedCart = await cartService.addItemToCart(userId, productId.trim(), qty);

      res.status(201).json({
        success: true,
        message: 'Product added to cart successfully.',
        data: updatedCart,
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * PUT /api/cart/items/:itemId
   * Update quantity for a specific cart item
   */
  async updateItemQuantity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { itemId } = req.params;
      const { quantity }: UpdateCartItemDto = req.body;

      if (!itemId || !itemId.trim()) {
        res.status(400).json({ success: false, message: 'Cart item ID is required.' });
        return;
      }

      if (quantity === undefined || quantity === null || isNaN(Number(quantity))) {
        res.status(400).json({ success: false, message: 'Valid quantity is required.' });
        return;
      }

      const qty = Number(quantity);
      if (qty < 1) {
        res.status(400).json({ success: false, message: 'Quantity must be a positive number greater than 0.' });
        return;
      }

      const updatedCart = await cartService.updateCartItemQuantity(userId, itemId.trim(), qty);

      res.status(200).json({
        success: true,
        message: 'Cart item quantity updated successfully.',
        data: updatedCart,
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * DELETE /api/cart/items/:itemId
   * Remove a specific item from the user's cart
   */
  async removeItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { itemId } = req.params;

      if (!itemId || !itemId.trim()) {
        res.status(400).json({ success: false, message: 'Cart item ID is required.' });
        return;
      }

      const updatedCart = await cartService.removeCartItem(userId, itemId.trim());

      res.status(200).json({
        success: true,
        message: 'Item removed from cart successfully.',
        data: updatedCart,
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * DELETE /api/cart
   * Clear all items from the user's cart
   */
  async clearCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const clearedCart = await cartService.clearCart(userId);

      res.status(200).json({
        success: true,
        message: 'Cart cleared successfully.',
        data: clearedCart,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cartController = new CartController();
