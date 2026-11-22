import {
  getMemberStudioAccess,
  listLockedMembersWithStudioAccess,
  setMemberStudioAccess,
  type TLockedMemberWithStudioAccess,
  type TSetMemberStudioAccessInput,
} from '@shinefold/db/queries/memberships';
import { sanitizeLogMessage } from '@shinefold/insight';
import { MEMBER_ACCESS_LOG } from '@worker/constants/member-access';
import { revokeMemberAccess } from '@worker/units/revoke-member-access';
import { logger } from '@worker/utils/logger/logger';

export type TLockedMemberRevokeResult = { revoked: number; failed: number };

const CLEARED_MEMBER_ACCESS: TSetMemberStudioAccessInput = {
  sanityInviteId: null,
  inviteSentAt: null,
  inviteAcceptedAt: null,
  sanityUserId: null,
  loginProvider: null,
};

async function isUnlocked(
  tenantId: string,
  membershipId: string,
): Promise<boolean> {
  return !!(await getMemberStudioAccess(tenantId, membershipId));
}

async function revokeLockedMember({
  tenantId,
  membershipId,
  email,
  sanityUserId,
  sanityInviteId,
}: TLockedMemberWithStudioAccess): Promise<boolean> {
  if (await isUnlocked(tenantId, membershipId)) return false;

  if (!email && !sanityInviteId) {
    logger.warn(MEMBER_ACCESS_LOG.LOCKED_INVITE_DELETE_SKIPPED, {
      tenantId,
      membershipId,
    });
  }
  await revokeMemberAccess(tenantId, { email, sanityUserId, sanityInviteId });

  await setMemberStudioAccess(tenantId, membershipId, CLEARED_MEMBER_ACCESS);
  return true;
}

export async function revokeLockedMembers(): Promise<TLockedMemberRevokeResult> {
  const result: TLockedMemberRevokeResult = { revoked: 0, failed: 0 };
  for (const member of await listLockedMembersWithStudioAccess()) {
    try {
      if (await revokeLockedMember(member)) result.revoked++;
    } catch (error) {
      result.failed++;
      logger.error(MEMBER_ACCESS_LOG.REVOKE_FAILED, {
        tenantId: member.tenantId,
        membershipId: member.membershipId,
        error: sanitizeLogMessage(error),
      });
    }
  }
  return result;
}
