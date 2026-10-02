import { z } from 'zod';

export const likeSchema = z.object({
  visitorId: z.string().trim().min(8).max(100),
});
