import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  url: z.string().trim().url().max(500).optional().or(z.literal('')),
  imageUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
  tags: z.array(z.string().trim().min(1).max(30)).max(20).optional(),
  featured: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();
