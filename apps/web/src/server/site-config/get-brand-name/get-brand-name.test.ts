import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getBrandName } from './get-brand-name';

faker.seed(6760);

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock(
  '@blog/db',
  () => import('@web/testing/server/site-config/site-config-db'),
);

vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/passthrough-next-cache'),
);

const getSiteConfigMock = vi.mocked(queries.siteConfig.getSiteConfig);

const MOCK_BRAND_NAME = faker.company.name();

const SOURCE = { tenantId: MOCK_TENANT_ID, tenantName: MOCK_TENANT_NAME };

describe(getBrandName, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  it("returns the brand name saved on the tenant's Look", async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({ brandName: MOCK_BRAND_NAME }),
    );

    await expect(getBrandName(SOURCE)).resolves.toBe(MOCK_BRAND_NAME);
  });

  it('falls back to the tenant name when Look has no brand name', async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({ brandName: undefined }),
    );

    await expect(getBrandName(SOURCE)).resolves.toBe(MOCK_TENANT_NAME);
  });

  it('falls back to the tenant name when the tenant has no site config', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await expect(getBrandName(SOURCE)).resolves.toBe(MOCK_TENANT_NAME);
  });

  it('falls back to the tenant name and logs when the site config read fails', async () => {
    getSiteConfigMock.mockRejectedValue(MOCK_ERROR);

    await expect(getBrandName(SOURCE)).resolves.toBe(MOCK_TENANT_NAME);
    expect(logger.error).toHaveBeenCalledWith(
      SITE_CONFIG_LOG.BRAND_NAME_FETCH_FAILED,
      { tenantId: MOCK_TENANT_ID, error: MOCK_ERROR },
    );
  });

  it('returns no name without a tenant', async () => {
    await expect(
      getBrandName({ tenantId: undefined, tenantName: undefined }),
    ).resolves.toBeUndefined();
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });
});
