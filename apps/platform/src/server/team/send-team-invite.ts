import 'server-only';

import { TEAM_ACCESS_LOG } from '@platform/constants/team-access';
import { sendOwnerInviteEmail } from '@platform/server/tenants/send-owner-invite-email';
import { queries } from '@shinefold/db';

/** Cancels the invite when its email does not go out, so the next try creates and sends a fresh one. */
export const sendTeamInviteOrCancel = async (
  tenantId: string,
  inviteId: string,
  email: string,
): Promise<boolean> => {
  if (
    await sendOwnerInviteEmail(
      tenantId,
      email,
      TEAM_ACCESS_LOG.INVITE_EMAIL_FAILED,
    )
  ) {
    return true;
  }
  await queries.membershipInvites.cancelMembershipInvite(tenantId, inviteId);
  return false;
};
