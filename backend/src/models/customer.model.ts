import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  initials: string;
  company?: string;
  location: string;
  phone?: string;
  email?: string;
  ordersCount: number;
  spent: string;
  numericSpent: number;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    initials: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    location: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    ordersCount: { type: Number, default: 0 },
    spent: { type: String, default: '₹0' },
    numericSpent: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
  },
  { timestamps: true }
);

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
