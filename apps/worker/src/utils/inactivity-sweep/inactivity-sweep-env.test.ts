import { pricingPageUrl } from '@shinefold/config';
import { MOCK_SITE_CONFIG_REVALIDATE_SECRET } from '@worker/testing/deprovision-env/fake-deprovision-env';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import { MOCK_TENANT_ROOT_DOMAIN } from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';

import { getInactivitySweepEnv } from './inactivity-sweep-env';

const MOCK_MARKETING_HOST = `www.${MOCK_TENANT_ROOT_DOMAIN}`;

vi.mock('@worker/utils/env/env');

describe(getInactivitySweepEnv, () => {
  beforeEach(() => {
    mockEnv.PLATFORM_APP_BASE_URL = MOCK_PROVISION_ENV.platformAppBaseUrl;
    mockEnv.WEB_APP_URL = MOCK_PROVISION_ENV.webAppBaseUrl;
    mockEnv.SITE_CONFIG_REVALIDATE_SECRET = MOCK_SITE_CONFIG_REVALIDATE_SECRET;
    mockEnv.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    mockEnv.MARKETING_SITE_URL = undefined;
  });

  it('links the plan comparison on the marketing site when it is configured', () => {
    mockEnv.MARKETING_SITE_URL = `https://${MOCK_MARKETING_HOST}/`;

    expect(getInactivitySweepEnv().pricingPageUrl).toBe(
      pricingPageUrl(MOCK_MARKETING_HOST),
    );
  });

  it('links the plan comparison on the root domain apex otherwise', () => {
    expect(getInactivitySweepEnv().pricingPageUrl).toBe(
      pricingPageUrl(MOCK_TENANT_ROOT_DOMAIN),
    );
  });
});
