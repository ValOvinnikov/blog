import { getProvisionEnv } from '@worker/testing/provision-env/fake-provision-env';
import type { TDeprovisionEnv } from '@worker/utils/deprovision-env/deprovision-env';

export const getDeprovisionEnv = vi.fn((): TDeprovisionEnv => {
  const {
    sanityManagementToken,
    vercelToken,
    vercelTeamId,
    vercelWebProjectId,
    webAppBaseUrl,
  } = getProvisionEnv();
  return {
    sanityManagementToken,
    vercelToken,
    vercelTeamId,
    vercelWebProjectId,
    webAppBaseUrl,
    siteConfigRevalidateSecret: 'fake-site-config-secret',
  };
});
