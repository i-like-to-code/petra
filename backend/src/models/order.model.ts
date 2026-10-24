import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  product: mongoose.Types.ObjectId | any;
  name: string;
  image: string;
  price: number;
  quantity: number;
  itemSubtotal: number;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentMethod: 'cod' | 'online' | 'bank_transfer';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'failed';
  orderStatus: 'pending' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  isDemo?: boolean;
  notes?: string;
  assignedAgent?: mongoose.Types.ObjectId;
  assignedCity?: string;
  estimatedDelivery?: Date | null; // set by admin; shown to the customer as the estimated arrival
  dispatchStatus?: 'pending_dispatch' | 'assigned_to_agent' | 'accepted_by_agent' | 'out_for_delivery' | 'delivered';
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Product name snapshot is required'],
    },
    image: {
      type: String,
      required: [true, 'Product image snapshot is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product price snapshot is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    itemSubtotal: {
      type: Number,
      required: [true, 'Item subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
    },
  },
  { _id: true }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    // Delivery location picked via OpenStreetMap / GPS, when available
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (val: IOrderItem[]) {
          return Array.isArray(val) && val.length > 0;
        },
        message: 'Order must contain at least one item.',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, 'Shipping address is required'],
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'online', 'bank_transfer'],
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'failed'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'dispatched', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    isDemo: {
      type: Boolean,
      default: false,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    assignedAgent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedCity: {
      type: String,
      trim: true,
      index: true,
    },
    estimatedDelivery: {
      type: Date,
      default: null,
    },
    dispatchStatus: {
      type: String,
      enum: ['pending_dispatch', 'assigned_to_agent', 'accepted_by_agent', 'out_for_delivery', 'delivered'],
      default: 'pending_dispatch',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
