import { PRESET_ID } from '@blog/config/constants';
import { queries } from '@blog/db';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import {
  MOCK_DYNAMIC_SERVER_USAGE_ERROR,
  MOCK_ERROR,
} from '@web/testing/shared/error/fixtures';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';

import { getSiteConfig } from './get-site-config';

faker.seed(6010);

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@blog/db', () => ({
  queries: {
    siteConfig: { getSiteConfig: vi.fn() },
  },
}));

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

const getSiteConfigMock = vi.mocked(queries.siteConfig.getSiteConfig);

const MOCK_SITE_CONFIG_ROW_A = mockSiteConfig({ tenantId: MOCK_TENANT_ID });

const MOCK_SITE_CONFIG_ROW_B = mockSiteConfig({
  tenantId: MOCK_OTHER_TENANT_ID,
  preset: PRESET_ID.EDITORIAL,
});

describe(getSiteConfig, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  it("resolves each request's own tenant's site_config row", async () => {
    getSiteConfigMock.mockImplementation(async (tenantId) =>
      tenantId === MOCK_TENANT_ID
        ? MOCK_SITE_CONFIG_ROW_A
        : MOCK_SITE_CONFIG_ROW_B,
    );
    vi.mocked(getRequestTenantId)
      .mockResolvedValueOnce(MOCK_TENANT_ID)
      .mockResolvedValueOnce(MOCK_OTHER_TENANT_ID);

    const resultA = await getSiteConfig();
    const resultB = await getSiteConfig();

    expect(resultA).toEqual(okResult(MOCK_SITE_CONFIG_ROW_A));
    expect(resultB).toEqual(okResult(MOCK_SITE_CONFIG_ROW_B));
    expect(getSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getSiteConfigMock).toHaveBeenCalledWith(MOCK_OTHER_TENANT_ID);
  });

  it('resolves no row when the request has no resolvable tenant', async () => {
    vi.mocked(getRequestTenantId).mockResolvedValueOnce(undefined);

    const result = await getSiteConfig();

    expect(result).toEqual(okResult());
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it('reads the request tenant from the supplied tenant', async () => {
    getSiteConfigMock.mockResolvedValue(MOCK_SITE_CONFIG_ROW_A);

    await getSiteConfig(MOCK_TENANT_ID);

    expect(getRequestTenantId).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('returns the failure when the query rejects', async () => {
    getSiteConfigMock.mockRejectedValue(MOCK_ERROR);

    const result = await getSiteConfig();

    expect(result).toEqual(errorResult(MOCK_ERROR));
  });

  it("rethrows the header read's dynamic-rendering signal", async () => {
    vi.mocked(getRequestTenantId).mockRejectedValueOnce(
      MOCK_DYNAMIC_SERVER_USAGE_ERROR,
    );

    await expect(getSiteConfig()).rejects.toBe(MOCK_DYNAMIC_SERVER_USAGE_ERROR);
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });
});
