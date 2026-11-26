import {
  BRAND_VARIANT,
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
} from '@shinefold/config';
import { HEADER_STYLE_LOG } from '@web/constants/header-style';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { getSiteConfigMock } from '@web/testing/server/site-config/site-config-row-edges';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_HEADER_STYLE } from '@web/testing/shared/header-style/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getHeaderStyle } from './get-header-style';

describe(getHeaderStyle, () => {
  it("returns the tenant's saved layout, sub-menu style, bar and background", async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({
        headerLayout: HEADER_LAYOUT.TWO_ROWS,
        headerSubmenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
        headerBarStyle: HEADER_BAR_STYLE.FLOATING,
        headerBackground: BRAND_VARIANT.INK,
      }),
    );

    await expect(getHeaderStyle(MOCK_TENANT_ID)).resolves.toEqual({
      layout: HEADER_LAYOUT.TWO_ROWS,
      submenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
      barStyle: HEADER_BAR_STYLE.FLOATING,
      background: BRAND_VARIANT.INK,
    });
  });

  it('falls back to the preset header when the tenant has no site config', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await expect(getHeaderStyle(MOCK_TENANT_ID)).resolves.toEqual(
      MOCK_HEADER_STYLE,
    );
  });

  describe('when the site config read fails', () => {
    beforeEach(() => {
      getSiteConfigMock.mockRejectedValue(MOCK_ERROR);
    });

    it('falls back to the preset header', async () => {
      await expect(getHeaderStyle(MOCK_TENANT_ID)).resolves.toEqual(
        MOCK_HEADER_STYLE,
      );
    });

    it('logs the failure', async () => {
      await getHeaderStyle(MOCK_TENANT_ID);

      expect(logger.error).toHaveBeenCalledWith(
        HEADER_STYLE_LOG.SITE_CONFIG_FETCH_FAILED,
        { error: MOCK_ERROR },
      );
    });
  });
});
