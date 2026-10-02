import { z } from 'zod';

export const createMessageSchema = z.object({
  name: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(1000),
});
