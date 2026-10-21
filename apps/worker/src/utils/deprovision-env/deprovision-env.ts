import type { TMaybeUndefined } from '@blog/config';
import { env } from '@worker/utils/env/env';
import { requireValues } from '@worker/utils/provision-env/provision-env';

export type TDeprovisionEnv = {
  sanityManagementToken: string;
  vercelToken: string;
  vercelTeamId: TMaybeUndefined<string>;
  vercelWebProjectId: string;
  webAppBaseUrl: string;
  siteConfigRevalidateSecret: string;
};

export function getDeprovisionEnv(): TDeprovisionEnv {
  const {
    SANITY_MANAGEMENT_TOKEN,
    VERCEL_TOKEN,
    VERCEL_TEAM_ID,
    VERCEL_PROJECT_ID_WEB,
    WEB_APP_URL,
    SITE_CONFIG_REVALIDATE_SECRET,
  } = env;
  const required = requireValues({
    SANITY_MANAGEMENT_TOKEN,
    VERCEL_TOKEN,
    VERCEL_PROJECT_ID_WEB,
    WEB_APP_URL,
    SITE_CONFIG_REVALIDATE_SECRET,
  });

  return {
    sanityManagementToken: required.SANITY_MANAGEMENT_TOKEN,
    vercelToken: required.VERCEL_TOKEN,
    vercelTeamId: VERCEL_TEAM_ID,
    vercelWebProjectId: required.VERCEL_PROJECT_ID_WEB,
    webAppBaseUrl: required.WEB_APP_URL,
    siteConfigRevalidateSecret: required.SITE_CONFIG_REVALIDATE_SECRET,
  };
}
