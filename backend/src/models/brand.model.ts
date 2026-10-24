import mongoose, { Schema, Document } from 'mongoose';

export interface IBrand extends Document {
  id: string;
  name: string;
  company: string;
  tagline: string;
  brandColor: string;
  bgLightColor: string;
  image: string;
  active: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema = new Schema<IBrand>(
  {
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, default: '' },
    tagline: { type: String, default: '' },
    brandColor: { type: String, default: '#dc2626' },
    bgLightColor: { type: String, default: '#fef2f2' },
    image: { type: String, default: '' },
    active: { type: Boolean, default: true, index: true },
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Brand = mongoose.model<IBrand>('Brand', brandSchema);
