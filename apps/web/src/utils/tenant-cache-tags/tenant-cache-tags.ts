const SITE_CONFIG_BASE_TAG = 'site-config';
const SETTINGS_FEATURES_BASE_TAG = 'settings-features';
const TENANT_PLAN_BASE_TAG = 'tenant-plan';

/** Shared by the `site_config` cache reader and `/api/revalidate-site-config` so both agree on the same tenant-scoped tag string. */
export const buildSiteConfigCacheTag = (tenantId: string): string =>
  `${SITE_CONFIG_BASE_TAG}:${tenantId}`;

export const buildSettingsFeaturesCacheTag = (tenantId: string): string =>
  `${SETTINGS_FEATURES_BASE_TAG}:${tenantId}`;

export const buildTenantPlanCacheTag = (tenantId: string): string =>
  `${TENANT_PLAN_BASE_TAG}:${tenantId}`;
