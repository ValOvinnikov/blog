'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TActionResult,
} from '@blog/config';
import { queries } from '@blog/db';
import { pickEntitledLook } from '@blog/db/utils/effective-look/effective-look';
import { hasArrayGotItems } from '@blog/utils/primitives';
import { toOutcome } from '@blog/utils/to-outcome';
import { SITE_CONFIG_LOG } from '@platform/constants/site-config';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
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

  const { tenant } = await requireTenantMembership(tenantId);
  const { preset, brandName, ...rest } = parsed.data;

  try {
    const stored = lookFormValuesOrDefaults(
      await queries.siteConfig.getSiteConfig(tenant.id),
    );
    const refused = listRefusedLookFields(
      { ...parsed.data, logoHue: parsed.data.logoHue ?? undefined },
      stored,
      tenant.plan,
    );
    if (hasArrayGotItems(refused)) {
      return toNotInPlanRefusal(tenant.plan, refused);
    }

    const look = {
      preset,
      ...pickEntitledLook(
        { ...rest, brandName: blankToNull(brandName) },
        tenant.plan,
      ),
    };
    await queries.siteConfig.upsertSiteConfig(tenant.id, look);
    await revalidateSiteConfig(tenant.id);
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
