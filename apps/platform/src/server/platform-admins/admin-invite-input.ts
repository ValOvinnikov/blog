import { INVITABLE_ADMIN_ROLE } from '@platform/constants/platform-admins';
import { inviteEmailSchema } from '@platform/utils/invite-email-schema/invite-email-schema';
import { z } from 'zod';

export const adminInviteInputSchema = z.object({
  email: inviteEmailSchema,
  role: z.enum(INVITABLE_ADMIN_ROLE),
});

export type TAdminInviteInput = z.input<typeof adminInviteInputSchema>;

export const platformAdminTargetIdSchema = z.uuid();
