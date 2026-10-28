import { env } from '@worker/utils/env/env';
import { requireValues } from '@worker/utils/require-values/require-values';
import {
  getVercelEnv,
  type TVercelEnv,
} from '@worker/utils/vercel-env/vercel-env';

export type TDeprovisionEnv = TVercelEnv & {
  sanityManagementToken: string;
  webAppBaseUrl: string;
  siteConfigRevalidateSecret: string;
};

export function getDeprovisionEnv(): TDeprovisionEnv {
  const required = requireValues({
    SANITY_MANAGEMENT_TOKEN: env.SANITY_MANAGEMENT_TOKEN,
    WEB_APP_URL: env.WEB_APP_URL,
    SITE_CONFIG_REVALIDATE_SECRET: env.SITE_CONFIG_REVALIDATE_SECRET,
  });

  return {
    ...getVercelEnv(),
    sanityManagementToken: required.SANITY_MANAGEMENT_TOKEN,
    webAppBaseUrl: required.WEB_APP_URL,
    siteConfigRevalidateSecret: required.SITE_CONFIG_REVALIDATE_SECRET,
  };
}
