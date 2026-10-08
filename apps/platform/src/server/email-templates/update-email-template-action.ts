'use server';

import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  LOCALE_ISO_CODES,
  type TEmailTemplateType,
  type TLocaleIsoCode,
} from '@blog/config';
import { queries } from '@blog/db';
import type { TEmailTemplateResult } from '@blog/db/queries/email-templates';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  EMAIL_TEMPLATE_TYPE_VALUES,
  emailTemplateCopyInputSchema,
} from '@platform/utils/email-input-schemas/email-input-schemas';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

const LOCALE_ISO_CODE_VALUES = Object.values(LOCALE_ISO_CODES) as [
  TLocaleIsoCode,
  ...TLocaleIsoCode[],
];

export type TUpdateEmailTemplateInput = z.input<
  typeof emailTemplateCopyInputSchema
>;
export type TUpdateEmailTemplateResult =
  { ok: true; result: TEmailTemplateResult } | { ok: false };

export const updateEmailTemplateAction = async (
  tenantId: string,
  templateType: TEmailTemplateType,
  locale: TLocaleIsoCode,
  input: TUpdateEmailTemplateInput,
): Promise<TUpdateEmailTemplateResult> => {
  const parsedTemplateType = z
    .enum(EMAIL_TEMPLATE_TYPE_VALUES)
    .safeParse(templateType);
  const parsedLocale = z.enum(LOCALE_ISO_CODE_VALUES).safeParse(locale);
  const parsedInput = emailTemplateCopyInputSchema.safeParse(input);
  if (
    !parsedTemplateType.success ||
    !parsedLocale.success ||
    !parsedInput.success
  ) {
    return { ok: false };
  }

  const { tenant } = await requireTenantMembership(tenantId);
  if (!queries.tenants.selectLiveLocales(tenant).includes(parsedLocale.data)) {
    return { ok: false };
  }

  try {
    const result = await queries.emailTemplates.upsertEmailTemplate(
      tenant.id,
      parsedTemplateType.data,
      parsedInput.data,
      parsedLocale.data,
    );
    await recordAuditEvent({
      logEvent: 'email_templates.update_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: {
        templateType: parsedTemplateType.data,
        locale: parsedLocale.data,
      },
    });
    return { ok: true, result };
  } catch (error) {
    logger.error('email_templates.update_failed', {
      tenantId: tenant.id,
      templateType: parsedTemplateType.data,
      locale: parsedLocale.data,
      error,
    });
    return { ok: false };
  }
};
