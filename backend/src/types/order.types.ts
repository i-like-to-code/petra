import { IShippingAddress } from '../models/order.model';

export interface OrderItemResponse {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  itemSubtotal: number;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItemResponse[];
  shippingAddress: IShippingAddress;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderDto {
  shippingAddress: IShippingAddress;
  paymentMethod?: 'cod' | 'online' | 'bank_transfer';
  notes?: string;
}

export interface UpdateOrderStatusDto {
  orderStatus?: 'pending' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed';
}
