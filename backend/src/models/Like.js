import mongoose from 'mongoose';
import { generateId } from '../utils/customId.js';

const { Schema } = mongoose;

const likeSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => generateId('lik'),
    },
    projectId: {
      type: String,
      ref: 'Project',
      required: true,
    },
    // Anonymous per-browser identifier (a UUID the frontend generates once and
    // stores in localStorage). Not personally identifying on its own.
    visitorId: {
      type: String,
      required: true,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

// THE race-proofing mechanism: MongoDB enforces this uniqueness constraint
// atomically at the storage-engine level, so two concurrent requests from the
// same visitor for the same project can never both succeed — one insert wins,
// the other fails with a duplicate-key error (E11000), which the route
// handler treats as "already liked" rather than a server error. This is safe
// under real concurrency in a way that a "read count, check, then write"
// pattern in application code is not.
likeSchema.index({ projectId: 1, visitorId: 1 }, { unique: true });

export const Like = mongoose.model('Like', likeSchema);
