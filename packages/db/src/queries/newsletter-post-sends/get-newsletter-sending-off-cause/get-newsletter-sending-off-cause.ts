import {
  CAPABILITY,
  ERROR_CODE,
  PRESET_ID,
  PRESET_REGISTRY,
  type TErrorCode,
  type TNewsletterSendingOffCause,
} from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { getEmailNewPosts } from '@shinefold/db/queries/email-config/get-email-new-posts';
import { getSettingsFeaturesAndPreset } from '@shinefold/db/queries/settings-features/get-settings-features-and-preset';
import { getTenantEntitlements } from '@shinefold/db/queries/tenant-entitlement-grants/get-tenant-entitlements';
import { tenants } from '@shinefold/db/schema/tenants';
import { newsletterSendingOffCause } from '@shinefold/db/utils/newsletter-sending-off-cause/newsletter-sending-off-cause';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { eq } from 'drizzle-orm';

async function isNewsletterEnabled(tenantId: string): Promise<boolean> {
  const { features, preset } = await getSettingsFeaturesAndPreset(tenantId);
  return (
    features?.newsletterEnabled ??
    PRESET_REGISTRY[preset ?? PRESET_ID.CONSOLE].featureDefaults[
      CAPABILITY.NEWSLETTER
    ]
  );
}

export async function getNewsletterSendingOffCause(
  tenantId: string,
): Promise<TResult<TMaybeUndefined<TNewsletterSendingOffCause>, TErrorCode>> {
  const [tenant] = await getDb()
    .select({
      plan: tenants.plan,
      status: tenants.status,
      deprovisionedAt: tenants.deprovisionedAt,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  if (!tenant) return errorResult(ERROR_CODE.DB_NOT_FOUND);

  const [{ capabilities }, newsletterEnabled, emailNewPosts] =
    await Promise.all([
      getTenantEntitlements({ id: tenantId, plan: tenant.plan }),
      isNewsletterEnabled(tenantId),
      getEmailNewPosts(tenantId),
    ]);

  return okResult(
    newsletterSendingOffCause(tenant, {
      capabilities,
      newsletterEnabled,
      emailNewPosts,
    }),
  );
}
