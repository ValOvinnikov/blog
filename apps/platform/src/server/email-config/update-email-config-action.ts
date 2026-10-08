'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { logger } from '@platform/utils/logger/logger';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

const SENDER_NAME_MAX = 100;
const FOOTER_ADDRESS_MAX = 300;
// Each lets a display name pose as, or split off, a second address in the From header.
// eslint-disable-next-line no-control-regex
const SENDER_NAME_FORBIDDEN_PATTERN = /[<>",;@\u0000-\u001f\u007f]/;
const SENDER_NAME_INVALID = 'sender-name-invalid';

// Blank means "revert to the product default" for every field — the client
// sends `null`, never an empty string, when a field has been cleared. Zod's
// `.min(1)` on the string branch is what makes an accidental empty string a
// validation failure rather than a silently-stored blank.
const updateEmailConfigInputSchema = z.object({
  senderName: z
    .string()
    .trim()
    .min(1)
    .max(SENDER_NAME_MAX)
    .refine((value) => !SENDER_NAME_FORBIDDEN_PATTERN.test(value), {
      message: SENDER_NAME_INVALID,
    })
    .nullable(),
  replyToAddress: z.string().trim().email().nullable(),
  footerPostalAddress: z
    .string()
    .trim()
    .min(1)
    .max(FOOTER_ADDRESS_MAX)
    .nullable(),
});

export type TUpdateEmailConfigInput = z.input<
  typeof updateEmailConfigInputSchema
>;
export type TUpdateEmailConfigResult =
  { ok: true } | { ok: false; fieldErrors?: { senderName?: string } };

export const updateEmailConfigAction = async (
  tenantId: string,
  input: TUpdateEmailConfigInput,
): Promise<TUpdateEmailConfigResult> => {
  const parsed = updateEmailConfigInputSchema.safeParse(input);
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
