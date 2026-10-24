import mongoose, { Schema, Document } from 'mongoose';

export interface IAgentLocation extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  totalAgents: number;
  activeAgents: number;
  isLive: boolean;
  pinX: number;
  pinY: number;
  createdAt: Date;
  updatedAt: Date;
}

const agentLocationSchema = new Schema<IAgentLocation>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    totalAgents: {
      type: Number,
      required: true,
      default: 0,
    },
    activeAgents: {
      type: Number,
      required: true,
      default: 0,
    },
    isLive: {
      type: Boolean,
      default: true,
    },
    pinX: {
      type: Number,
      required: true,
      default: 50,
    },
    pinY: {
      type: Number,
      required: true,
      default: 50,
    },
  },
  {
    timestamps: true,
  }
);

export const AgentLocation = mongoose.model<IAgentLocation>('AgentLocation', agentLocationSchema);
