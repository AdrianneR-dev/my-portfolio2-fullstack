import mongoose from 'mongoose';
import { generateId } from '../utils/customId.js';

const { Schema } = mongoose;

const projectSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => generateId('prj'),
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    url: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: 'A project can have at most 20 tags.',
      },
    },
    featured: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    _id: false, // we manage _id ourselves (string custom ID above)
  }
);

projectSchema.index({ featured: 1, order: 1 });

export const Project = mongoose.model('Project', projectSchema);
