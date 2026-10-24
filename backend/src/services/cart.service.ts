import { User } from '../models/user.model';
import mongoose from 'mongoose';
import { Cart, ICart } from '../models/cart.model';
import { Product } from '../models/product.model';
import { productService } from './product.service';
import { CartResponse, CartItemResponse } from '../types/cart.types';

export class CartService {
  /**
   * Helper to resolve a valid MongoDB ObjectId for the user (supporting dev fallback)
   */
  async resolveUserId(userId?: string): Promise<mongoose.Types.ObjectId> {
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      return new mongoose.Types.ObjectId(userId);
    }
    const defaultUser = await User.findOne({ role: 'user' });
    if (defaultUser) return defaultUser._id as mongoose.Types.ObjectId;
    const anyUser = await User.findOne();
    if (anyUser) return anyUser._id as mongoose.Types.ObjectId;
    return new mongoose.Types.ObjectId();
  }

  /**
   * Calculate subtotals and format Cart document into clean response object
   */
  async formatCartResponse(cart: ICart): Promise<CartResponse> {
    // Populate items.product and nested category
    await cart.populate({
      path: 'items.product',
      populate: { path: 'category' },
    });

    const formattedItems: CartItemResponse[] = [];
    let subtotal = 0;
    let totalQuantity = 0;

    for (const item of cart.items) {
      // Check if product was deleted or exists
      if (!item.product || typeof item.product !== 'object') {
        continue;
      }

      const productObj = item.product;
      const sanitizedProduct = productService.sanitizeProduct(productObj);
      const itemPrice = item.price !== undefined ? item.price : productObj.price;
      const itemSubtotal = itemPrice * item.quantity;

      subtotal += itemSubtotal;
      totalQuantity += item.quantity;

      formattedItems.push({
        id: item._id.toString(),
        product: sanitizedProduct,
        quantity: item.quantity,
        price: itemPrice,
        itemSubtotal,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    }

    return {
      cartId: cart._id.toString(),
      userId: cart.user.toString(),
      items: formattedItems,
      totalQuantity,
      subtotal,
      totalAmount: subtotal,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  /**
   * Get or initialize active cart for a specific user
   */
  async getCartByUserId(userId: string): Promise<CartResponse> {
    const validId = await this.resolveUserId(userId);
    let cart = await Cart.findOne({ user: validId });
    if (!cart) {
      cart = await Cart.create({
        user: validId,
        items: [],
      });
    }

    return this.formatCartResponse(cart);
  }

  /**
   * Add a product to the user's cart (or increment quantity if already present)
   */
  async addItemToCart(userId: string, productId: string, quantity: number): Promise<CartResponse> {
    const validId = await this.resolveUserId(userId);
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const error: any = new Error('Invalid Product ID format.');
      error.statusCode = 400;
      throw error;
    }
    if (!quantity || isNaN(quantity) || quantity < 1) {
      const error: any = new Error('Quantity must be a positive number greater than 0.');
      error.statusCode = 400;
      throw error;
    }

    // 1. Verify product exists and is active
    const product = await Product.findById(productId);
    if (!product) {
      const error: any = new Error('Product not found.');
      error.statusCode = 404;
      throw error;
    }

    if (product.status !== 'active') {
      const error: any = new Error('This product is currently inactive and cannot be added to cart.');
      error.statusCode = 400;
      throw error;
    }

    // 2. Fetch or create user cart
    let cart = await Cart.findOne({ user: validId });
    if (!cart) {
      cart = new Cart({
        user: validId,
        items: [],
      });
    }

    // 3. Check if product already exists in cart items
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    let targetQuantity = quantity;
    if (existingItemIndex > -1) {
      targetQuantity = cart.items[existingItemIndex].quantity + quantity;
    }

    // 4. Verify product stock availability
    if (product.stock < targetQuantity) {
      const error: any = new Error(
        `Insufficient stock. Available stock for '${product.name}' is ${product.stock}, but requested quantity is ${targetQuantity}.`
      );
      error.statusCode = 409;
      throw error;
    }

    // 5. Add or update cart item
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity = targetQuantity;
      cart.items[existingItemIndex].price = product.price; // Update to current DB price
    } else {
      cart.items.push({
        _id: new mongoose.Types.ObjectId(),
        product: new mongoose.Types.ObjectId(productId),
        quantity,
        price: product.price,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    }

    await cart.save();
    return this.formatCartResponse(cart);
  }

  /**
   * Update the quantity of a specific cart item
   */
  async updateCartItemQuantity(userId: string, itemId: string, quantity: number): Promise<CartResponse> {
    const validId = await this.resolveUserId(userId);
    if (!quantity || isNaN(quantity) || quantity < 1) {
      const error: any = new Error('Quantity must be a positive number greater than 0.');
      error.statusCode = 400;
      throw error;
    }

    const cart = await Cart.findOne({ user: validId });
    if (!cart) {
      const error: any = new Error('Cart not found for user.');
      error.statusCode = 404;
      throw error;
    }

    // Find item by item _id or product _id
    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId || item.product.toString() === itemId
    );

    if (itemIndex === -1) {
      const error: any = new Error('Item not found in user cart.');
      error.statusCode = 404;
      throw error;
    }

    const item = cart.items[itemIndex];
    const productId = item.product.toString();

    // Verify product exists and check stock
    const product = await Product.findById(productId);
    if (!product) {
      const error: any = new Error('Associated product no longer exists.');
      error.statusCode = 404;
      throw error;
    }

    if (product.status !== 'active') {
      const error: any = new Error(`Product '${product.name}' is inactive.`);
      error.statusCode = 400;
      throw error;
    }

    if (product.stock < quantity) {
      const error: any = new Error(
        `Insufficient stock for '${product.name}'. Available stock is ${product.stock}, but requested quantity is ${quantity}.`
      );
      error.statusCode = 409;
      throw error;
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.price; // Refresh price from DB

    await cart.save();
    return this.formatCartResponse(cart);
  }

  /**
   * Remove a specific item from the user's cart
   */
  async removeCartItem(userId: string, itemId: string): Promise<CartResponse> {
    const validId = await this.resolveUserId(userId);
    const cart = await Cart.findOne({ user: validId });
    if (!cart) {
      const error: any = new Error('Cart not found for user.');
      error.statusCode = 404;
      throw error;
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item._id.toString() !== itemId && item.product.toString() !== itemId
    ) as any;

    if (cart.items.length === initialLength) {
      const error: any = new Error('Cart item not found.');
      error.statusCode = 404;
      throw error;
    }

    await cart.save();
    return this.formatCartResponse(cart);
  }

  /**
   * Clear all items from the user's cart
   */
  async clearCart(userId: string): Promise<CartResponse> {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
      });
    } else {
      cart.items = [] as any;
    }

    await cart.save();
    return this.formatCartResponse(cart);
  }
}

export const cartService = new CartService();
