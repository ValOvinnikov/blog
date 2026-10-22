import { env } from '@worker/utils/env/env';
import { requireValues } from '@worker/utils/provision-env/provision-env';

export type TInactivitySweepEnv = {
  adminAppBaseUrl: string;
  webAppBaseUrl: string;
  siteConfigRevalidateSecret: string;
};

export function getInactivitySweepEnv(): TInactivitySweepEnv {
  const { ADMIN_APP_BASE_URL, WEB_APP_URL, SITE_CONFIG_REVALIDATE_SECRET } =
    env;
  const required = requireValues({
    ADMIN_APP_BASE_URL,
    WEB_APP_URL,
    SITE_CONFIG_REVALIDATE_SECRET,
  });

  return {
    adminAppBaseUrl: required.ADMIN_APP_BASE_URL,
    webAppBaseUrl: required.WEB_APP_URL,
    siteConfigRevalidateSecret: required.SITE_CONFIG_REVALIDATE_SECRET,
  };
}
