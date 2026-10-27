'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  LOCALE_ISO_CODES,
  type TActionResult,
  type TEmailTemplateType,
  type TLocaleIsoCode,
  type TOutcome,
} from '@blog/config';
import { queries } from '@blog/db';
import type { TEmailTemplateResult } from '@blog/db/queries/email-templates';
import { toOutcome } from '@blog/utils/to-outcome';
import { EMAIL_TEMPLATES_LOG } from '@platform/constants/email-templates';
import {
  SETTINGS_REFUSAL,
  type TSettingsRefusal,
} from '@platform/constants/settings';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  emailTemplateCopyInputSchema,
  emailTemplateTypeSchema,
} from '@platform/utils/email-input-schemas/email-input-schemas';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

export type TUpdateEmailTemplateInput = z.input<
  typeof emailTemplateCopyInputSchema
>;

type TUpdateEmailTemplateFailure = Exclude<
  TActionResult<
    typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
    keyof TUpdateEmailTemplateInput,
    never,
    TSettingsRefusal
  >,
  TOutcome<typeof ACTION_OUTCOME.SUCCESS>
>;

export type TUpdateEmailTemplateResult =
  | { outcome: typeof ACTION_OUTCOME.SUCCESS; result: TEmailTemplateResult }
  | TUpdateEmailTemplateFailure;

export const updateEmailTemplateAction = async (
  tenantId: string,
  templateType: TEmailTemplateType,
  locale: TLocaleIsoCode,
  input: TUpdateEmailTemplateInput,
): Promise<TUpdateEmailTemplateResult> => {
  const parsedTemplateType = emailTemplateTypeSchema.safeParse(templateType);
  const parsedLocale = z.enum(LOCALE_ISO_CODES).safeParse(locale);
  const parsedInput = emailTemplateCopyInputSchema.safeParse(input);
  if (
    !parsedTemplateType.success ||
    !parsedLocale.success ||
    !parsedInput.success
  ) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }

  const { tenant } = await requireTenantMembership(tenantId);
  if (!queries.tenants.selectLiveLocales(tenant).includes(parsedLocale.data)) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SETTINGS_REFUSAL.LOCALE_NOT_LIVE,
    };
  }

  try {
    const result = await queries.emailTemplates.upsertEmailTemplate(
      tenant.id,
      parsedTemplateType.data,
      parsedInput.data,
      parsedLocale.data,
    );
    await recordAuditEvent({
      logEvent: EMAIL_TEMPLATES_LOG.UPDATE_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: {
        templateType: parsedTemplateType.data,
        locale: parsedLocale.data,
      },
    });
    return { outcome: ACTION_OUTCOME.SUCCESS, result };
  } catch (error) {
    logger.error(EMAIL_TEMPLATES_LOG.UPDATE_FAILED, {
      tenantId: tenant.id,
      templateType: parsedTemplateType.data,
      locale: parsedLocale.data,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
