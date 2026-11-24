'use server';

import {
  PLATFORM_ADMIN_LOG,
  PLATFORM_ADMIN_REFUSAL,
} from '@platform/constants/platform-admins';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { ACTION_OUTCOME } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { ADMIN_INVITE_OUTCOME } from '@shinefold/db/constants';
import { toOutcome } from '@shinefold/utils/to-outcome';

import { platformAdminTargetIdSchema } from './admin-invite-input';
import { findAdminInvite } from './find-admin-invite';
import {
  refusedPlatformAdminAction,
  type TPlatformAdminRefusalResult,
} from './platform-admin-refusal';
import { sendAdminInviteEmail } from './send-admin-invite';

export const resendAdminInviteAction = async (
  inviteId: string,
): Promise<TPlatformAdminRefusalResult> => {
  const { userId } = await requireSuperAdmin();

  if (!platformAdminTargetIdSchema.safeParse(inviteId).success) {
    return refusedPlatformAdminAction(PLATFORM_ADMIN_REFUSAL.NOT_FOUND);
  }

  try {
    const invite = await findAdminInvite(inviteId);
    if (!invite) {
      return refusedPlatformAdminAction(PLATFORM_ADMIN_REFUSAL.NOT_FOUND);
    }

    const { email, role } = invite;
    const renewed = await queries.adminInvites.createAdminInvite(
      email,
      role,
      userId,
    );
    if (renewed.outcome === ADMIN_INVITE_OUTCOME.ALREADY_ADMIN) {
      return refusedPlatformAdminAction(PLATFORM_ADMIN_REFUSAL.ALREADY_ADMIN);
    }

    const isSent = await sendAdminInviteEmail(
      inviteId,
      email,
      PLATFORM_ADMIN_LOG.RESEND_EMAIL_FAILED,
    );
    return toOutcome(
      isSent ? ACTION_OUTCOME.SUCCESS : ACTION_OUTCOME.SERVER_ERROR,
    );
  } catch (error) {
    logger.error(PLATFORM_ADMIN_LOG.RESEND_FAILED, {
      inviteId,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
