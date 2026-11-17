import { queries } from '@shinefold/db';
import { MOCK_PLAUSIBLE_ANALYTICS } from '@shinefold/db/testing/tenant-analytics/fixtures';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getSiteAnalytics } from './get-site-analytics';

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@shinefold/db', () => ({
  queries: { tenantAnalytics: { getTenantAnalytics: vi.fn() } },
}));

vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/passthrough-next-cache'),
);

const getTenantAnalyticsMock = vi.mocked(
  queries.tenantAnalytics.getTenantAnalytics,
);

describe(getSiteAnalytics, () => {
  beforeEach(() => {
    vi.mocked(getRequestTenantId).mockResolvedValue(MOCK_TENANT_ID);
  });

  it("returns the tenant's analytics tool", async () => {
    getTenantAnalyticsMock.mockResolvedValueOnce(MOCK_PLAUSIBLE_ANALYTICS);

    await expect(getSiteAnalytics(MOCK_TENANT_ID)).resolves.toEqual(
      MOCK_PLAUSIBLE_ANALYTICS,
    );
    expect(getTenantAnalyticsMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('returns nothing when the tenant has no analytics tool', async () => {
    getTenantAnalyticsMock.mockResolvedValueOnce(undefined);

    await expect(getSiteAnalytics(MOCK_TENANT_ID)).resolves.toBeUndefined();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('returns nothing without reading when no tenant resolves', async () => {
    vi.mocked(getRequestTenantId).mockResolvedValueOnce(undefined);

    await expect(getSiteAnalytics(MOCK_TENANT_ID)).resolves.toBeUndefined();
    expect(getTenantAnalyticsMock).not.toHaveBeenCalled();
  });

  it('returns nothing and logs when the read fails', async () => {
    getTenantAnalyticsMock.mockRejectedValueOnce(MOCK_ERROR);

    await expect(getSiteAnalytics(MOCK_TENANT_ID)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.ANALYTICS_FETCH_FAILED,
      { error: MOCK_ERROR },
    );
  });
});
