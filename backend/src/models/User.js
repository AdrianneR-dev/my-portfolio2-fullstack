import mongoose from 'mongoose';
import { generateId } from '../utils/customId.js';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => generateId('usr'),
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default in queries
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

export const User = mongoose.model('User', userSchema);
