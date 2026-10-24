'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TActionResult,
  type TFieldErrors,
} from '@blog/config';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import { EMAIL_CONFIG_LOG } from '@platform/constants/email-config';
import {
  EMAIL_SENDER_FIELD_ERROR,
  type TEmailSenderFieldErrorReason,
} from '@platform/constants/email-sender';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { canEditContactRecipient } from '@platform/server/auth/can-edit-contact-recipient';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  emailSenderInputSchema,
  SENDER_NAME_INVALID,
} from '@platform/utils/email-input-schemas/email-input-schemas';
import { logger } from '@platform/utils/logger/logger';
import type { z } from 'zod';

export type TUpdateEmailConfigInput = z.input<typeof emailSenderInputSchema>;
type TSenderField = 'senderName' | 'contactRecipient';

export type TSenderFieldErrors = TFieldErrors<
  TSenderField,
  TEmailSenderFieldErrorReason
>;

export type TUpdateEmailConfigResult = TActionResult<
  typeof ACTION_OUTCOME.SERVER_ERROR,
  TSenderField,
  TEmailSenderFieldErrorReason
>;

const toFieldErrors = (error: z.ZodError): TSenderFieldErrors => ({
  ...(error.issues.some((issue) => issue.message === SENDER_NAME_INVALID) && {
    senderName: { reason: EMAIL_SENDER_FIELD_ERROR.SENDER_NAME_INVALID },
  }),
  ...(error.issues.some((issue) => issue.path[0] === 'contactRecipient') && {
    contactRecipient: {
      reason: EMAIL_SENDER_FIELD_ERROR.CONTACT_RECIPIENT_INVALID,
    },
  }),
});

export const updateEmailConfigAction = async (
  tenantId: string,
  input: TUpdateEmailConfigInput,
): Promise<TUpdateEmailConfigResult> => {
  const parsed = emailSenderInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { tenant, membership } = await requireTenantMembership(tenantId);
  const data = canEditContactRecipient(tenant, membership)
    ? parsed.data
    : { ...parsed.data, contactRecipient: undefined };

  const writtenFields = Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .map(([field]) => field);

  try {
    await queries.emailConfig.upsertEmailConfig(tenant.id, data);
    await recordAuditEvent({
      logEvent: EMAIL_CONFIG_LOG.UPDATE_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: { fields: writtenFields },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(EMAIL_CONFIG_LOG.UPDATE_FAILED, {
      tenantId: tenant.id,
      error,
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
