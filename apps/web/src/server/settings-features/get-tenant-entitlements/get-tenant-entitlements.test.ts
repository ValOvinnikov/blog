import { errorResult, okResult } from '@shinefold/utils';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { getCachedTenantEntitlements } from '@web/server/tenant/tenant-entitlements/tenant-entitlements';
import { mockTenantEntitlements } from '@web/testing/server/settings-features/fixtures';
import {
  MOCK_DYNAMIC_SERVER_USAGE_ERROR,
  MOCK_ERROR,
} from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { getTenantEntitlements } from './get-tenant-entitlements';

vi.mock('@web/server/tenant/request-tenant/request-tenant');
vi.mock('@web/server/tenant/tenant-entitlements/tenant-entitlements');

const getCachedTenantEntitlementsMock = vi.mocked(getCachedTenantEntitlements);

describe(getTenantEntitlements, () => {
  it("resolves the request tenant's entitlements", async () => {
    const result = await getTenantEntitlements(MOCK_TENANT_ID);

    expect(result).toEqual(okResult(mockTenantEntitlements()));
    expect(getRequestTenantId).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getCachedTenantEntitlementsMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
  });

  it('resolves no entitlements when the request has no resolvable tenant', async () => {
    vi.mocked(getRequestTenantId).mockResolvedValueOnce(undefined);

    const result = await getTenantEntitlements(MOCK_TENANT_ID);

    expect(result).toEqual(okResult());
    expect(getCachedTenantEntitlementsMock).not.toHaveBeenCalled();
  });

  it('returns the failure when the read rejects', async () => {
    getCachedTenantEntitlementsMock.mockRejectedValueOnce(MOCK_ERROR);

    const result = await getTenantEntitlements(MOCK_TENANT_ID);

    expect(result).toEqual(errorResult(MOCK_ERROR));
  });

  it("rethrows the header read's dynamic-rendering signal", async () => {
    vi.mocked(getRequestTenantId).mockRejectedValueOnce(
      MOCK_DYNAMIC_SERVER_USAGE_ERROR,
    );

    await expect(getTenantEntitlements(MOCK_TENANT_ID)).rejects.toBe(
      MOCK_DYNAMIC_SERVER_USAGE_ERROR,
    );
    expect(getCachedTenantEntitlementsMock).not.toHaveBeenCalled();
  });
});
