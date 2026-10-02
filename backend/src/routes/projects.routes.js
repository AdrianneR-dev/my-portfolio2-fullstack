import { Router } from 'express';
import { Project } from '../models/Project.js';
import { Like } from '../models/Like.js';
import { createProjectSchema, updateProjectSchema } from '../schemas/projectSchemas.js';
import { likeSchema } from '../schemas/likeSchemas.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiters.js';

const router = Router();

// --- Public ---

router.get('/', async (req, res, next) => {
  try {
    const projects = await Project.find().sort({ order: 1, createdAt: -1 }).lean();
    const counts = await Like.aggregate([{ $group: { _id: '$projectId', count: { $sum: 1 } } }]);
    const countMap = new Map(counts.map((c) => [c._id, c.count]));

    res.json(
      projects.map((p) => ({ ...p, likeCount: countMap.get(p._id) || 0 }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ error: 'NotFound' });
    const likeCount = await Like.countDocuments({ projectId: project._id });
    res.json({ ...project, likeCount });
  } catch (err) {
    next(err);
  }
});

// Race-proof like/endorsement: uniqueness is enforced by the database index on
// (projectId, visitorId), not by an application-level "check then write", so
// two simultaneous requests from the same visitor can never both succeed.
router.post('/:id/like', writeLimiter, validate(likeSchema), async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ error: 'NotFound' });

    try {
      await Like.create({ projectId: req.params.id, visitorId: req.body.visitorId });
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key = this visitor already liked this project. Not an
        // error from the caller's point of view — just report current state.
        const likeCount = await Like.countDocuments({ projectId: req.params.id });
        return res.status(200).json({ liked: true, alreadyLiked: true, likeCount });
      }
      throw err;
    }

    const likeCount = await Like.countDocuments({ projectId: req.params.id });
    res.status(201).json({ liked: true, alreadyLiked: false, likeCount });
  } catch (err) {
    next(err);
  }
});

// --- Admin only ---

router.post('/', requireAuth, requireAdmin, validate(createProjectSchema), async (req, res, next) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, requireAdmin, validate(updateProjectSchema), async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!project) return res.status(404).json({ error: 'NotFound' });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: 'NotFound' });
    await Like.deleteMany({ projectId: req.params.id });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
