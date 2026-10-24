import { Response, NextFunction } from 'express';
import { orderService } from '../services/order.service';
import { AuthenticatedRequest } from '../types/auth.types';
import { CreateOrderDto, UpdateOrderStatusDto } from '../types/order.types';

export class OrderController {
  /**
   * POST /api/orders
   * Create a new Order from active Cart
   */
  async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const dto: CreateOrderDto = req.body;

      if (!dto.shippingAddress) {
        res.status(400).json({ success: false, message: 'Shipping address is required.' });
        return;
      }

      const { fullName, phone, addressLine1, city, state, pincode } = dto.shippingAddress;
      if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
        res.status(400).json({
          success: false,
          message: 'Full name, phone, addressLine1, city, state, and pincode are required in shipping address.',
        });
        return;
      }

      const order = await orderService.createOrder(userId, dto);

      res.status(201).json({
        success: true,
        message: 'Order placed successfully.',
        data: order,
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
   * GET /api/orders
   * Get logged-in user's order history
   */
  async getUserOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const orders = await orderService.getUserOrders(userId);

      res.status(200).json({
        success: true,
        message: 'Order history fetched successfully.',
        data: {
          orders,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/:id
   * Get specific order details
   */
  async getOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const order = await orderService.getOrderById(id, userId, false);

      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Order details fetched successfully.',
        data: {
          order,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/orders/:id/cancel
   * Cancel an order if it is in pending or processing status
   */
  async cancelOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const canceledOrder = await orderService.cancelOrder(userId, id);

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully.',
        data: canceledOrder,
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

  // ==========================================
  // ADMIN ORDER CONTROLLERS
  // ==========================================

  /**
   * GET /api/admin/orders
   * Admin: View all customer orders in system
   */
  async getAdminOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const statusFilter = req.query.status as string;
      const orders = await orderService.getAdminOrders(statusFilter);

      res.status(200).json({
        success: true,
        message: 'All system orders fetched successfully.',
        data: {
          orders,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/orders/:id/status
   * Admin: Update order status (pending -> processing -> dispatched -> delivered)
   */
  async updateOrderStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdateOrderStatusDto = req.body;

      const updatedOrder = await orderService.updateOrderStatus(id, dto);

      if (!updatedOrder) {
        res.status(404).json({ success: false, message: 'Order not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Order status updated successfully.',
        data: updatedOrder,
      });
    } catch (error: any) {
      if (error?.statusCode) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }
}

export const orderController = new OrderController();
