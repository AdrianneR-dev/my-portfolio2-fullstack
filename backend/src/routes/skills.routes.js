import { Router } from 'express';
import { Skill } from '../models/Skill.js';
import { createSkillSchema, updateSkillSchema, listSkillsQuerySchema } from '../schemas/skillSchemas.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// --- Public: searchable + sortable ---
router.get('/', validate(listSkillsQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { search, sort, order } = req.query;

    const filter = search
      ? { name: { $regex: escapeRegex(search), $options: 'i' } }
      : {};

    const sortDir = order === 'desc' ? -1 : 1;
    const sortSpec = { [sort]: sortDir, name: 1 }; // name as stable tiebreaker

    const skills = await Skill.find(filter).sort(sortSpec).lean();
    res.json(skills);
  } catch (err) {
    next(err);
  }
});

// --- Admin only ---
router.post('/', requireAuth, requireAdmin, validate(createSkillSchema), async (req, res, next) => {
  try {
    const skill = await Skill.create(req.body);
    res.status(201).json(skill);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, requireAdmin, validate(updateSkillSchema), async (req, res, next) => {
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!skill) return res.status(404).json({ error: 'NotFound' });
    res.json(skill);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);
    if (!skill) return res.status(404).json({ error: 'NotFound' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default router;
