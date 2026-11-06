'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TActionResult,
} from '@blog/config';
import { PLAN_REGISTRY, queries } from '@blog/db';
import { hasArrayGotItems } from '@blog/utils/primitives';
import { toOutcome } from '@blog/utils/to-outcome';
import type { TSettingsRefusal } from '@platform/constants/settings';
import { SETTINGS_FEATURES_LOG } from '@platform/constants/settings-features';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { getSettingsFeaturesOrDefaults } from '@platform/server/settings-features/settings-features-or-defaults';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { blockSwitchOnWhileParentOff } from '@platform/utils/parent-toggle/parent-toggle';
import {
  toNotInPlanRefusal,
  type TNotInPlanRefusal,
} from '@platform/utils/plan-refusal/plan-refusal';
import {
  keepStoredOutOfPlan,
  listSwitchedOnOutOfPlan,
  withComingSoonOff,
} from '@platform/utils/settings-features-fields/settings-features-fields';
import { z } from 'zod';

const updateFeaturesInputSchema = z.object({
  readerAccountsEnabled: z.boolean(),
  commentsEnabled: z.boolean(),
  ratingsEnabled: z.boolean(),
  bookmarksEnabled: z.boolean(),
  newsletterEnabled: z.boolean(),
  analyticsEnabled: z.boolean(),
  consentBannerEnabled: z.boolean(),
  contactFormEnabled: z.boolean(),
});

export type TUpdateFeaturesInput = z.input<typeof updateFeaturesInputSchema>;
export type TUpdateFeaturesResult =
  | TActionResult<
      typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
      keyof TUpdateFeaturesInput,
      never,
      TSettingsRefusal
    >
  | TNotInPlanRefusal;

/**
 * A "Coming soon" capability is always written off. Switching on a toggle
 * outside `PLAN_REGISTRY[tenant.plan]` that is stored off rejects the whole
 * save; otherwise an out-of-plan toggle keeps its stored value, so a
 * downgrade loses nothing. A toggle whose parent is off can be switched
 * off but not on, so switching the parent back on restores what was kept.
 */
export const updateFeaturesAction = async (
  tenantId: string,
  input: TUpdateFeaturesInput,
): Promise<TUpdateFeaturesResult> => {
  const parsed = updateFeaturesInputSchema.safeParse(input);
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }

  const { tenant } = await requireTenantMembership(tenantId);
  const values = withComingSoonOff(parsed.data);

  const entitled = PLAN_REGISTRY[tenant.plan];

  try {
    const { values: stored } = await getSettingsFeaturesOrDefaults(tenant.id);
    const outOfPlan = listSwitchedOnOutOfPlan(values, stored, entitled);

    if (hasArrayGotItems(outOfPlan)) {
      logger.warn(SETTINGS_FEATURES_LOG.PLAN_ENTITLEMENT_REJECTED, {
        tenantId: tenant.id,
        plan: tenant.plan,
        fields: outOfPlan,
      });
      return toNotInPlanRefusal(tenant.plan, outOfPlan);
    }

    const toWrite = withComingSoonOff(
      keepStoredOutOfPlan(
        blockSwitchOnWhileParentOff(values, stored),
        stored,
        entitled,
      ),
    );
    await queries.settingsFeatures.upsertSettingsFeatures(tenant.id, toWrite);
    await revalidateSiteConfig(tenant.id);
    await recordAuditEvent({
      logEvent: SETTINGS_FEATURES_LOG.UPDATE_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SETTINGS_FEATURES,
      targetId: tenant.id,
      details: toWrite,
    });
    return toOutcome(ACTION_OUTCOME.SUCCESS);
  } catch (error) {
    logger.error(SETTINGS_FEATURES_LOG.UPDATE_FAILED, {
      tenantId: tenant.id,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
