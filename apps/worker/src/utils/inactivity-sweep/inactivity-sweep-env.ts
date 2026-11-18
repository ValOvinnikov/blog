import type { TMaybeUndefined } from '@shinefold/config/types';
import { env } from '@worker/utils/env/env';
import { requireValues } from '@worker/utils/require-values/require-values';

export type TInactivitySweepEnv = {
  platformAppBaseUrl: string;
  webAppBaseUrl: string;
  siteConfigRevalidateSecret: string;
  tenantRootDomain: string;
  marketingHost: TMaybeUndefined<string>;
};

export function getInactivitySweepEnv(): TInactivitySweepEnv {
  const {
    PLATFORM_APP_BASE_URL,
    WEB_APP_URL,
    SITE_CONFIG_REVALIDATE_SECRET,
    TENANT_ROOT_DOMAIN,
    MARKETING_SITE_URL,
  } = env;
  const required = requireValues({
    PLATFORM_APP_BASE_URL,
    WEB_APP_URL,
    SITE_CONFIG_REVALIDATE_SECRET,
    TENANT_ROOT_DOMAIN,
  });

  return {
    platformAppBaseUrl: required.PLATFORM_APP_BASE_URL,
    webAppBaseUrl: required.WEB_APP_URL,
    siteConfigRevalidateSecret: required.SITE_CONFIG_REVALIDATE_SECRET,
    tenantRootDomain: required.TENANT_ROOT_DOMAIN,
    marketingHost: MARKETING_SITE_URL && new URL(MARKETING_SITE_URL).hostname,
  };
}
