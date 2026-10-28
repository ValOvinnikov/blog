import { MOCK_SITE_CONFIG_REVALIDATE_SECRET } from '@worker/testing/deprovision-env/fake-deprovision-env';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import { MOCK_TENANT_ROOT_DOMAIN } from '@worker/testing/tenant/fixtures';
import type { TInactivitySweepEnv } from '@worker/utils/inactivity-sweep/inactivity-sweep-env';

export function mockInactivitySweepEnv(): TInactivitySweepEnv {
  const { platformAppBaseUrl, webAppBaseUrl } = MOCK_PROVISION_ENV;
  return {
    platformAppBaseUrl,
    webAppBaseUrl,
    siteConfigRevalidateSecret: MOCK_SITE_CONFIG_REVALIDATE_SECRET,
    tenantRootDomain: MOCK_TENANT_ROOT_DOMAIN,
  };
}
