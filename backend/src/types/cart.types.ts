import { ProductResponse } from './product.types';

export interface CartItemResponse {
  id: string;
  product: ProductResponse | string;
  quantity: number;
  price: number;
  itemSubtotal: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartResponse {
  cartId: string;
  userId: string;
  items: CartItemResponse[];
  totalQuantity: number;
  subtotal: number;
  totalAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddToCartDto {
  productId?: string;
  quantity?: number;
}

export interface UpdateCartItemDto {
  quantity?: number;
}
