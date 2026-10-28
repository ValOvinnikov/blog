import { env } from '@worker/utils/env/env';
import { requireValues } from '@worker/utils/require-values/require-values';

export type TInactivitySweepEnv = {
  platformAppBaseUrl: string;
  webAppBaseUrl: string;
  siteConfigRevalidateSecret: string;
};

export function getInactivitySweepEnv(): TInactivitySweepEnv {
  const { PLATFORM_APP_BASE_URL, WEB_APP_URL, SITE_CONFIG_REVALIDATE_SECRET } =
    env;
  const required = requireValues({
    PLATFORM_APP_BASE_URL,
    WEB_APP_URL,
    SITE_CONFIG_REVALIDATE_SECRET,
  });

  return {
    platformAppBaseUrl: required.PLATFORM_APP_BASE_URL,
    webAppBaseUrl: required.WEB_APP_URL,
    siteConfigRevalidateSecret: required.SITE_CONFIG_REVALIDATE_SECRET,
  };
}
