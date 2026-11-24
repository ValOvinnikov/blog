import { inviteEmailSchema } from '@platform/utils/invite-email-schema/invite-email-schema';
import { z } from 'zod';

export const teamInviteInputSchema = z.object({
  email: inviteEmailSchema,
});

export type TTeamInviteInput = z.input<typeof teamInviteInputSchema>;

export const teamTargetIdSchema = z.uuid();
