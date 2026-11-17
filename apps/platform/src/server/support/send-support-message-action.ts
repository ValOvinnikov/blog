'use server';

import {
  SUPPORT_LOG,
  type TSupportFieldError,
} from '@platform/constants/support';
import { getSession } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { resolveOperatorAlertFromAddress } from '@platform/server/email/resolve-operator-alert-from-address';
import { resolveSupportAddress } from '@platform/server/support/support-address';
import {
  sendSupportMessageInputSchema,
  type TSendSupportMessageInput,
  type TSupportField,
  toSupportFieldErrors,
} from '@platform/server/support/support-message-input';
import { takeSupportMessageSlot } from '@platform/server/support/support-message-rate-limit';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { ACTION_OUTCOME, type TActionResult } from '@shinefold/config';
import { EMAIL_ACCOUNT } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { buildSupportRequestEmail, sendEmail } from '@shinefold/email';
import { toOutcome } from '@shinefold/utils/to-outcome';

export type TSendSupportMessageResult = TActionResult<
  | typeof ACTION_OUTCOME.RATE_LIMITED
  | typeof ACTION_OUTCOME.UNAVAILABLE
  | typeof ACTION_OUTCOME.SERVER_ERROR,
  TSupportField,
  TSupportFieldError
>;

export const sendSupportMessageAction = async (
  tenantId: string,
  input: TSendSupportMessageInput,
): Promise<TSendSupportMessageResult> => {
  const parsed = sendSupportMessageInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: toSupportFieldErrors(parsed.error.issues),
    };
  }

  const { tenant, membership, viewer } =
    await requireTenantMembership(tenantId);
  const supportAddress = resolveSupportAddress();
  if (!supportAddress) return toOutcome(ACTION_OUTCOME.UNAVAILABLE);

  const session = await getSession();
  const userId = session?.user?.id;
  const senderEmail = session?.user?.email;
  if (!userId || !senderEmail) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);

  if (!(await takeSupportMessageSlot(userId))) {
    return toOutcome(ACTION_OUTCOME.RATE_LIMITED);
  }

  const { subject, message, originPath } = parsed.data;
  const from = resolveOperatorAlertFromAddress();
  const admin = viewer.isOperator
    ? await queries.admins.getAdminByUserId(userId)
    : undefined;
  const email = buildSupportRequestEmail({
    subject,
    message,
    siteName: tenant.name,
    siteAddress: tenant.siteUrl,
    plan: tenant.plan,
    status: tenant.status,
    senderEmail,
    senderRole: admin?.role ?? membership.role,
    originPage: originPath,
  });

  try {
    await sendEmail({
      account: EMAIL_ACCOUNT.PLATFORM,
      to: supportAddress,
      from,
      replyTo: senderEmail,
      ...email,
    });
  } catch (error) {
    logger.error(SUPPORT_LOG.SEND_FAILED, {
      tenantId: tenant.id,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  try {
    await sendEmail({
      account: EMAIL_ACCOUNT.PLATFORM,
      to: senderEmail,
      from,
      replyTo: supportAddress,
      ...email,
    });
  } catch (error) {
    logger.warn(SUPPORT_LOG.COPY_FAILED, {
      tenantId: tenant.id,
      ...toLoggableError(error),
    });
  }

  return toOutcome(ACTION_OUTCOME.SUCCESS);
};
