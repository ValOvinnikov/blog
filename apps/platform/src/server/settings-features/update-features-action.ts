'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { PLAN_REGISTRY, queries } from '@blog/db';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { logger } from '@platform/utils/logger/logger';
import {
  CAPABILITY_TOGGLES,
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
});

export type TUpdateFeaturesInput = z.input<typeof updateFeaturesInputSchema>;
export type TUpdateFeaturesResult = { ok: true } | { ok: false };

/**
 * The Features tab's save action. A "Coming soon" capability is always
 * written off; any other toggle exceeding `PLAN_REGISTRY[tenant.plan]`
 * rejects the whole save rather than silently dropping just that field.
 */
export const updateFeaturesAction = async (
  tenantId: string,
  input: TUpdateFeaturesInput,
): Promise<TUpdateFeaturesResult> => {
  const parsed = updateFeaturesInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

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
    return { ok: false };
  }

  try {
    await queries.settingsFeatures.upsertSettingsFeatures(tenant.id, values);
    await revalidateSiteConfig(tenant.id);
    await recordAuditEvent({
      logEvent: 'settings_features.update_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SETTINGS_FEATURES,
      targetId: tenant.id,
      details: values,
    });
    return { ok: true };
  } catch (error) {
    logger.error('settings_features.update_failed', {
      tenantId: tenant.id,
      error,
    });
    return { ok: false };
  }
};
