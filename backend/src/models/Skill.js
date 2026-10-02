import mongoose from 'mongoose';
import { generateId } from '../utils/customId.js';

const { Schema } = mongoose;

export const SKILL_CATEGORIES = ['Languages', 'Frameworks & Libs', 'Tools & Clouds', 'Other'];
export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

const skillSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => generateId('skl'),
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 60,
    },
    category: {
      type: String,
      required: true,
      enum: SKILL_CATEGORIES,
      default: 'Other',
    },
    level: {
      type: String,
      enum: SKILL_LEVELS,
      default: 'intermediate',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

// Text index for search; regular index for sort-by-category/level/name.
skillSchema.index({ name: 'text' });
skillSchema.index({ category: 1, order: 1 });

export const Skill = mongoose.model('Skill', skillSchema);
