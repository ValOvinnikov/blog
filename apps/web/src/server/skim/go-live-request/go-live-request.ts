import { z } from 'zod';

export const goLiveRequestSchema = z.object({
  tenantId: z.uuid(),
  postId: z.string().min(1),
  publishedAt: z.string().min(1),
});

export type TGoLiveRequest = z.infer<typeof goLiveRequestSchema>;
