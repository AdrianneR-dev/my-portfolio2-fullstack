import { Router } from 'express';
import { Message } from '../models/Message.js';
import { createMessageSchema } from '../schemas/messageSchemas.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(200).lean();
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

router.post('/', writeLimiter, validate(createMessageSchema), async (req, res, next) => {
  try {
    const message = await Message.create({
      ...req.body,
      ip: req.ip,
    });
    // Never echo back the stored IP to any client, admin included, via this response.
    const { ip, ...safe } = message.toObject();
    res.status(201).json(safe);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ error: 'NotFound' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
