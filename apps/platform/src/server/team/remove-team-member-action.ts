'use server';

import {
  TEAM_ACCESS_LOG,
  TEAM_REFUSAL,
  type TTeamRefusal,
} from '@platform/constants/team-access';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantManager } from '@platform/server/auth/require-tenant-manager';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  refusedAction,
  type TRefusalResult,
} from '@platform/utils/refused-action/refused-action';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import {
  MEMBERSHIP_REMOVAL_OUTCOME,
  MEMBERSHIP_ROLE,
} from '@shinefold/db/constants';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { after } from 'next/server';

import { revokeMemberStudioAccess } from './revoke-member-studio-access';
import { teamTargetIdSchema } from './team-input';

const readRemovedMember = async (tenantId: string, membershipId: string) => {
  const [members, identity] = await Promise.all([
    queries.memberships.listTenantMembers(tenantId),
    queries.memberships.getMemberStudioIdentity(tenantId, membershipId),
  ]);
  const member = members.find((row) => row.membershipId === membershipId);
  return member && identity && { role: member.role, ...identity };
};

export const removeTeamMemberAction = async (
  tenantId: string,
  membershipId: string,
): Promise<TRefusalResult<TTeamRefusal>> => {
  const { membership } = await requireTenantManager(tenantId);

  if (!teamTargetIdSchema.safeParse(membershipId).success) {
    return refusedAction(TEAM_REFUSAL.NOT_FOUND);
  }

  try {
    const removed = await readRemovedMember(tenantId, membershipId);
    if (!removed) return refusedAction(TEAM_REFUSAL.NOT_FOUND);

    const outcome = await queries.memberships.removeMembership(
      tenantId,
      membershipId,
      membership.userId,
    );
    if (outcome !== MEMBERSHIP_REMOVAL_OUTCOME.REMOVED)
      return refusedAction(outcome);

    const { role, email, sanityUserId } = removed;
    if (role === MEMBERSHIP_ROLE.EDITOR) {
      if (email) {
        after(() =>
          revokeMemberStudioAccess(tenantId, {
            memberEmail: email,
            sanityUserId,
          }),
        );
      } else {
        logger.warn(TEAM_ACCESS_LOG.REVOKE_SKIPPED_NO_EMAIL, {
          tenantId,
          membershipId,
        });
      }
    }

    await recordAuditEvent({
      logEvent: TEAM_ACCESS_LOG.REMOVE_AUDIT_FAILED,
      action: AUDIT_ACTION.MEMBER_REMOVED,
      targetType: AUDIT_TARGET_TYPE.TEAM_MEMBER,
      targetId: membershipId,
      details: { role },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(TEAM_ACCESS_LOG.REMOVE_FAILED, {
      tenantId,
      membershipId,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
