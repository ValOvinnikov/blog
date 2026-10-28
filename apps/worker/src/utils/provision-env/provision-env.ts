import { env } from '@worker/utils/env/env';
import { requireValues } from '@worker/utils/require-values/require-values';
import {
  getVercelEnv,
  type TVercelEnv,
} from '@worker/utils/vercel-env/vercel-env';

export type TProvisionEnv = TVercelEnv & {
  sanityManagementToken: string;
  sanityOrganizationId: string;
  platformAppBaseUrl: string;
  tenantSanityDataset: string;
  webAppBaseUrl: string;
  revalidateSecret: string;
};

export function getProvisionEnv(): TProvisionEnv {
  const required = requireValues({
    SANITY_MANAGEMENT_TOKEN: env.SANITY_MANAGEMENT_TOKEN,
    SANITY_ORGANIZATION_ID: env.SANITY_ORGANIZATION_ID,
    PLATFORM_APP_BASE_URL: env.PLATFORM_APP_BASE_URL,
    TENANT_SANITY_DATASET: env.TENANT_SANITY_DATASET,
    WEB_APP_URL: env.WEB_APP_URL,
    SANITY_REVALIDATE_SECRET: env.SANITY_REVALIDATE_SECRET,
  });

  return {
    ...getVercelEnv(),
    sanityManagementToken: required.SANITY_MANAGEMENT_TOKEN,
    sanityOrganizationId: required.SANITY_ORGANIZATION_ID,
    platformAppBaseUrl: required.PLATFORM_APP_BASE_URL,
    tenantSanityDataset: required.TENANT_SANITY_DATASET,
    webAppBaseUrl: required.WEB_APP_URL,
    revalidateSecret: required.SANITY_REVALIDATE_SECRET,
  };
}
