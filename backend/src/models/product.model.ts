import mongoose, { Schema, Document } from 'mongoose';
import { ISpecs } from '../types/product.types';

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  subtitle?: string;
  brand: string;
  brandId: string;
  category?: mongoose.Types.ObjectId | string;
  images: string[];
  image?: string;
  shortDescription?: string;
  description?: string;
  price: number;
  stock: number;
  isFeatured: boolean;
  featured?: boolean;
  status: 'active' | 'inactive';
  specs?: ISpecs;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      default: 'UltraTech Cement',
      trim: true,
      index: true,
    },
    brandId: {
      type: String,
      default: 'ultratech',
      trim: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: false,
      index: true,
    },
    images: {
      type: [String],
      default: ['/cements/ultratech-super-ppc.png'],
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Available stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    specs: {
      packagingSize: { type: String, default: '50 kg' },
      type: { type: String, default: 'PPC' },
      packagingType: { type: String, default: 'HDPE Sack Bag' },
      brand: { type: String, default: 'UltraTech Cement' },
      usage: { type: String, default: 'Structural Concrete & RCC' },
      color: { type: String, default: 'Grey' },
      features: { type: String, default: 'Low risk of cracking' },
      compressiveStrength: { type: String, default: '33+ MPa at 28 days' },
      standard: { type: String, default: 'IS 1489 (Part 1)' }
    }
  },
  {
    timestamps: true,
  }
);

productSchema.virtual('image').get(function (this: IProduct) {
  return this.images && this.images.length > 0 ? this.images[0] : '';
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export const Product = mongoose.model<IProduct>('Product', productSchema);
