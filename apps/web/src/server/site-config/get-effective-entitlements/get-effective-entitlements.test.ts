import { TENANT_PLAN } from '@shinefold/config/constants';
import { errorResult, okResult } from '@shinefold/utils';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getTenantEntitlements } from '@web/server/settings-features/get-tenant-entitlements/get-tenant-entitlements';
import { mockTenantEntitlements } from '@web/testing/server/settings-features/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getEffectiveEntitlements } from './get-effective-entitlements';

vi.mock(
  '@web/server/settings-features/get-tenant-entitlements/get-tenant-entitlements',
);

const getTenantEntitlementsMock = vi.mocked(getTenantEntitlements);

describe(getEffectiveEntitlements, () => {
  it("returns the tenant's entitlements", async () => {
    await expect(getEffectiveEntitlements(MOCK_TENANT_ID)).resolves.toEqual(
      mockTenantEntitlements(),
    );
    expect(getTenantEntitlementsMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it("falls back to Free's when the tenant is unknown", async () => {
    getTenantEntitlementsMock.mockResolvedValueOnce(okResult());

    await expect(getEffectiveEntitlements(MOCK_TENANT_ID)).resolves.toEqual(
      mockTenantEntitlements(TENANT_PLAN.FREE),
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("falls back to Free's and logs when the entitlements cannot be read", async () => {
    getTenantEntitlementsMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(getEffectiveEntitlements(MOCK_TENANT_ID)).resolves.toEqual(
      mockTenantEntitlements(TENANT_PLAN.FREE),
    );
    expect(logger.error).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.PLAN_FETCH_FAILED,
      { error: MOCK_ERROR },
    );
  });
});
