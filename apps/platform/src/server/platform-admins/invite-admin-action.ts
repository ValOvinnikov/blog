'use server';

import {
  ADMIN_INVITE_FIELD_ERROR,
  PLATFORM_ADMIN_LOG,
  type TAdminInviteFieldError,
} from '@platform/constants/platform-admins';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { toTenantFieldErrors } from '@platform/server/tenants/tenant-field-error';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TActionResult,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import { ADMIN_INVITE_OUTCOME } from '@shinefold/db/constants';
import { toOutcome } from '@shinefold/utils/to-outcome';

import {
  adminInviteInputSchema,
  type TAdminInviteInput,
} from './admin-invite-input';
import { sendAdminInviteOrCancel } from './send-admin-invite';

export type TInviteAdminResult = TActionResult<
  typeof ACTION_OUTCOME.SERVER_ERROR,
  keyof TAdminInviteInput,
  TAdminInviteFieldError
>;

export const inviteAdminAction = async (
  input: TAdminInviteInput,
): Promise<TInviteAdminResult> => {
  const { userId } = await requireSuperAdmin();

  const parsed = adminInviteInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: toTenantFieldErrors<
        keyof TAdminInviteInput,
        TAdminInviteFieldError
      >(parsed.error.issues, {
        email: ADMIN_INVITE_FIELD_ERROR.EMAIL_INVALID,
        role: ADMIN_INVITE_FIELD_ERROR.ROLE_INVALID,
      }),
    };
  }
  const { email, role } = parsed.data;

  try {
    const result = await queries.adminInvites.createAdminInvite(
      email,
      role,
      userId,
    );
    if (result.outcome === ADMIN_INVITE_OUTCOME.ALREADY_ADMIN) {
      return {
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          email: {
            reason: ADMIN_INVITE_FIELD_ERROR.ALREADY_ADMIN,
            values: { email },
          },
        },
      };
    }

    const { id } = result.invite;
    if (
      !(await sendAdminInviteOrCancel(
        id,
        email,
        PLATFORM_ADMIN_LOG.INVITE_EMAIL_FAILED,
      ))
    ) {
      return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
    }

    await recordAuditEvent({
      logEvent: PLATFORM_ADMIN_LOG.INVITE_AUDIT_FAILED,
      action: AUDIT_ACTION.ADMIN_INVITED,
      targetType: AUDIT_TARGET_TYPE.PLATFORM_ADMIN,
      targetId: id,
      details: { role },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(PLATFORM_ADMIN_LOG.INVITE_FAILED, toLoggableError(error));
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
