'use server';

import { TEAM_ACCESS_LOG, TEAM_REFUSAL } from '@platform/constants/team-access';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantManager } from '@platform/server/auth/require-tenant-manager';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import { toOutcome } from '@shinefold/utils/to-outcome';

import { teamTargetIdSchema } from './team-input';
import { refusedTeamAction, type TTeamRefusalResult } from './team-refusal';

export const cancelTeamInviteAction = async (
  tenantId: string,
  inviteId: string,
): Promise<TTeamRefusalResult> => {
  await requireTenantManager(tenantId);

  if (!teamTargetIdSchema.safeParse(inviteId).success) {
    return refusedTeamAction(TEAM_REFUSAL.NOT_FOUND);
  }

  try {
    const invite = (
      await queries.membershipInvites.listPendingMembershipInvites(tenantId)
    ).find((row) => row.inviteId === inviteId);
    if (!invite) return refusedTeamAction(TEAM_REFUSAL.NOT_FOUND);
    if (invite.role === MEMBERSHIP_ROLE.OWNER) {
      return refusedTeamAction(TEAM_REFUSAL.OWNER_INVITE);
    }

    if (
      !(await queries.membershipInvites.cancelMembershipInvite(
        tenantId,
        inviteId,
      ))
    ) {
      return refusedTeamAction(TEAM_REFUSAL.NOT_FOUND);
    }

    await recordAuditEvent({
      logEvent: TEAM_ACCESS_LOG.CANCEL_AUDIT_FAILED,
      action: AUDIT_ACTION.MEMBER_INVITE_CANCELLED,
      targetType: AUDIT_TARGET_TYPE.TEAM_MEMBER,
      targetId: inviteId,
      details: { role: invite.role },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(TEAM_ACCESS_LOG.CANCEL_FAILED, {
      tenantId,
      inviteId,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
