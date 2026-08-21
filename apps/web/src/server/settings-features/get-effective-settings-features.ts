import { PRESET_ID, type TCapability } from '@blog/config';
import { queries } from '@blog/db';
import { safeAsync } from '@blog/utils';
import { resolveCachedTenantId } from '@web/server/tenant/resolve-cached-tenant-id';
import { toEffectiveSettingsFeatures } from '@web/utils/to-effective-settings-features';
import { unstable_cache } from 'next/cache';

const SETTINGS_FEATURES_CACHE_TAG = 'settings-features';
const SETTINGS_FEATURES_REVALIDATE_SECONDS = 3600;

const getCachedEffectiveSettingsFeatures = unstable_cache(
  async (): Promise<Record<TCapability, boolean> | undefined> => {
    const tenantId = await resolveCachedTenantId();
    if (!tenantId) return undefined;

    const [featuresRow, siteConfigRow] = await Promise.all([
      queries.settingsFeatures.getSettingsFeatures(tenantId),
      queries.siteConfig.getSiteConfig(tenantId),
    ]);

    return toEffectiveSettingsFeatures(
      featuresRow,
      siteConfigRow?.preset ?? PRESET_ID.CONSOLE,
    );
  },
  ['settings-features'],
  {
    tags: [SETTINGS_FEATURES_CACHE_TAG],
    revalidate: SETTINGS_FEATURES_REVALIDATE_SECONDS,
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
 * precedent).
 */
export const getEffectiveSettingsFeatures = safeAsync(
  getCachedEffectiveSettingsFeatures,
);
