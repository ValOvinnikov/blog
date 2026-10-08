'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  emailSenderInputSchema,
  SENDER_NAME_INVALID,
} from '@platform/utils/email-input-schemas/email-input-schemas';
import { logger } from '@platform/utils/logger/logger';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export type TUpdateEmailConfigInput = z.input<typeof emailSenderInputSchema>;
export type TUpdateEmailConfigResult =
  { ok: true } | { ok: false; fieldErrors?: { senderName?: string } };

export const updateEmailConfigAction = async (
  tenantId: string,
  input: TUpdateEmailConfigInput,
): Promise<TUpdateEmailConfigResult> => {
  const parsed = emailSenderInputSchema.safeParse(input);
  if (!parsed.success) {
    const isSenderNameInvalid = parsed.error.issues.some(
      (issue) => issue.message === SENDER_NAME_INVALID,
    );
    if (!isSenderNameInvalid) return { ok: false };

    const t = await getTranslations('emailSettingsForm');
    return {
      ok: false,
      fieldErrors: { senderName: t('senderNameInvalidError') },
    };
  }

  const { tenant } = await requireTenantMembership(tenantId);

  try {
    await queries.emailConfig.upsertEmailConfig(tenant.id, parsed.data);
    await recordAuditEvent({
      logEvent: 'email_config.update_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: parsed.data,
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
