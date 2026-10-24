import mongoose from 'mongoose';
import { Order, IOrder } from '../models/order.model';
import { Cart } from '../models/cart.model';
import { Product } from '../models/product.model';
import { User } from '../models/user.model';
import { Commission } from '../models/commission.model';
import { cityService } from './city.service';
import { settingsService } from './settings.service';
import { OrderResponse, CreateOrderDto, UpdateOrderStatusDto } from '../types/order.types';

// Error carrying an HTTP status; the order controller returns it to the client as-is
function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

export class OrderService {
  sanitizeOrder(order: any): any {
    const items = (order.items || []).map((item: any) => ({
      id: item._id ? item._id.toString() : '',
      productId: item.product ? (item.product._id ? item.product._id.toString() : item.product.toString()) : '',
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      itemSubtotal: item.itemSubtotal,
    }));

    const statusMap: Record<string, string> = {
      pending: 'Pending',
      processing: 'Pending',
      dispatched: 'Dispatched',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };

    const detailsStr = items.map((i: any) => `${i.quantity} bags - ${i.name}`).join(', ') || 'Bulk Cement Consignment';
    const customerName = (order.shippingAddress && order.shippingAddress.fullName) 
      || (order.user && (order.user as any).fullName) 
      || 'Contractor / Builder';
    const city = (order.shippingAddress && order.shippingAddress.city) || 'Tamil Nadu';

    return {
      id: order._id.toString(),
      _id: order._id.toString(),
      code: order.orderNumber,
      orderNumber: order.orderNumber,
      customer: customerName,
      location: city,
      details: detailsStr,
      amount: '\u20B9' + (order.totalAmount || 0).toLocaleString('en-IN'),
      status: statusMap[order.orderStatus] || 'Pending',
      userId: order.user ? (order.user._id ? order.user._id.toString() : order.user.toString()) : '',
      items,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee || 0,
      totalAmount: order.totalAmount,
      isDemo: Boolean(order.isDemo),
      notes: order.notes || '',
      assignedCity: order.assignedCity || '',
      estimatedDelivery: order.estimatedDelivery || null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async seedOrdersIfNeeded(): Promise<void> {
    try {
      const count = await Order.countDocuments();
      if (count === 0) {
        console.log('[OrderService] Seeding initial 5 admin orders...');
        const dummyUser = await User.findOne() || new mongoose.Types.ObjectId();
        const userId = (dummyUser as any)._id || dummyUser;
        const dummyProd = await Product.findOne() || new mongoose.Types.ObjectId();
        const prodId = (dummyProd as any)._id || dummyProd;

        const initialOrders = [
          {
            orderNumber: 'PC-20458',
            isDemo: true,
            user: userId,
            items: [{ product: prodId, name: 'UltraTech OPC 53 Grade', image: '/cements/ultratech-super-ppc.png', price: 425, quantity: 100, itemSubtotal: 42500 }],
            shippingAddress: { fullName: 'Ravi Kumar (RK Infra)', phone: '+91 98401 23456', addressLine1: 'Anna Nagar West', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040' },
            paymentMethod: 'online',
            paymentStatus: 'pending',
            orderStatus: 'pending',
            subtotal: 142500,
            shippingFee: 0,
            totalAmount: 142500,
          },
          {
            orderNumber: 'PC-20457',
            isDemo: true,
            user: userId,
            items: [{ product: prodId, name: 'Ramco Supergrade PPC', image: '/cements/ramco-supergrade.png', price: 390, quantity: 60, itemSubtotal: 23400 }],
            shippingAddress: { fullName: 'Sri Murugan Traders', phone: '+91 94432 34567', addressLine1: 'South Masi St', city: 'Madurai', state: 'Tamil Nadu', pincode: '625001' },
            paymentMethod: 'bank_transfer',
            paymentStatus: 'paid',
            orderStatus: 'dispatched',
            subtotal: 123400,
            shippingFee: 0,
            totalAmount: 123400,
          },
          {
            orderNumber: 'PC-20456',
            isDemo: true,
            user: userId,
            items: [{ product: prodId, name: 'Dalmia DSP Cement', image: '/cements/dalmia-dsp.png', price: 410, quantity: 200, itemSubtotal: 82000 }],
            shippingAddress: { fullName: 'Arun Builders', phone: '+91 98943 45678', addressLine1: 'Avinashi Road', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641018' },
            paymentMethod: 'online',
            paymentStatus: 'paid',
            orderStatus: 'delivered',
            subtotal: 179000,
            shippingFee: 0,
            totalAmount: 179000,
          },
          {
            orderNumber: 'PC-20455',
            isDemo: true,
            user: userId,
            items: [{ product: prodId, name: 'JSW Concreel HD PPC', image: '/cements/jsw-concreel-hd.png', price: 400, quantity: 80, itemSubtotal: 32000 }],
            shippingAddress: { fullName: 'Vel Hardware & Cements', phone: '+91 97894 56789', addressLine1: 'Thillai Nagar', city: 'Trichy', state: 'Tamil Nadu', pincode: '620018' },
            paymentMethod: 'online',
            paymentStatus: 'paid',
            orderStatus: 'delivered',
            subtotal: 131200,
            shippingFee: 0,
            totalAmount: 131200,
          },
          {
            orderNumber: 'PC-20454',
            isDemo: true,
            user: userId,
            items: [{ product: prodId, name: 'Zuari OPC 53 Grade', image: '/cements/zuari-ppc.png', price: 415, quantity: 150, itemSubtotal: 62250 }],
            shippingAddress: { fullName: 'Kaveri Constructions', phone: '+91 98425 67890', addressLine1: 'Fairlands', city: 'Salem', state: 'Tamil Nadu', pincode: '636016' },
            paymentMethod: 'cod',
            paymentStatus: 'pending',
            orderStatus: 'pending',
            subtotal: 160750,
            shippingFee: 0,
            totalAmount: 160750,
          },
        ];

        await Order.insertMany(initialOrders);
        console.log('[OrderService] Initial 5 admin orders seeded successfully.');
      }
    } catch (err: any) {
      console.error('[OrderService] Seeding error:', err.message);
    }
  }

  async createOrder(userId: string, dto: any): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw createHttpError(401, 'Please sign in again to place your order.');
    }

    // Only full payment online is offered: no cash on delivery and no partial / advance payment
    if (dto.paymentMethod === 'cod') {
      throw createHttpError(400, 'Cash on delivery is not available. Please pay online.');
    }
    if (dto.paymentStatus === 'partial') {
      throw createHttpError(400, 'Advance payment is not available. Please pay the full amount.');
    }

    // 1) Delivery city must be one we serve; it decides which agent gets the order
    const city = await cityService.findActiveCity(dto.shippingAddress?.city);
    if (!city) {
      throw createHttpError(400, 'Please choose a delivery city from the list.');
    }
    const lat = Number(dto.shippingAddress?.latitude);
    const lon = Number(dto.shippingAddress?.longitude);
    const shippingAddress = {
      fullName: String(dto.shippingAddress.fullName || '').trim(),
      phone: String(dto.shippingAddress.phone || '').trim(),
      addressLine1: String(dto.shippingAddress.addressLine1 || '').trim(),
      addressLine2: dto.shippingAddress.addressLine2 ? String(dto.shippingAddress.addressLine2).trim() : undefined,
      city: city.name,
      state: city.state || 'Tamil Nadu',
      pincode: String(dto.shippingAddress.pincode || '').trim(),
      ...(Number.isFinite(lat) && Number.isFinite(lon) ? { latitude: lat, longitude: lon } : {}),
    };

    // 2) Resolve items: from the request (mobile checkout) or the user's server-side cart
    const requested: { productDoc: any; quantity: number }[] = [];
    let cartToClear: any = null;

    if (Array.isArray(dto.items) && dto.items.length > 0) {
      for (const item of dto.items) {
        const qty = Math.floor(Number(item.quantity));
        if (!Number.isFinite(qty) || qty < 1) {
          throw createHttpError(400, `Invalid quantity for '${item.name || 'an item'}'.`);
        }
        // Resolve the real product (by id, else exact case-insensitive name)
        const rawId = item.productId || item.product;
        let productDoc: any = mongoose.Types.ObjectId.isValid(rawId) ? await Product.findById(rawId) : null;
        if (!productDoc && item.name) {
          const escapedName = String(item.name).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          productDoc = await Product.findOne({ name: new RegExp('^' + escapedName + '$', 'i') });
        }
        if (!productDoc) {
          throw createHttpError(400, `'${item.name || 'This product'}' is no longer available.`);
        }
        requested.push({ productDoc, quantity: qty });
      }
    } else {
      const cart = await Cart.findOne({ user: userId }).populate({ path: 'items.product' });
      for (const item of cart?.items || []) {
        if (item.product) requested.push({ productDoc: item.product, quantity: Number(item.quantity) || 1 });
      }
      cartToClear = cart;
    }
    if (requested.length === 0) {
      throw createHttpError(400, 'Your cart is empty.');
    }

    // 3) Availability check (clear message per product)
    for (const { productDoc, quantity } of requested) {
      const availableStock = Number(productDoc.stock) || 0;
      if (productDoc.status !== 'active' || availableStock <= 0) {
        throw createHttpError(409, `'${productDoc.name}' is out of stock. Please remove it from your cart.`);
      }
      if (quantity > availableStock) {
        throw createHttpError(409, `Only ${availableStock} bags of '${productDoc.name}' are available.`);
      }
    }

    // 4) Reserve stock atomically so two simultaneous orders can't oversell; undo on any failure
    const reserved: { id: any; quantity: number }[] = [];
    const releaseReserved = async () => {
      for (const r of reserved) {
        await Product.updateOne({ _id: r.id }, { $inc: { stock: r.quantity } }).catch(() => undefined);
      }
    };
    for (const { productDoc, quantity } of requested) {
      const result = await Product.updateOne(
        { _id: productDoc._id, status: 'active', stock: { $gte: quantity } },
        { $inc: { stock: -quantity } }
      );
      if (result.modifiedCount !== 1) {
        await releaseReserved();
        throw createHttpError(409, `'${productDoc.name}' just sold out. Please update your cart.`);
      }
      reserved.push({ id: productDoc._id, quantity });
    }

    try {
      // Prices always come from the product record, never from the client
      const orderItems = requested.map(({ productDoc, quantity }) => {
        const price = Number(productDoc.price) || 0;
        return {
          product: productDoc._id,
          name: productDoc.name,
          image: productDoc.image || (productDoc.images && productDoc.images[0]) || '/cements/ultratech-super-ppc.png',
          price,
          quantity,
          itemSubtotal: price * quantity,
        };
      });
      const subtotal = orderItems.reduce((sum, i) => sum + i.itemSubtotal, 0);
      const totalBags = orderItems.reduce((sum, i) => sum + i.quantity, 0);
      const shippingFee = 0;
      const totalAmount = subtotal + shippingFee;

      const agent = await this.findAgentForCity(city.name, city.aliases);

      const paymentStatus = 'paid';

      const newOrder = await Order.create({
        orderNumber: await this.generateOrderNumber(),
        user: userId,
        items: orderItems,
        shippingAddress,
        paymentMethod: dto.paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'online',
        paymentStatus,
        orderStatus: 'pending',
        subtotal,
        shippingFee,
        totalAmount,
        notes: dto.notes,
        assignedCity: city.name,
        assignedAgent: agent?._id,
        dispatchStatus: agent ? 'assigned_to_agent' : 'pending_dispatch',
      });

      if (cartToClear) {
        cartToClear.items = [] as any;
        await cartToClear.save();
      }

      // 5) Commission for the city's agent, at the admin-configured rate
      if (agent) {
        try {
          const settings = await settingsService.getCommissionSettings();
          const customerName = shippingAddress.fullName || 'Customer';
          await Commission.create({
            agentId: agent._id,
            customerName,
            initials: customerName.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'CU',
            orderId: newOrder.orderNumber,
            orderAmount: totalAmount,
            commissionType: settings.type,
            commissionRate: settings.value,
            totalBags,
            commissionEarned: settingsService.calculateCommission(settings, totalAmount, totalBags),
            status: 'Pending',
          });
        } catch (commErr: any) {
          console.error('[OrderService] Commission creation failed for', newOrder.orderNumber, commErr.message);
        }
      }

      return {
        ...this.sanitizeOrder(newOrder),
        assignedCity: city.name,
        assignedAgentName: agent?.fullName || null,
      };
    } catch (err) {
      await releaseReserved();
      throw err;
    }
  }

  /**
   * The agent covering a city (matched on the city name or its aliases). Each city has one agent;
   * if older data still has several, the earliest-created agent is used so routing stays predictable.
   */
  private async findAgentForCity(cityName: string, aliases: string[] = []): Promise<any | null> {
    const names = [cityName, ...aliases].map((n) => new RegExp('^' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'));
    return User.findOne({ role: 'agent', city: { $in: names } }).sort({ createdAt: 1 });
  }

  private async generateOrderNumber(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `PC-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
      if (!(await Order.exists({ orderNumber: candidate }))) return candidate;
    }
    return `PC-${new mongoose.Types.ObjectId().toString().slice(-10).toUpperCase()}`;
  }

  async getUserOrders(userId: string): Promise<any[]> {
    // Only return real orders placed by users, never demo seeded orders
    const query: any = { isDemo: { $ne: true } };
    if (mongoose.Types.ObjectId.isValid(userId)) {
      query.user = userId;
    }
    const orders = await Order.find(query).sort({ createdAt: -1 });
    return orders.map((o) => this.sanitizeOrder(o));
  }

  async getOrderById(orderId: string, userId?: string, isAdmin: boolean = false): Promise<any | null> {
    const order = mongoose.Types.ObjectId.isValid(orderId)
      ? await Order.findById(orderId).populate('user', 'fullName email phone')
      : await Order.findOne({ orderNumber: orderId }).populate('user', 'fullName email phone');

    if (!order) return null;
    return this.sanitizeOrder(order);
  }

  async cancelOrder(userId: string, orderId: string): Promise<any> {
    const order = mongoose.Types.ObjectId.isValid(orderId) ? await Order.findById(orderId) : null;
    if (!order || order.user?.toString() !== String(userId)) {
      throw createHttpError(404, 'Order not found.');
    }
    if (order.orderStatus === 'cancelled') {
      throw createHttpError(400, 'This order is already cancelled.');
    }
    if (order.orderStatus === 'delivered' || order.orderStatus === 'dispatched') {
      throw createHttpError(400, 'This order has already been dispatched and can no longer be cancelled.');
    }

    order.orderStatus = 'cancelled';
    await order.save();
    await this.handleCancellation(order);

    return this.sanitizeOrder(order);
  }

  /**
   * Side effects of an order becoming cancelled: put the stock back and drop the agent's unpaid commission.
   * Call only when the status changes to cancelled, so stock is restored once.
   */
  private async handleCancellation(order: any): Promise<void> {
    try {
      await Commission.deleteMany({ orderId: order.orderNumber, status: 'Pending' });
    } catch (commErr: any) {
      console.error('[OrderService] Commission removal error:', commErr.message);
    }

    // Restore product stock when order is cancelled
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        try {
          let productDoc: any = null;
          if (item.product && mongoose.Types.ObjectId.isValid(item.product)) {
            productDoc = await Product.findById(item.product);
          }
          if (!productDoc && item.name) {
            const rawName = String(item.name).trim();
            productDoc = await Product.findOne({ name: { $regex: new RegExp(rawName.split(' ')[0], 'i') } });
          }
          if (productDoc) {
            const qty = Math.abs(Number(item.quantity) || 1);
            productDoc.stock = (Number(productDoc.stock) || 0) + qty;
            await productDoc.save();
            console.log('[OrderService] Restored stock for cancelled order ' + productDoc.name + ': +' + qty + ' bags');
          }
        } catch (restErr: any) {
          console.error('[OrderService] Stock restoration error:', restErr.message);
        }
      }
    }
  }

  async getAdminOrders(statusFilter?: string): Promise<any[]> {
    const filter: any = {};
    if (statusFilter && statusFilter !== 'All') {
      filter.orderStatus = statusFilter.toLowerCase();
    }

    const orders = await Order.find(filter).populate('user', 'fullName email phone').sort({ createdAt: -1 });
    return orders.map((o) => this.sanitizeOrder(o));
  }

  async updateOrderStatus(orderId: string, dto: any): Promise<any | null> {
    const order = mongoose.Types.ObjectId.isValid(orderId)
      ? await Order.findById(orderId)
      : await Order.findOne({ orderNumber: orderId });

    if (!order) return null;

    const wasCancelled = order.orderStatus === 'cancelled';
    const rawStatus = (dto.status || dto.orderStatus || '').toLowerCase();
    // A cancelled order's stock and commission are already released, so it can't be reopened
    if (wasCancelled && rawStatus && rawStatus !== 'cancelled') {
      throw createHttpError(400, 'Cancelled orders cannot be reopened. Ask the customer to place a new order.');
    }
    if (rawStatus) {
      if (['pending', 'processing', 'dispatched', 'delivered', 'cancelled'].includes(rawStatus)) {
        order.orderStatus = rawStatus as any;
      }
    }
    if (dto.paymentStatus) {
      order.paymentStatus = dto.paymentStatus;
    }
    // Estimated delivery date: ISO date string to set, '' or null to clear
    if (dto.estimatedDelivery !== undefined) {
      if (!dto.estimatedDelivery) {
        order.estimatedDelivery = null;
      } else {
        const eta = new Date(dto.estimatedDelivery);
        if (isNaN(eta.getTime())) {
          throw createHttpError(400, 'Estimated delivery must be a valid date.');
        }
        order.estimatedDelivery = eta;
      }
    }

    await order.save();
    if (!wasCancelled && order.orderStatus === 'cancelled') {
      await this.handleCancellation(order);
    }
    return this.sanitizeOrder(order);
  }
}

export const orderService = new OrderService();
