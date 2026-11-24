import 'server-only';

import { sendMagicLinkEmail } from '@platform/server/auth/send-magic-link-email';
import { adminRoutes } from '@platform/utils/routes/routes';
import { queries } from '@shinefold/db';

export const sendAdminInviteEmail = (
  inviteId: string,
  email: string,
  failureEvent: string,
): Promise<boolean> =>
  sendMagicLinkEmail({
    email,
    redirectTo: adminRoutes.tenants(),
    failureEvent,
    logContext: { inviteId },
  });

export const sendAdminInviteOrCancel = async (
  inviteId: string,
  email: string,
  failureEvent: string,
): Promise<boolean> => {
  if (await sendAdminInviteEmail(inviteId, email, failureEvent)) return true;

  await queries.adminInvites.cancelAdminInvite(inviteId);
  return false;
};
