'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  isLocaleIsoCode,
  type TActionResult,
} from '@blog/config';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  SETTINGS_REFUSAL,
  type TSettingsRefusal,
} from '@platform/constants/settings';
import { TENANT_LOG } from '@platform/constants/tenant';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

const updateTenantLanguagesInputSchema = z.array(
  z.string().refine(isLocaleIsoCode),
);

export type TUpdateTenantLanguagesResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  'additionalLocales',
  never,
  TSettingsRefusal
>;

const INVALID_LANGUAGES = {
  outcome: ACTION_OUTCOME.INVALID,
  fieldErrors: {},
} as const satisfies TUpdateTenantLanguagesResult;

export const updateTenantLanguagesAction = async (
  tenantId: string,
  additionalLocales: string[],
): Promise<TUpdateTenantLanguagesResult> => {
  const parsed = updateTenantLanguagesInputSchema.safeParse(additionalLocales);
  if (!parsed.success) return INVALID_LANGUAGES;

  const { tenant } = await requireTenantMembership(tenantId);

  try {
    const result = await queries.tenants.setTenantAdditionalLocales(
      tenant.id,
      parsed.data,
    );

    if (!result.ok) {
      if (result.error === ERROR_CODE.DB_NOT_FOUND) {
        return {
          outcome: ACTION_OUTCOME.REFUSED,
          reason: SETTINGS_REFUSAL.NOT_FOUND,
        };
      }
      logger.warn(TENANT_LOG.UPDATE_LANGUAGES_REJECTED, {
        tenantId: tenant.id,
        plan: tenant.plan,
        error: result.error,
      });
      return result.error === ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED
        ? {
            outcome: ACTION_OUTCOME.REFUSED,
            reason: SETTINGS_REFUSAL.NOT_IN_PLAN,
          }
        : INVALID_LANGUAGES;
    }

    await revalidateSiteConfig(tenant.id);
    await recordAuditEvent({
      logEvent: TENANT_LOG.UPDATE_LANGUAGES_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: tenant.id,
      details: { additionalLocales: result.data },
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(TENANT_LOG.UPDATE_LANGUAGES_FAILED, {
      tenantId: tenant.id,
      error,
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
