import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  name: string;
  initials: string;
  mode: string;
  date: string;
  amount: string;
  numericAmount: number;
  status: 'Paid' | 'Pending' | 'Failed';
  referenceId?: string;
  orderCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    name: { type: String, required: true, trim: true },
    initials: { type: String, required: true, trim: true },
    mode: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    amount: { type: String, required: true, trim: true },
    numericAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Pending', index: true },
    referenceId: { type: String, trim: true },
    orderCode: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
