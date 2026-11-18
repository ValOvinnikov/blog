import type { TMaybeNull } from '@shinefold/config/types';
import { sanitizeLogMessage } from '@shinefold/insight';
import { MEMBER_ACCESS_LOG } from '@worker/constants/member-access';
import { logger } from '@worker/utils/logger/logger';
import {
  deleteInvites,
  ensureViewerInvite,
  listPendingInvites,
} from '@worker/utils/studio-access/studio-invites';

import { recordMemberAccess } from './member-access-record';
import type { TMemberAccessTarget } from './member-access-target';

async function deleteMemberInvites(target: TMemberAccessTarget): Promise<void> {
  await deleteInvites(target, await listPendingInvites(target, target.email));
}

export async function deleteMemberInvitesAfterGrant(
  target: TMemberAccessTarget,
): Promise<void> {
  try {
    await deleteMemberInvites(target);
  } catch (error) {
    logger.error(MEMBER_ACCESS_LOG.INVITE_DELETE_FAILED, {
      tenantId: target.tenantId,
      membershipId: target.membershipId,
      error: sanitizeLogMessage(error),
    });
  }
}

// Resolves null when the membership was removed meanwhile; the invite it sent is withdrawn again.
export async function sendMemberInvite(
  target: TMemberAccessTarget,
  options: { replaceExisting: boolean },
): Promise<TMaybeNull<Date>> {
  const { inviteId, inviteSentAt } = await ensureViewerInvite(
    target,
    target.email,
    options,
  );
  const isRecorded = await recordMemberAccess(target, {
    sanityInviteId: inviteId,
    inviteSentAt,
    inviteAcceptedAt: null,
  });
  if (isRecorded) return inviteSentAt;

  await deleteMemberInvites(target);
  return null;
}
