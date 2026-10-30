import {
  BRAND_VARIANT,
  COOKIE_SETTINGS_BUTTON,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
} from '@blog/config';
import { queries } from '@blog/db';
import { FOOTER_LOG } from '@web/constants/footer';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_FOOTER_STYLE } from '@web/testing/shared/footer-style/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getFooterStyle } from './get-footer-style';

vi.mock('@web/server/tenant/request-tenant/request-tenant');
vi.mock('@web/server/settings-features/get-tenant-plan/get-tenant-plan');

vi.mock(
  '@blog/db',
  () => import('@web/testing/server/site-config/site-config-db'),
);

vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/passthrough-next-cache'),
);

const getSiteConfigMock = vi.mocked(queries.siteConfig.getSiteConfig);

describe(getFooterStyle, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  it("returns the tenant's saved layout, background, surface and cookie button", async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({
        footerLayout: FOOTER_LAYOUT.BIG_WORDMARK,
        footerBackground: BRAND_VARIANT.SECONDARY,
        footerSurface: FOOTER_SURFACE.CARD,
        cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN,
      }),
    );

    await expect(getFooterStyle(MOCK_TENANT_ID)).resolves.toEqual({
      layout: FOOTER_LAYOUT.BIG_WORDMARK,
      background: BRAND_VARIANT.SECONDARY,
      surface: FOOTER_SURFACE.CARD,
      cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN,
    });
  });

  it('falls back to Columns, Brand tint, Full width and a hidden cookie button when the tenant has no site config', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await expect(getFooterStyle(MOCK_TENANT_ID)).resolves.toEqual(
      MOCK_FOOTER_STYLE,
    );
  });

  describe('when the site config read fails', () => {
    beforeEach(() => {
      getSiteConfigMock.mockRejectedValue(MOCK_ERROR);
    });

    it('falls back to the preset footer', async () => {
      await expect(getFooterStyle(MOCK_TENANT_ID)).resolves.toEqual(
        MOCK_FOOTER_STYLE,
      );
    });

    it('logs the failure', async () => {
      await getFooterStyle(MOCK_TENANT_ID);

      expect(logger.error).toHaveBeenCalledWith(
        FOOTER_LOG.SITE_CONFIG_FETCH_FAILED,
        { error: MOCK_ERROR },
      );
    });
  });
});
