import {
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
} from '@blog/config';
import { queries } from '@blog/db';
import { HEADER_STYLE_LOG } from '@web/constants/header-style';
import { mockSiteConfig } from '@web/testing/server/site-config/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_HEADER_STYLE } from '@web/testing/shared/header-style/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { getHeaderStyle } from './get-header-style';

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

describe(getHeaderStyle, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  it("returns the tenant's saved layout, sub-menu style and bar", async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({
        headerLayout: HEADER_LAYOUT.TWO_ROWS,
        headerSubmenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
        headerBarStyle: HEADER_BAR_STYLE.FLOATING,
      }),
    );

    await expect(getHeaderStyle(MOCK_TENANT_ID)).resolves.toEqual({
      layout: HEADER_LAYOUT.TWO_ROWS,
      submenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
      barStyle: HEADER_BAR_STYLE.FLOATING,
    });
  });

  it('falls back to Classic, Dropdown and Full width when the tenant has no site config', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await expect(getHeaderStyle(MOCK_TENANT_ID)).resolves.toEqual(
      MOCK_HEADER_STYLE,
    );
  });

  describe('when the site config read fails', () => {
    beforeEach(() => {
      getSiteConfigMock.mockRejectedValue(MOCK_ERROR);
    });

    it('falls back to Classic, Dropdown and Full width', async () => {
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
