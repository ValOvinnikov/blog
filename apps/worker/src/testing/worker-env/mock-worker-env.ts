import type { TMaybeUndefined } from '@blog/config';
import { MOCK_SITE_CONFIG_REVALIDATE_SECRET } from '@worker/testing/deprovision-env/fake-deprovision-env';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';

export const MOCK_WORKER_ENV: Record<string, TMaybeUndefined<string>> = {
  SANITY_MANAGEMENT_TOKEN: MOCK_PROVISION_ENV.sanityManagementToken,
  SANITY_ORGANIZATION_ID: MOCK_PROVISION_ENV.sanityOrganizationId,
  PRODUCT_NAME: MOCK_PROVISION_ENV.productName,
  VERCEL_TOKEN: MOCK_PROVISION_ENV.vercelToken,
  VERCEL_TEAM_ID: MOCK_PROVISION_ENV.vercelTeamId,
  VERCEL_PROJECT_ID_WEB: MOCK_PROVISION_ENV.vercelWebProjectId,
  PLATFORM_APP_BASE_URL: MOCK_PROVISION_ENV.platformAppBaseUrl,
  TENANT_SANITY_DATASET: MOCK_PROVISION_ENV.tenantSanityDataset,
  WEB_APP_URL: MOCK_PROVISION_ENV.webAppBaseUrl,
  SANITY_REVALIDATE_SECRET: MOCK_PROVISION_ENV.revalidateSecret,
  SITE_CONFIG_REVALIDATE_SECRET: MOCK_SITE_CONFIG_REVALIDATE_SECRET,
};
