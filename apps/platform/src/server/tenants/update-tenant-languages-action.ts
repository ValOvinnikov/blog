'use server';

import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  isLocaleIsoCode,
} from '@blog/config';
import { queries } from '@blog/db';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

const updateTenantLanguagesInputSchema = z.array(
  z.string().refine(isLocaleIsoCode),
);

export type TUpdateTenantLanguagesResult = { ok: true } | { ok: false };

export const updateTenantLanguagesAction = async (
  tenantId: string,
  additionalLocales: string[],
): Promise<TUpdateTenantLanguagesResult> => {
  const parsed = updateTenantLanguagesInputSchema.safeParse(additionalLocales);
  if (!parsed.success) return { ok: false };

  const { tenant } = await requireTenantMembership(tenantId);

  try {
    const result = await queries.tenants.setTenantAdditionalLocales(
      tenant.id,
      parsed.data,
    );

    if (!result.ok) {
      if (result.error !== ERROR_CODE.DB_NOT_FOUND) {
        logger.warn('tenants.update_languages_rejected', {
          tenantId: tenant.id,
          plan: tenant.plan,
          error: result.error,
        });
      }
      return { ok: false };
    }

    await recordAuditEvent({
      logEvent: 'tenants.update_languages_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: tenant.id,
      details: { additionalLocales: result.data },
    });
    return { ok: true };
  } catch (error) {
    logger.error('tenants.update_languages_failed', {
      tenantId: tenant.id,
      error,
    });
    return { ok: false };
  }
};
