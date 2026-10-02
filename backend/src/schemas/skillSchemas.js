import { z } from 'zod';
import { SKILL_CATEGORIES, SKILL_LEVELS } from '../models/Skill.js';

export const createSkillSchema = z.object({
  name: z.string().trim().min(1).max(60),
  category: z.enum(SKILL_CATEGORIES).optional(),
  level: z.enum(SKILL_LEVELS).optional(),
  order: z.number().int().optional(),
});

export const updateSkillSchema = createSkillSchema.partial();

export const listSkillsQuerySchema = z.object({
  search: z.string().trim().max(60).optional(),
  sort: z.enum(['name', 'category', 'level', 'order']).optional().default('order'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});
