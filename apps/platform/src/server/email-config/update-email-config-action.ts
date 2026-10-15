'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { queries } from '@blog/db';
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
export type TSenderFieldErrors = {
  senderName?: 'senderNameInvalid';
  contactRecipient?: 'contactRecipientInvalid';
};

export type TUpdateEmailConfigResult =
  { ok: true } | { ok: false; fieldErrors?: TSenderFieldErrors };

const toFieldErrors = (error: z.ZodError): TSenderFieldErrors => ({
  ...(error.issues.some((issue) => issue.message === SENDER_NAME_INVALID) && {
    senderName: 'senderNameInvalid' as const,
  }),
  ...(error.issues.some((issue) => issue.path[0] === 'contactRecipient') && {
    contactRecipient: 'contactRecipientInvalid' as const,
  }),
});

export const updateEmailConfigAction = async (
  tenantId: string,
  input: TUpdateEmailConfigInput,
): Promise<TUpdateEmailConfigResult> => {
  const parsed = emailSenderInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = toFieldErrors(parsed.error);
    return Object.keys(fieldErrors).length > 0
      ? { ok: false, fieldErrors }
      : { ok: false };
  }

  const { tenant, membership } = await requireTenantMembership(tenantId);
  const data = canEditContactRecipient(tenant, membership)
    ? parsed.data
    : { ...parsed.data, contactRecipient: undefined };

  try {
    await queries.emailConfig.upsertEmailConfig(tenant.id, data);
    await recordAuditEvent({
      logEvent: 'email_config.update_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: data,
    });
    return { ok: true };
  } catch (error) {
    logger.error('email_config.update_failed', {
      tenantId: tenant.id,
      error,
    });
    return { ok: false };
  }
};
