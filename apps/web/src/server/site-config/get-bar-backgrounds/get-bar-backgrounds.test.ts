import { BRAND_VARIANT } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { BAR_BACKGROUNDS_LOG } from '@web/constants/bar-backgrounds';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { MOCK_BAR_BACKGROUNDS } from '@web/testing/shared/bar-backgrounds/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getBarBackgrounds } from './get-bar-backgrounds';

vi.mock('@web/server/tenant/request-tenant/request-tenant');
vi.mock(
  '@web/server/settings-features/get-tenant-entitlements/get-tenant-entitlements',
);

vi.mock(
  '@shinefold/db',
  () => import('@web/testing/server/site-config/site-config-db'),
);

vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/passthrough-next-cache'),
);

const getSiteConfigMock = vi.mocked(queries.siteConfig.getSiteConfig);

describe(getBarBackgrounds, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  it("returns the tenant's saved breadcrumb background", async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({ breadcrumbBackground: BRAND_VARIANT.SECONDARY }),
    );

    await expect(getBarBackgrounds(MOCK_TENANT_ID)).resolves.toEqual({
      breadcrumb: BRAND_VARIANT.SECONDARY,
    });
  });

  it('falls back to Plain when the tenant has no site config', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await expect(getBarBackgrounds(MOCK_TENANT_ID)).resolves.toEqual(
      MOCK_BAR_BACKGROUNDS,
    );
  });

  describe('when the site config read fails', () => {
    beforeEach(() => {
      getSiteConfigMock.mockRejectedValue(MOCK_ERROR);
    });

    it('falls back to Plain', async () => {
      await expect(getBarBackgrounds(MOCK_TENANT_ID)).resolves.toEqual(
        MOCK_BAR_BACKGROUNDS,
      );
    });

    it('logs the failure', async () => {
      await getBarBackgrounds(MOCK_TENANT_ID);

      expect(logger.error).toHaveBeenCalledWith(
        BAR_BACKGROUNDS_LOG.SITE_CONFIG_FETCH_FAILED,
        { error: MOCK_ERROR },
      );
    });
  });
});
