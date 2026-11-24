'use server';

import {
  PLATFORM_ADMIN_LOG,
  PLATFORM_ADMIN_REFUSAL,
} from '@platform/constants/platform-admins';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import { ADMIN_REMOVAL_OUTCOME } from '@shinefold/db/constants';
import { toOutcome } from '@shinefold/utils/to-outcome';

import { platformAdminTargetIdSchema } from './admin-invite-input';
import {
  refusedPlatformAdminAction,
  type TPlatformAdminRefusalResult,
} from './platform-admin-refusal';

export const removeAdminAction = async (
  adminId: string,
): Promise<TPlatformAdminRefusalResult> => {
  const viewer = await requireSuperAdmin();

  if (!platformAdminTargetIdSchema.safeParse(adminId).success) {
    return refusedPlatformAdminAction(PLATFORM_ADMIN_REFUSAL.NOT_FOUND);
  }
  if (adminId === viewer.id) {
    return refusedPlatformAdminAction(PLATFORM_ADMIN_REFUSAL.SELF);
  }

  try {
    const removed = (await queries.admins.listAdmins()).find(
      (admin) => admin.adminId === adminId,
    );
    if (!removed) {
      return refusedPlatformAdminAction(PLATFORM_ADMIN_REFUSAL.NOT_FOUND);
    }

    const outcome = await queries.admins.deleteAdmin(adminId);
    if (outcome !== ADMIN_REMOVAL_OUTCOME.REMOVED) {
      return refusedPlatformAdminAction(outcome);
    }

    const { role, userId } = removed;
    await recordAuditEvent({
      logEvent: PLATFORM_ADMIN_LOG.REMOVE_AUDIT_FAILED,
      action: AUDIT_ACTION.ADMIN_REMOVED,
      targetType: AUDIT_TARGET_TYPE.PLATFORM_ADMIN,
      targetId: adminId,
      details: { role, userId },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(PLATFORM_ADMIN_LOG.REMOVE_FAILED, {
      adminId,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
