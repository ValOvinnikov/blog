import { z } from 'zod';

export const teamInviteInputSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

export type TTeamInviteInput = z.input<typeof teamInviteInputSchema>;

export const teamTargetIdSchema = z.uuid();
