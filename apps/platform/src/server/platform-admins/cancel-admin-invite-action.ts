'use server';

import {
  PLATFORM_ADMIN_LOG,
  PLATFORM_ADMIN_REFUSAL,
  type TPlatformAdminRefusal,
} from '@platform/constants/platform-admins';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
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
import { toOutcome } from '@shinefold/utils/to-outcome';

import { platformAdminTargetIdSchema } from './admin-invite-input';
import { findAdminInvite } from './find-admin-invite';

export const cancelAdminInviteAction = async (
  inviteId: string,
): Promise<TRefusalResult<TPlatformAdminRefusal>> => {
  await requireSuperAdmin();

  if (!platformAdminTargetIdSchema.safeParse(inviteId).success) {
    return refusedAction(PLATFORM_ADMIN_REFUSAL.NOT_FOUND);
  }

  try {
    const invite = await findAdminInvite(inviteId);
    if (!invite || !(await queries.adminInvites.cancelAdminInvite(inviteId))) {
      return refusedAction(PLATFORM_ADMIN_REFUSAL.NOT_FOUND);
    }

    await recordAuditEvent({
      logEvent: PLATFORM_ADMIN_LOG.CANCEL_AUDIT_FAILED,
      action: AUDIT_ACTION.ADMIN_INVITE_CANCELLED,
      targetType: AUDIT_TARGET_TYPE.PLATFORM_ADMIN,
      targetId: inviteId,
      details: { role: invite.role },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(PLATFORM_ADMIN_LOG.CANCEL_FAILED, {
      inviteId,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
