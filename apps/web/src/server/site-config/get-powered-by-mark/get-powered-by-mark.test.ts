import { faker } from '@faker-js/faker';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { FOOTER_LOG } from '@web/constants/footer';
import { getEffectiveEntitlements } from '@web/server/site-config/get-effective-entitlements/get-effective-entitlements';
import { setMockEnv } from '@web/testing/server/infra/set-mock-env';
import { mockTenantEntitlements } from '@web/testing/server/settings-features/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getPoweredByMark } from './get-powered-by-mark';

vi.mock(
  '@web/server/site-config/get-effective-entitlements/get-effective-entitlements',
);
vi.mock('@web/utils/env/env');

faker.seed(6796);

const MOCK_MARKETING_SITE_URL = faker.internet.url();

const getEffectiveEntitlementsMock = vi.mocked(getEffectiveEntitlements);

describe(getPoweredByMark, () => {
  beforeEach(() => {
    setMockEnv({ MARKETING_SITE_URL: MOCK_MARKETING_SITE_URL });
  });

  it('returns the marketing site on a Free site', async () => {
    getEffectiveEntitlementsMock.mockResolvedValueOnce(
      mockTenantEntitlements(TENANT_PLAN.FREE),
    );

    await expect(getPoweredByMark(MOCK_TENANT_ID)).resolves.toBe(
      MOCK_MARKETING_SITE_URL,
    );
    expect(getEffectiveEntitlementsMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('returns no mark on a Growth site', async () => {
    getEffectiveEntitlementsMock.mockResolvedValueOnce(
      mockTenantEntitlements(TENANT_PLAN.GROWTH),
    );

    await expect(getPoweredByMark(MOCK_TENANT_ID)).resolves.toBeUndefined();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('returns no mark on a Free site and logs when the marketing site address is unset', async () => {
    setMockEnv({});
    getEffectiveEntitlementsMock.mockResolvedValueOnce(
      mockTenantEntitlements(TENANT_PLAN.FREE),
    );

    await expect(getPoweredByMark(MOCK_TENANT_ID)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      FOOTER_LOG.POWERED_BY_UNCONFIGURED,
    );
  });
});
