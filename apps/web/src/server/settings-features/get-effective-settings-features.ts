import { PRESET_ID, type TCapability } from '@blog/config';
import { queries } from '@blog/db';
import { safeAsync } from '@blog/utils';
import { getRequestTenantId } from '@web/server/tenant/get-request-tenant-id';
import { buildSettingsFeaturesCacheTag } from '@web/utils/tenant-cache-tags';
import { toEffectiveSettingsFeatures } from '@web/utils/to-effective-settings-features';
import { unstable_cache } from 'next/cache';

const SETTINGS_FEATURES_REVALIDATE_SECONDS = 3600;

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
      revalidate: SETTINGS_FEATURES_REVALIDATE_SECONDS,
    },
  )(tenantId);

const getUncachedEffectiveSettingsFeatures = async (): Promise<
  Record<TCapability, boolean> | undefined
> => {
  const tenantId = await getRequestTenantId();
  if (!tenantId) return undefined;
  return getCachedEffectiveSettingsFeaturesForTenant(tenantId);
};

/**
 * getEffectiveSettingsFeatures — the `settings_features` counterpart to
 * `getSiteConfig`: resolves the tenant's current per-capability toggle
 * state, falling back to their *live* `site_config.preset`'s
 * `featureDefaults` when no `settings_features` row exists yet. Read at
 * request time rather than eagerly seeded at provisioning, so a later
 * preset change is always reflected — `settings_features` is never
 * eagerly inserted anywhere (mirrors `site_config`'s own lazy-default
 * precedent). Cached per tenant, same as `getSiteConfig`.
 */
export const getEffectiveSettingsFeatures = safeAsync(
  getUncachedEffectiveSettingsFeatures,
);
