'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TActionResult,
} from '@blog/config';
import { PLAN_REGISTRY, queries } from '@blog/db';
import {
  SETTINGS_REFUSAL,
  type TSettingsRefusal,
} from '@platform/constants/settings';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { getSettingsFeaturesOrDefaults } from '@platform/server/settings-features/settings-features-or-defaults';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { logger } from '@platform/utils/logger/logger';
import {
  CAPABILITY_TOGGLES,
  keepStoredOutOfPlan,
  withComingSoonOff,
} from '@platform/utils/settings-features-fields/settings-features-fields';
import { z } from 'zod';

const updateFeaturesInputSchema = z.object({
  commentsEnabled: z.boolean(),
  ratingsEnabled: z.boolean(),
  bookmarksEnabled: z.boolean(),
  newsletterEnabled: z.boolean(),
  analyticsEnabled: z.boolean(),
  consentBannerEnabled: z.boolean(),
  contactFormEnabled: z.boolean(),
});

export type TUpdateFeaturesInput = z.input<typeof updateFeaturesInputSchema>;
export type TUpdateFeaturesResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  keyof TUpdateFeaturesInput,
  never,
  TSettingsRefusal
>;

/**
 * A "Coming soon" capability is always written off. Switching on a toggle
 * outside `PLAN_REGISTRY[tenant.plan]` rejects the whole save; otherwise an
 * out-of-plan toggle keeps its stored value, so a downgrade loses nothing.
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
  const outOfPlan = CAPABILITY_TOGGLES.filter(
    ({ capability, field }) => values[field] && !entitled.includes(capability),
  );

  if (outOfPlan.length > 0) {
    logger.warn('settings_features.plan_entitlement_rejected', {
      tenantId: tenant.id,
      plan: tenant.plan,
      capabilities: outOfPlan.map(({ capability }) => capability),
    });
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SETTINGS_REFUSAL.NOT_IN_PLAN,
    };
  }

  try {
    const { values: stored } = await getSettingsFeaturesOrDefaults(tenant.id);
    const toWrite = withComingSoonOff(
      keepStoredOutOfPlan(values, stored, entitled),
    );
    await queries.settingsFeatures.upsertSettingsFeatures(tenant.id, toWrite);
    await revalidateSiteConfig(tenant.id);
    await recordAuditEvent({
      logEvent: 'settings_features.update_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SETTINGS_FEATURES,
      targetId: tenant.id,
      details: toWrite,
    });
    return { outcome: ACTION_OUTCOME.SUCCESS };
  } catch (error) {
    logger.error('settings_features.update_failed', {
      tenantId: tenant.id,
      error,
    });
    return { outcome: ACTION_OUTCOME.SERVER_ERROR };
  }
};
