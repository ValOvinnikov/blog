import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { getBrandLogoUrl } from './get-brand-logo-url';

faker.seed(6010);

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

const MOCK_LOGO_URL = faker.image.url();

describe(getBrandLogoUrl, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  it("returns the tenant's Look logo", async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({ logoAssetUrl: MOCK_LOGO_URL }),
    );

    await expect(getBrandLogoUrl(MOCK_TENANT_ID)).resolves.toBe(MOCK_LOGO_URL);
  });

  it('returns no logo when the tenant has no site config', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await expect(getBrandLogoUrl(MOCK_TENANT_ID)).resolves.toBeUndefined();
  });

  it('returns no logo when the site config read fails', async () => {
    getSiteConfigMock.mockRejectedValue(MOCK_ERROR);

    await expect(getBrandLogoUrl(MOCK_TENANT_ID)).resolves.toBeUndefined();
  });
});
