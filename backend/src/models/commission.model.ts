import mongoose, { Schema, Document } from 'mongoose';

export interface ICommission extends Document {
  _id: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  customerName: string;
  initials: string;
  orderId?: string;
  orderAmount: number;
  commissionType: 'percent' | 'per_bag';
  commissionRate: number; // percent (e.g. 2 for 2%) or amount per bag, depending on commissionType
  totalBags?: number;
  commissionEarned: number;
  status: 'Paid' | 'Pending';
  paidAt?: Date;
  withdrawalId?: mongoose.Types.ObjectId | null; // set while included in a withdrawal request
  createdAt: Date;
  updatedAt: Date;
}

const commissionSchema = new Schema<ICommission>(
  {
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    initials: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: 'CU',
    },
    orderId: {
      type: String,
      trim: true,
      default: '',
    },
    orderAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionType: {
      type: String,
      enum: ['percent', 'per_bag'],
      default: 'percent',
    },
    totalBags: {
      type: Number,
      min: 0,
    },
    commissionRate: {
      type: Number,
      required: true,
      default: 2, // 2% Commission
    },
    commissionEarned: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Pending',
      index: true,
    },
    paidAt: {
      type: Date,
    },
    withdrawalId: {
      type: Schema.Types.ObjectId,
      ref: 'Withdrawal',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Commission = mongoose.model<ICommission>('Commission', commissionSchema);
