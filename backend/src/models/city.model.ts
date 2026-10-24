import mongoose, { Schema, Document } from 'mongoose';

export interface ICity extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  state: string;
  // Alternative spellings used when matching agents and map lookups (e.g. "Trichy" for Tiruchirappalli)
  aliases: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const citySchema = new Schema<ICity>(
  {
    name: {
      type: String,
      required: [true, 'City name is required'],
      unique: true,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      default: 'Tamil Nadu',
    },
    aliases: {
      type: [String],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const City = mongoose.model<ICity>('City', citySchema);
