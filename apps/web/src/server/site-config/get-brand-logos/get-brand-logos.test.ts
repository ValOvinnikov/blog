import { faker } from '@faker-js/faker';
import { queries } from '@shinefold/db';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { getBrandLogos } from './get-brand-logos';

faker.seed(6010);

vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock(
  '@shinefold/db',
  () => import('@web/testing/server/site-config/site-config-db'),
);

vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/passthrough-next-cache'),
);

const getSiteConfigMock = vi.mocked(queries.siteConfig.getSiteConfig);

const [MOCK_LOGO_URL, MOCK_DARK_LOGO_URL] = faker.helpers.uniqueArray(
  faker.image.url,
  2,
);

describe(getBrandLogos, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  it("returns the tenant's Look logo and dark-mode logo", async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({
        logoAssetUrl: MOCK_LOGO_URL,
        logoDarkAssetUrl: MOCK_DARK_LOGO_URL,
      }),
    );

    await expect(getBrandLogos(MOCK_TENANT_ID)).resolves.toEqual({
      logoUrl: MOCK_LOGO_URL,
      darkLogoUrl: MOCK_DARK_LOGO_URL,
    });
  });

  it('returns no dark-mode logo when the tenant has only a main logo', async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({ logoAssetUrl: MOCK_LOGO_URL }),
    );

    await expect(getBrandLogos(MOCK_TENANT_ID)).resolves.toEqual({
      logoUrl: MOCK_LOGO_URL,
      darkLogoUrl: undefined,
    });
  });

  it('returns no logos when the tenant has no site config', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await expect(getBrandLogos(MOCK_TENANT_ID)).resolves.toEqual({});
  });

  it('returns no logos when the site config read fails', async () => {
    getSiteConfigMock.mockRejectedValue(MOCK_ERROR);

    await expect(getBrandLogos(MOCK_TENANT_ID)).resolves.toEqual({});
  });
});
