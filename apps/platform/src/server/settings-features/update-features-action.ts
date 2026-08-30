'use server';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { PLAN_REGISTRY, queries } from '@blog/db';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { logger } from '@platform/utils/logger/logger';
import { CAPABILITY_TOGGLES } from '@platform/utils/settings-features-fields/settings-features-fields';
import { z } from 'zod';

const updateFeaturesInputSchema = z.object({
  commentsEnabled: z.boolean(),
  ratingsEnabled: z.boolean(),
  bookmarksEnabled: z.boolean(),
  newsletterEnabled: z.boolean(),
  analyticsEnabled: z.boolean(),
});

export type TUpdateFeaturesInput = z.input<typeof updateFeaturesInputSchema>;
export type TUpdateFeaturesResult = { ok: true } | { ok: false };

/**
 * The Features tab's save action. Rejects the whole save (writes nothing)
 * if any toggle in the payload exceeds `PLAN_REGISTRY[tenant.plan]`, rather
 * than silently dropping just that field.
 */
export const updateFeaturesAction = async (
  tenantSlug: string,
  input: TUpdateFeaturesInput,
): Promise<TUpdateFeaturesResult> => {
  const parsed = updateFeaturesInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const { tenant } = await requireTenantMembership(tenantSlug);

  const entitled = PLAN_REGISTRY[tenant.plan];
  const outOfPlan = CAPABILITY_TOGGLES.filter(
    ({ capability, field }) =>
      parsed.data[field] === true && !entitled.includes(capability),
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
    await queries.settingsFeatures.upsertSettingsFeatures(
      tenant.id,
      parsed.data,
    );
    await revalidateSiteConfig();
    await recordAuditEvent({
      logEvent: 'settings_features.update_audit_failed',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SETTINGS_FEATURES,
      targetId: tenant.id,
      details: parsed.data,
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
