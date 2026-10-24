import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  _id: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  customerName: string;
  phoneNumber: string;
  location: string;
  interestedProduct: string;
  expectedQuantity: string;
  status: 'New Lead' | 'Contacted' | 'Negotiating' | 'Converted' | 'Lost';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
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
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      default: 'Chennai',
    },
    interestedProduct: {
      type: String,
      required: [true, 'Interested product is required'],
      trim: true,
      default: 'UltraTech OPC 53 Grade',
    },
    expectedQuantity: {
      type: String,
      required: [true, 'Expected quantity is required'],
      trim: true,
      default: '100 bags',
    },
    status: {
      type: String,
      enum: ['New Lead', 'Contacted', 'Negotiating', 'Converted', 'Lost'],
      default: 'New Lead',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
