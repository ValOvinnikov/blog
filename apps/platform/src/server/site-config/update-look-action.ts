'use server';

import { SITE_CONFIG_LOG } from '@platform/constants/site-config';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantManager } from '@platform/server/auth/require-tenant-manager';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { stampSavedAt } from '@platform/server/site-config/stamp-saved-at';
import {
  updateLookInputSchema,
  type TUpdateLookInput,
} from '@platform/server/site-config/update-look-input-schema';
import { blankToNull } from '@platform/utils/blank-to-null/blank-to-null';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  toNotInPlanRefusal,
  type TNotInPlanRefusal,
} from '@platform/utils/plan-refusal/plan-refusal';
import { listRefusedLookFields } from '@platform/utils/refused-look-fields/refused-look-fields';
import { lookFormValuesOrDefaults } from '@platform/utils/to-look-form-values/to-look-form-values';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TActionResult,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import { SITE_CONFIG_SAVED_AT } from '@shinefold/db/constants';
import { pickLookWithin } from '@shinefold/db/utils/effective-look/effective-look';
import { hasArrayGotItems } from '@shinefold/utils/primitives';
import { toOutcome } from '@shinefold/utils/to-outcome';

export type TUpdateLookResult =
  | TActionResult<typeof ACTION_OUTCOME.SERVER_ERROR, keyof TUpdateLookInput>
  | TNotInPlanRefusal;

export const updateLookAction = async (
  tenantId: string,
  input: TUpdateLookInput,
): Promise<TUpdateLookResult> => {
  const parsed = updateLookInputSchema.safeParse(input);
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }

  const { tenant } = await requireTenantManager(tenantId);
  const { preset, brandName, ...rest } = parsed.data;

  try {
    const stored = lookFormValuesOrDefaults(
      await queries.siteConfig.getSiteConfig(tenant.id),
    );
    const refused = listRefusedLookFields(
      { ...parsed.data, logoHue: parsed.data.logoHue ?? undefined },
      stored,
      tenant.entitlements,
    );
    if (hasArrayGotItems(refused)) {
      return toNotInPlanRefusal(tenant.plan, refused);
    }

    const look = {
      preset,
      ...pickLookWithin(
        { ...rest, brandName: blankToNull(brandName) },
        tenant.entitlements,
      ),
    };
    await queries.siteConfig.upsertSiteConfig(tenant.id, look);
    await revalidateSiteConfig(tenant.id);
    await stampSavedAt(tenant.id, SITE_CONFIG_SAVED_AT.LOOK);
    await recordAuditEvent({
      logEvent: SITE_CONFIG_LOG.LOOK_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: tenant.id,
      details: look,
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(SITE_CONFIG_LOG.LOOK_SAVE_FAILED, {
      tenantId: tenant.id,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
