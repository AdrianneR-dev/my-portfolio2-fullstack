import mongoose from 'mongoose';
import { generateId } from '../utils/customId.js';

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => generateId('msg'),
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 80,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000,
    },
    // Best-effort visitor attribution for moderation, not exposed to other visitors.
    ip: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

messageSchema.index({ createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);
