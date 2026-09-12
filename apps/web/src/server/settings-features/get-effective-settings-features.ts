import {
  PRESET_ID,
  TENANT_CONFIG_REVALIDATE_SECONDS,
  type TCapability,
} from '@blog/config';
import { queries } from '@blog/db';
import { safeAsync } from '@blog/utils';
import { getRequestTenantId } from '@web/server/tenant/get-request-tenant-id';
import { buildSettingsFeaturesCacheTag } from '@web/utils/tenant-cache-tags';
import { toEffectiveSettingsFeatures } from '@web/utils/to-effective-settings-features';
import { unstable_cache } from 'next/cache';

const getCachedEffectiveSettingsFeaturesForTenant = (tenantId: string) =>
  unstable_cache(
    async (id: string): Promise<Record<TCapability, boolean>> => {
      const [featuresRow, siteConfigRow] = await Promise.all([
        queries.settingsFeatures.getSettingsFeatures(id),
        queries.siteConfig.getSiteConfig(id),
      ]);

      return toEffectiveSettingsFeatures(
        featuresRow,
        siteConfigRow?.preset ?? PRESET_ID.CONSOLE,
      );
    },
    ['settings-features', tenantId],
    {
      tags: [buildSettingsFeaturesCacheTag(tenantId)],
      revalidate: TENANT_CONFIG_REVALIDATE_SECONDS,
    },
  )(tenantId);

// `getRequestTenantId`'s `headers()` read must stay outside this
// `safeAsync` boundary: its `DynamicServerError` is Next's signal that the
// route is dynamic, and swallowing it renders the route static, then 500s.
const getEffectiveSettingsFeaturesForTenantId = safeAsync(
  async (
    tenantId?: string,
  ): Promise<Record<TCapability, boolean> | undefined> => {
    if (!tenantId) return undefined;
    return getCachedEffectiveSettingsFeaturesForTenant(tenantId);
  },
);

/**
 * getEffectiveSettingsFeatures — the `settings_features` counterpart to
 * `getSiteConfig`: resolves the tenant's current per-capability toggle
 * state, falling back to their *live* `site_config.preset`'s
 * `featureDefaults` when no `settings_features` row exists yet. Read at
 * request time rather than eagerly seeded at provisioning, so a later
 * preset change is always reflected — `settings_features` is never
 * eagerly inserted anywhere (mirrors `site_config`'s own lazy-default
 * precedent). Cached per tenant, same as `getSiteConfig`. Accepts the
 * `[tenant]` route param and forwards it to `getRequestTenantId`.
 */
export const getEffectiveSettingsFeatures = async (tenant?: string) =>
  getEffectiveSettingsFeaturesForTenantId(await getRequestTenantId(tenant));
