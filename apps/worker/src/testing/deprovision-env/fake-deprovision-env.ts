import { faker } from '@faker-js/faker';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import type { TDeprovisionEnv } from '@worker/utils/deprovision-env/deprovision-env';

faker.seed(6027);

export const MOCK_SITE_CONFIG_REVALIDATE_SECRET = faker.string.alphanumeric(32);

const {
  sanityManagementToken,
  vercelToken,
  vercelTeamId,
  vercelWebProjectId,
  webAppBaseUrl,
} = MOCK_PROVISION_ENV;

export const MOCK_DEPROVISION_ENV: TDeprovisionEnv = {
  sanityManagementToken,
  vercelToken,
  vercelTeamId,
  vercelWebProjectId,
  webAppBaseUrl,
  siteConfigRevalidateSecret: MOCK_SITE_CONFIG_REVALIDATE_SECRET,
};

export const getDeprovisionEnv = vi.fn(
  (): TDeprovisionEnv => MOCK_DEPROVISION_ENV,
);
