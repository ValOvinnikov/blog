import { MOCK_MARKETING_TENANT_DOMAIN } from '@shinefold/db/testing/tenant-domains/fixtures';
import { mockInactivitySweepEnv } from '@worker/testing/inactivity-sweep-env/fake-inactivity-sweep-env';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';

import { getInactivitySweepEnv } from './inactivity-sweep-env';

vi.mock('@worker/utils/env/env');

const MOCK_SWEEP_ENV = mockInactivitySweepEnv();

beforeEach(() => {
  mockEnv.PLATFORM_APP_BASE_URL = MOCK_SWEEP_ENV.platformAppBaseUrl;
  mockEnv.WEB_APP_URL = MOCK_SWEEP_ENV.webAppBaseUrl;
  mockEnv.SITE_CONFIG_REVALIDATE_SECRET =
    MOCK_SWEEP_ENV.siteConfigRevalidateSecret;
  mockEnv.TENANT_ROOT_DOMAIN = MOCK_SWEEP_ENV.tenantRootDomain;
  mockEnv.MARKETING_SITE_URL = undefined;
});

describe(getInactivitySweepEnv, () => {
  it('reads the marketing host from the marketing site address', () => {
    mockEnv.MARKETING_SITE_URL = `https://${MOCK_MARKETING_TENANT_DOMAIN}/`;

    expect(getInactivitySweepEnv().marketingHost).toBe(
      MOCK_MARKETING_TENANT_DOMAIN,
    );
  });

  it('leaves the marketing host unset without a marketing site address', () => {
    expect(getInactivitySweepEnv().marketingHost).toBeUndefined();
  });
});
