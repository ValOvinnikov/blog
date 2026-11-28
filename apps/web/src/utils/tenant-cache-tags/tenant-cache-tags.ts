const SITE_CONFIG_BASE_TAG = 'site-config';
const SETTINGS_FEATURES_BASE_TAG = 'settings-features';
const TENANT_PLAN_BASE_TAG = 'tenant-plan';
const PROXY_TENANT_BASE_TAG = 'proxy-tenant';

export const TENANT_BY_HOST_CACHE_TAG = 'tenant-by-host';

export const STRIPE_CATALOGUE_CACHE_TAG = 'stripe-catalogue';

export const buildSiteConfigCacheTag = (tenantId: string): string =>
  `${SITE_CONFIG_BASE_TAG}:${tenantId}`;

export const buildSettingsFeaturesCacheTag = (tenantId: string): string =>
  `${SETTINGS_FEATURES_BASE_TAG}:${tenantId}`;

export const buildTenantPlanCacheTag = (tenantId: string): string =>
  `${TENANT_PLAN_BASE_TAG}:${tenantId}`;

// Runtime Cache namespaces keys but not tags, so the tag carries the project itself.
export const buildProxyTenantCacheTag = (
  namespace: string,
  tenantId: string,
): string => `${namespace}:${PROXY_TENANT_BASE_TAG}:${tenantId}`;
