import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'user' | 'agent' | 'admin';
  city?: string;
  agentRole?: string;
  status?: 'Active On Site' | 'In Transit' | 'Client Meeting' | 'Offline';
  currentSite?: string;
  dailyVisits?: number;
  rating?: number;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ['user', 'agent', 'admin'],
      default: 'user',
      index: true,
    },
    city: {
      type: String,
      trim: true,
      default: 'Chennai',
    },
    agentRole: {
      type: String,
      trim: true,
      default: 'Field Sales Agent',
    },
    status: {
      type: String,
      enum: ['Active On Site', 'In Transit', 'Client Meeting', 'Offline'],
      default: 'Active On Site',
    },
    currentSite: {
      type: String,
      trim: true,
      default: 'Metro Rail Extension Site',
    },
    dailyVisits: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5,
    },
    avatar: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
