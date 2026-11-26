import {
  PRESET_ID,
  TENANT_CONFIG_REVALIDATE_SECONDS,
  type TCapability,
  type TMaybeUndefined,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import { safeAsync } from '@shinefold/utils';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
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

const getEffectiveSettingsFeaturesForTenantId = safeAsync(
  async (
    tenantId?: string,
  ): Promise<TMaybeUndefined<Record<TCapability, boolean>>> => {
    if (!tenantId) return undefined;
    return getCachedEffectiveSettingsFeaturesForTenant(tenantId);
  },
);

/** Falls back to the tenant's live preset defaults while no `settings_features` row exists. */
export const getEffectiveSettingsFeatures = async (tenant?: string) =>
  getEffectiveSettingsFeaturesForTenantId(await getRequestTenantId(tenant));
