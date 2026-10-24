import mongoose, { Schema, Document } from 'mongoose';

// An agent's request to be paid out the commission they have earned on delivered orders
export interface IWithdrawal extends Document {
  _id: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  amount: number;
  commissionIds: mongoose.Types.ObjectId[]; // commissions covered by this request (locked while pending)
  status: 'Pending' | 'Approved' | 'Rejected';
  payoutReference?: string; // e.g. UPI / bank transaction ID entered by the admin
  adminNote?: string; // shown to the agent, e.g. a rejection reason
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalSchema = new Schema<IWithdrawal>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    commissionIds: [{ type: Schema.Types.ObjectId, ref: 'Commission' }],
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
    payoutReference: { type: String, trim: true, default: '' },
    adminNote: { type: String, trim: true, default: '' },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

export const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema);
